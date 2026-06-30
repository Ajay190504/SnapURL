package com.snapurl.backend.service;

import com.snapurl.backend.dto.ShortenRequest;
import com.snapurl.backend.dto.ShortLinkResponse;
import com.snapurl.backend.model.ShortLink;
import com.snapurl.backend.repository.ClickEventRepository;
import com.snapurl.backend.repository.ShortLinkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import com.snapurl.backend.config.UserContext;

@Service
public class ShortLinkService {

    private static final Logger log = LoggerFactory.getLogger(ShortLinkService.class);
    private static final String CACHE_PREFIX = "link:";
    private static final long DEFAULT_CACHE_TTL_HOURS = 24;

    private final AtomicLong cacheHits = new AtomicLong();
    private final AtomicLong cacheMisses = new AtomicLong();

    public long getCacheHits() {
        return cacheHits.get();
    }

    public long getCacheMisses() {
        return cacheMisses.get();
    }

    @Autowired
    private ShortLinkRepository shortLinkRepository;

    @Autowired
    private ClickEventRepository clickEventRepository;

    @Autowired
    private Base62Encoder base62Encoder;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Resolves short code to long URL using Cache-Aside (lazy loading).
     * If Redis is down, it fails back to MySQL database lookup.
     */
    @Transactional(readOnly = true)
    public String getLongUrl(String shortCode) {
        // 1. Try fetching from cache
        String cacheKey = CACHE_PREFIX + shortCode;
        String cachedUrl = getFromCacheSafely(cacheKey);
        
        if (cachedUrl != null) {
            log.debug("Cache HIT for shortCode: {}", shortCode);
            cacheHits.incrementAndGet();
            return cachedUrl;
        }

        log.debug("Cache MISS for shortCode: {}", shortCode);
        cacheMisses.incrementAndGet();

        // 2. Fetch from DB
        ShortLink shortLink = shortLinkRepository.findByShortCodeAndIsActiveTrue(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found or inactive"));

        // Check expiration
        if (shortLink.getExpiresAt() != null && shortLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Soft delete expired link
            shortLink.setActive(false);
            shortLinkRepository.save(shortLink);
            evictCacheSafely(cacheKey);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL has expired");
        }

        // 3. Cache the result (Cache-Aside)
        long ttlSeconds = DEFAULT_CACHE_TTL_HOURS * 3600;
        if (shortLink.getExpiresAt() != null) {
            long secondsUntilExpiry = Duration.between(LocalDateTime.now(), shortLink.getExpiresAt()).getSeconds();
            ttlSeconds = Math.min(ttlSeconds, secondsUntilExpiry);
        }
        
        if (ttlSeconds > 0) {
            putInCacheSafely(cacheKey, shortLink.getLongUrl(), ttlSeconds);
        }

        return shortLink.getLongUrl();
    }

    /**
     * Creates a new short link, persisting to MySQL and writing directly to Redis cache.
     */
    @Transactional
    public ShortLinkResponse shortenLink(ShortenRequest request, String createdBy) {
        String customAlias = request.getCustomAlias();
        
        // 1. Check custom alias uniqueness
        if (customAlias != null && !customAlias.trim().isEmpty()) {
            customAlias = customAlias.trim();
            if (shortLinkRepository.existsByShortCode(customAlias)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alias already in use");
            }
        }

        // 2. Build ShortLink entity
        ShortLink shortLink = ShortLink.builder()
                .longUrl(request.getLongUrl())
                .customAlias(customAlias != null && !customAlias.isEmpty())
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .isActive(true)
                .shortCode(customAlias != null ? customAlias : "PENDING") // placeholder for non-custom alias
                .build();

        shortLink = shortLinkRepository.save(shortLink);

        // 3. Derive short code if not custom
        if (!shortLink.isCustomAlias()) {
            String shortCode = base62Encoder.encode(shortLink.getId());
            shortLink.setShortCode(shortCode);
            shortLink = shortLinkRepository.save(shortLink);
        }

        // 4. Cache Write-Through: Cache immediately on creation
        String cacheKey = CACHE_PREFIX + shortLink.getShortCode();
        long ttlSeconds = DEFAULT_CACHE_TTL_HOURS * 3600;
        if (shortLink.getExpiresAt() != null) {
            long secondsUntilExpiry = Duration.between(LocalDateTime.now(), shortLink.getExpiresAt()).getSeconds();
            ttlSeconds = Math.min(ttlSeconds, secondsUntilExpiry);
        }
        
        if (ttlSeconds > 0) {
            putInCacheSafely(cacheKey, shortLink.getLongUrl(), ttlSeconds);
        }

        return convertToResponse(shortLink);
    }

    /**
     * Lists current links (paginated).
     */
    @Transactional(readOnly = true)
    public Page<ShortLinkResponse> getAllLinks(Pageable pageable) {
        String currentUser = UserContext.getCurrentUser();
        String createdBy = currentUser != null ? currentUser : "Anonymous";
        return shortLinkRepository.findByCreatedByAndIsActiveTrue(createdBy, pageable)
                .map(this::convertToResponse);
    }

    /**
     * Updates an existing link (changes URL or expiration) and invalidates Redis cache.
     */
    @Transactional
    public ShortLinkResponse updateLink(String shortCode, ShortenRequest request) {
        ShortLink shortLink = shortLinkRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short link not found"));

        String currentUser = UserContext.getCurrentUser();
        String owner = shortLink.getCreatedBy() != null ? shortLink.getCreatedBy() : "Anonymous";
        String requester = currentUser != null ? currentUser : "Anonymous";
        if (!owner.equals(requester)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this link");
        }

        if (!shortLink.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot update inactive link");
        }

        shortLink.setLongUrl(request.getLongUrl());
        shortLink.setExpiresAt(request.getExpiresAt());
        shortLink = shortLinkRepository.save(shortLink);

        // Evict Cache to prevent stale reads
        evictCacheSafely(CACHE_PREFIX + shortCode);

        // Write-through update
        long ttlSeconds = DEFAULT_CACHE_TTL_HOURS * 3600;
        if (shortLink.getExpiresAt() != null) {
            long secondsUntilExpiry = Duration.between(LocalDateTime.now(), shortLink.getExpiresAt()).getSeconds();
            ttlSeconds = Math.min(ttlSeconds, secondsUntilExpiry);
        }
        if (ttlSeconds > 0) {
            putInCacheSafely(CACHE_PREFIX + shortCode, shortLink.getLongUrl(), ttlSeconds);
        }

        return convertToResponse(shortLink);
    }

    /**
     * Toggles the active status of a link (acts as soft delete / restore) and invalidates Cache.
     */
    @Transactional
    public void toggleActiveStatus(String shortCode, boolean active) {
        ShortLink shortLink = shortLinkRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short link not found"));

        String currentUser = UserContext.getCurrentUser();
        String owner = shortLink.getCreatedBy() != null ? shortLink.getCreatedBy() : "Anonymous";
        String requester = currentUser != null ? currentUser : "Anonymous";
        if (!owner.equals(requester)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this link");
        }

        shortLink.setActive(active);
        shortLinkRepository.save(shortLink);

        // Cache Invalidation
        evictCacheSafely(CACHE_PREFIX + shortCode);
    }

    /**
     * Deactivates a link (soft-delete) and invalidates Cache.
     */
    @Transactional
    public void deleteLink(String shortCode) {
        toggleActiveStatus(shortCode, false);
    }

    // Helper to map DB Entity to Response DTO
    private ShortLinkResponse convertToResponse(ShortLink shortLink) {
        long clicks = clickEventRepository.countByShortLinkId(shortLink.getId());
        return ShortLinkResponse.builder()
                .id(shortLink.getId())
                .shortCode(shortLink.getShortCode())
                .shortUrl(baseUrl + "/" + shortLink.getShortCode())
                .longUrl(shortLink.getLongUrl())
                .customAlias(shortLink.isCustomAlias())
                .createdAt(shortLink.getCreatedAt())
                .expiresAt(shortLink.getExpiresAt())
                .active(shortLink.isActive())
                .clicks(clicks)
                .build();
    }

    // --- Resilient Redis Caching Access Helpers ---

    private String getFromCacheSafely(String key) {
        if (redisTemplate == null) return null;
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Redis is DOWN - Reading from cache failed. Querying DB directly. Error: {}", e.getMessage());
            return null;
        }
    }

    private void putInCacheSafely(String key, String value, long ttlSeconds) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
            log.debug("Successfully cached key: {} for {}s", key, ttlSeconds);
        } catch (Exception e) {
            log.warn("Redis is DOWN - Writing to cache failed. Error: {}", e.getMessage());
        }
    }

    public void evictCacheSafely(String key) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.delete(key);
            log.debug("Successfully evicted key from cache: {}", key);
        } catch (Exception e) {
            log.warn("Redis is DOWN - Evicting cache failed. Error: {}", e.getMessage());
        }
    }
}
