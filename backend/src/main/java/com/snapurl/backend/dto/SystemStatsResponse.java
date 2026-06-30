package com.snapurl.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemStatsResponse {
    // JVM Metrics (in MB)
    private long maxMemoryMb;
    private long totalMemoryMb;
    private long freeMemoryMb;
    private long usedMemoryMb;

    // Cache metrics
    private long cacheHits;
    private long cacheMisses;
    private double cacheHitRatio;

    // Thread pool metrics
    private int activeThreads;
    private int queueSize;

    // Dependency health
    private String databaseStatus;
    private String redisStatus;
}
