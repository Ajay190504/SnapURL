package com.snapurl.backend.controller;

import com.snapurl.backend.service.AnalyticsService;
import com.snapurl.backend.service.ShortLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@Tag(name = "Redirection Hot Path", description = "Endpoints for handling high-performance URL redirection")
public class RedirectController {

    private static final Logger log = LoggerFactory.getLogger(RedirectController.class);

    @Autowired
    private ShortLinkService shortLinkService;

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/{code}")
    @Operation(summary = "Redirect short link", description = "Redirects the request to the mapped long URL using Cache-Aside caching")
    public ResponseEntity<Void> redirect(
            @PathVariable("code") String code,
            HttpServletRequest request) {
        
        log.debug("Received redirect request for shortCode: {}", code);
        
        // 1. Fetch long URL (uses Redis cache, falls back to DB)
        String longUrl = shortLinkService.getLongUrl(code);

        // 2. Extract analytics details
        String clientIp = getClientIp(request);
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        String referrer = request.getHeader(HttpHeaders.REFERER);

        // 3. Log analytics asynchronously (non-blocking thread pool execution)
        analyticsService.logClickAsync(code, clientIp, userAgent, referrer);

        // 4. Return 302 redirect
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(longUrl))
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // First IP in the comma-separated chain is the real client IP
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
