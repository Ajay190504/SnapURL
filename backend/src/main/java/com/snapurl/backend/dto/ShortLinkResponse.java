package com.snapurl.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ShortLinkResponse {
    private Long id;
    private String shortCode;
    private String shortUrl;
    private String longUrl;
    private boolean customAlias;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean active;
    private long clicks;
}
