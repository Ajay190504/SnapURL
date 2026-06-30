package com.snapurl.backend.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    @Autowired(required = false)
    private ProxyManager<String> proxyManager;

    @Value("${app.hash-salt}")
    private String hashSalt;

    // Resilient local fallback when Redis is offline
    private final Map<String, Bucket> localBuckets = new ConcurrentHashMap<>();

    // 10 creations per minute
    private static final int CREATE_LIMIT = 10;
    // 1000 redirects per minute (high-scale)
    private static final int REDIRECT_LIMIT = 1000;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // 1. Identify limit type and capacity
        String limitType = null;
        int capacity = 0;

        if (path.equals("/api/links") && method.equalsIgnoreCase("POST")) {
            limitType = "create";
            capacity = CREATE_LIMIT;
        } else if (isRedirectPath(path)) {
            limitType = "redirect";
            capacity = REDIRECT_LIMIT;
        }

        // If not matching rate-limited endpoints, proceed directly
        if (limitType == null) {
            chain.doFilter(request, response);
            return;
        }

        // 2. Extract and hash IP
        String rawIp = getClientIp(httpRequest);
        String ipHash = hashIp(rawIp);
        String bucketKey = "rate:" + limitType + ":" + ipHash;

        // 3. Resolve bucket (Redis-backed distributed, with local fallback)
        Bucket bucket = resolveBucket(bucketKey, capacity);

        // 4. Try consume token
        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            log.warn("Rate limit EXCEEDED for IP: {} (hash: {}) on endpoint: {}", rawIp, ipHash, path);
            send429Error(httpResponse);
        }
    }

    private Bucket resolveBucket(String key, int capacity) {
        // If Redis ProxyManager is configured and working
        if (proxyManager != null) {
            try {
                BucketConfiguration config = BucketConfiguration.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(capacity)
                                .refillIntervally(capacity, Duration.ofMinutes(1))
                                .build())
                        .build();
                return proxyManager.builder().build(key, config);
            } catch (Exception e) {
                log.warn("Redis ProxyManager call failed (Redis likely down). Falling back to local in-memory bucket for key: {}. Error: {}", key, e.getMessage());
            }
        }

        // Local fallback (in-memory rate limiting)
        return localBuckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(capacity)
                        .refillIntervally(capacity, Duration.ofMinutes(1))
                        .build())
                .build());
    }

    private boolean isRedirectPath(String path) {
        if (path == null || path.equals("/") || path.isEmpty()) return false;
        
        // Exclude system paths
        if (path.startsWith("/api/") || 
            path.startsWith("/actuator") || 
            path.startsWith("/swagger-ui") || 
            path.startsWith("/v3/api-docs") || 
            path.equals("/favicon.ico") || 
            path.endsWith(".png") || 
            path.endsWith(".js") || 
            path.endsWith(".css")) {
            return false;
        }
        
        // Redirections are usually single-level codes e.g. /abc123
        String[] segments = path.split("/");
        return segments.length == 2; // [/ , code]
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String hashIp(String ip) {
        if (ip == null || ip.isEmpty()) return "Unknown";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String ipWithSalt = ip + hashSalt;
            byte[] encodedhash = digest.digest(ipWithSalt.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(ip.hashCode());
        }
    }

    private void send429Error(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", "60"); // Advise user to retry in 60s
        
        String jsonPayload = "{"
                + "\"timestamp\":\"" + java.time.LocalDateTime.now() + "\","
                + "\"status\":429,"
                + "\"error\":\"Too Many Requests\","
                + "\"message\":\"Rate limit exceeded. Please try again in a minute.\""
                + "}";
        response.getWriter().write(jsonPayload);
    }
}
