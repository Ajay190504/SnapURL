package com.snapurl.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "short_links", indexes = {
        @Index(name = "idx_short_code", columnList = "shortCode", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShortLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String shortCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String longUrl;

    @Column(nullable = false)
    private boolean customAlias;

    private String createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean isActive;
}
