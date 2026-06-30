package com.snapurl.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "click_events", indexes = {
        @Index(name = "idx_click_link_id", columnList = "shortLinkId"),
        @Index(name = "idx_click_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClickEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long shortLinkId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String ipHash;

    private String userAgent;

    private String referrer;
}
