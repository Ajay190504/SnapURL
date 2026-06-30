package com.snapurl.backend.controller;

import com.snapurl.backend.dto.SystemStatsResponse;
import com.snapurl.backend.service.ShortLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.Executor;

@RestController
@RequestMapping("/api/monitor")
@CrossOrigin(origins = "*")
@Tag(name = "System Performance Monitor", description = "Endpoints for inspecting live system resources, caching metrics, and thread queues")
public class MonitorController {

    private static final Logger log = LoggerFactory.getLogger(MonitorController.class);

    @Autowired
    private ShortLinkService shortLinkService;

    @Autowired
    @Qualifier("clickExecutor")
    private Executor clickExecutor;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @GetMapping("/stats")
    @Operation(summary = "Get live system performance", description = "Inspects RAM, Redis connection state, DB state, Cache Hit ratio, and Async Logging queues")
    public ResponseEntity<SystemStatsResponse> getSystemStats() {
        // 1. JVM Memory Metrics (MB)
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory() / (1024 * 1024);
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;

        // 2. Cache Hit Metrics
        long hits = shortLinkService.getCacheHits();
        long misses = shortLinkService.getCacheMisses();
        double ratio = (hits + misses == 0) ? 0.0 : ((double) hits / (hits + misses)) * 100.0;

        // 3. Thread Pool Metrics
        int activeThreads = 0;
        int queueSize = 0;
        if (clickExecutor instanceof ThreadPoolTaskExecutor) {
            ThreadPoolTaskExecutor taskExecutor = (ThreadPoolTaskExecutor) clickExecutor;
            activeThreads = taskExecutor.getActiveCount();
            queueSize = taskExecutor.getThreadPoolExecutor().getQueue().size();
        }

        // 4. Check Database connection status
        String databaseStatus = "DOWN";
        try {
            Integer val = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (val != null && val == 1) {
                databaseStatus = "UP";
            }
        } catch (Exception e) {
            log.warn("Database health check failed: {}", e.getMessage());
        }

        // 5. Check Redis connection status
        String redisStatus = "DOWN";
        if (redisTemplate != null) {
            try {
                String pong = redisTemplate.getConnectionFactory().getConnection().ping();
                if ("PONG".equalsIgnoreCase(pong)) {
                    redisStatus = "UP";
                }
            } catch (Exception e) {
                log.debug("Redis health check failed (expected if Redis is offline): {}", e.getMessage());
            }
        }

        SystemStatsResponse stats = SystemStatsResponse.builder()
                .maxMemoryMb(maxMemory)
                .totalMemoryMb(totalMemory)
                .freeMemoryMb(freeMemory)
                .usedMemoryMb(usedMemory)
                .cacheHits(hits)
                .cacheMisses(misses)
                .cacheHitRatio(ratio)
                .activeThreads(activeThreads)
                .queueSize(queueSize)
                .databaseStatus(databaseStatus)
                .redisStatus(redisStatus)
                .build();

        return ResponseEntity.ok(stats);
    }
}
