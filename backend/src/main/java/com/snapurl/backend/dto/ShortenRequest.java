package com.snapurl.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ShortenRequest {

    @NotBlank(message = "Long URL is required")
    private String longUrl;

    private String customAlias;

    private LocalDateTime expiresAt;
}
