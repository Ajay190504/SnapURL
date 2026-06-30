package com.snapurl.backend.service;

import com.snapurl.backend.dto.LinkStatsResponse;
import com.snapurl.backend.model.ClickEvent;
import com.snapurl.backend.model.ShortLink;
import com.snapurl.backend.repository.ClickEventRepository;
import com.snapurl.backend.repository.ShortLinkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    @Autowired
    private ClickEventRepository clickEventRepository;

    @Autowired
    private ShortLinkRepository shortLinkRepository;

    @Value("${app.hash-salt}")
    private String hashSalt;

    /**
     * Persists click details asynchronously on a decoupled thread pool.
     * This ensures the redirect path is completely non-blocking.
     */
    @Async("clickExecutor")
    @Transactional
    public void logClickAsync(String shortCode, String clientIp, String userAgentHeader, String referrerHeader) {
        log.debug("Async logging click for shortCode: {} in thread: {}", shortCode, Thread.currentThread().getName());
        try {
            // Find ShortLink
            Optional<ShortLink> shortLinkOpt = shortLinkRepository.findByShortCode(shortCode);
            if (shortLinkOpt.isEmpty()) {
                log.warn("Attempted to log click for non-existent shortCode: {}", shortCode);
                return;
            }
            ShortLink shortLink = shortLinkOpt.get();

            // Hash IP for privacy
            String ipHash = hashIp(clientIp);

            // Parse simple Device details from User Agent
            String deviceType = parseDeviceType(userAgentHeader);

            // Clean Referrer
            String referrer = cleanReferrer(referrerHeader);

            // Create and save event
            ClickEvent clickEvent = ClickEvent.builder()
                    .shortLinkId(shortLink.getId())
                    .timestamp(LocalDateTime.now())
                    .ipHash(ipHash)
                    .userAgent(deviceType)
                    .referrer(referrer)
                    .build();

            clickEventRepository.save(clickEvent);
            log.debug("Successfully persisted ClickEvent for shortCode: {}", shortCode);
        } catch (Exception e) {
            log.error("Failed to log ClickEvent asynchronously for shortCode: {}", shortCode, e);
        }
    }

    /**
     * Aggregates stats for the last 30 days and parses referrers/devices.
     */
    @Transactional(readOnly = true)
    public LinkStatsResponse getLinkStats(String shortCode) {
        ShortLink shortLink = shortLinkRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short link not found"));

        long totalClicks = clickEventRepository.countByShortLinkId(shortLink.getId());

        // 1. Clicks over time (last 30 days) with padding for missing dates
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Object[]> rawDailyClicks = clickEventRepository.findClicksByDay(shortLink.getId(), since);
        Map<String, Long> dailyClicksMap = rawDailyClicks.stream()
                .collect(Collectors.toMap(
                        row -> row[0].toString(),
                        row -> ((Number) row[1]).longValue(),
                        (v1, v2) -> v1
                ));

        List<LinkStatsResponse.DailyClickCount> clicksOverTime = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 30; i >= 0; i--) {
            String dateStr = LocalDate.now().minusDays(i).format(formatter);
            long count = dailyClicksMap.getOrDefault(dateStr, 0L);
            clicksOverTime.add(new LinkStatsResponse.DailyClickCount(dateStr, count));
        }

        // 2. Referrer metrics
        List<Object[]> rawReferrers = clickEventRepository.findReferrerStats(shortLink.getId());
        List<LinkStatsResponse.ReferrerCount> referrers = rawReferrers.stream()
                .map(row -> new LinkStatsResponse.ReferrerCount(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        // 3. Device/OS metrics
        List<Object[]> rawUserAgents = clickEventRepository.findUserAgentStats(shortLink.getId());
        List<LinkStatsResponse.DeviceCount> devices = rawUserAgents.stream()
                .map(row -> new LinkStatsResponse.DeviceCount(
                        row[0] != null ? row[0].toString() : "Unknown",
                        ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());

        return LinkStatsResponse.builder()
                .shortCode(shortLink.getShortCode())
                .longUrl(shortLink.getLongUrl())
                .totalClicks(totalClicks)
                .clicksOverTime(clicksOverTime)
                .referrers(referrers)
                .devices(devices)
                .build();
    }

    // --- Helpers ---

    private String hashIp(String ip) {
        if (ip == null || ip.isEmpty()) return "Unknown";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String ipWithSalt = ip + hashSalt;
            byte[] encodedhash = digest.digest(ipWithSalt.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString().substring(0, 16); // Store truncated hash for compactness
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not found", e);
            return String.valueOf(ip.hashCode());
        }
    }

    private String parseDeviceType(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) return "Desktop";
        String ua = userAgent.toLowerCase();
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone") || ua.contains("ipod")) {
            if (ua.contains("ipad") || ua.contains("tablet")) {
                return "Tablet";
            }
            return "Mobile";
        }
        return "Desktop";
    }

    private String cleanReferrer(String referrer) {
        if (referrer == null || referrer.isEmpty()) return "Direct";
        try {
            // Simplify URLs (e.g. https://t.co/xyz -> t.co)
            String cleaned = referrer;
            if (cleaned.startsWith("http://")) cleaned = cleaned.substring(7);
            else if (cleaned.startsWith("https://")) cleaned = cleaned.substring(8);
            
            int slashIndex = cleaned.indexOf("/");
            if (slashIndex != -1) {
                cleaned = cleaned.substring(0, slashIndex);
            }
            
            // Map common ones to nice names
            if (cleaned.contains("t.co") || cleaned.contains("twitter.com")) return "Twitter/X";
            if (cleaned.contains("linkedin.com")) return "LinkedIn";
            if (cleaned.contains("facebook.com")) return "Facebook";
            if (cleaned.contains("github.com")) return "GitHub";
            if (cleaned.contains("google.com")) return "Google";
            
            return cleaned;
        } catch (Exception e) {
            return "Referral";
        }
    }
}
