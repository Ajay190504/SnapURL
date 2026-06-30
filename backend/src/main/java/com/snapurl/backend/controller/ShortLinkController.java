package com.snapurl.backend.controller;

import com.snapurl.backend.dto.LinkStatsResponse;
import com.snapurl.backend.dto.ShortenRequest;
import com.snapurl.backend.dto.ShortLinkResponse;
import com.snapurl.backend.service.AnalyticsService;
import com.snapurl.backend.service.ShortLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/links")
@CrossOrigin(origins = "*")
@Tag(name = "Short Link Operations", description = "CRUD operations and statistics for URL mappings")
public class ShortLinkController {

    @Autowired
    private ShortLinkService shortLinkService;

    @Autowired
    private AnalyticsService analyticsService;

    @PostMapping
    @Operation(summary = "Create short link", description = "Creates a Base62 shortened link or applies a custom alias")
    public ResponseEntity<ShortLinkResponse> shortenLink(
            @Valid @RequestBody ShortenRequest request) {
        
        String currentUser = com.snapurl.backend.config.UserContext.getCurrentUser();
        String createdBy = currentUser != null ? currentUser : "Anonymous";
        ShortLinkResponse response = shortLinkService.shortenLink(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List current links", description = "Returns a paginated list of active shortened links")
    public ResponseEntity<Page<ShortLinkResponse>> getAllLinks(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ShortLinkResponse> response = shortLinkService.getAllLinks(pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{code}")
    @Operation(summary = "Update a short link", description = "Updates the target URL or expiration of a code, invalidating cache")
    public ResponseEntity<ShortLinkResponse> updateLink(
            @PathVariable("code") String code,
            @Valid @RequestBody ShortenRequest request) {
        
        ShortLinkResponse response = shortLinkService.updateLink(code, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{code}")
    @Operation(summary = "Soft-deactivates short link", description = "Deactivates a short link code and invalidates cache")
    public ResponseEntity<Void> deleteLink(@PathVariable("code") String code) {
        shortLinkService.deleteLink(code);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{code}/toggle")
    @Operation(summary = "Toggle active status", description = "Enables/disables a short link and invalidates cache")
    public ResponseEntity<Void> toggleActive(
            @PathVariable("code") String code,
            @RequestParam("active") boolean active) {
        shortLinkService.toggleActiveStatus(code, active);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{code}/stats")
    @Operation(summary = "Get link statistics", description = "Provides daily click counts over the last 30 days and browser/referrer breakdown")
    public ResponseEntity<LinkStatsResponse> getLinkStats(@PathVariable("code") String code) {
        LinkStatsResponse response = analyticsService.getLinkStats(code);
        return ResponseEntity.ok(response);
    }
}
