package com.snapurl.backend.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.Bucket4jLettuce;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    private static final Logger log = LoggerFactory.getLogger(RateLimitConfig.class);

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Bean
    public ProxyManager<String> proxyManager() {
        log.info("Initializing Redis-backed Bucket4j ProxyManager");
        try {
            String redisUri = "redis://" + 
                (!redisPassword.isEmpty() ? ":" + redisPassword + "@" : "") + 
                redisHost + ":" + redisPort;
            
            RedisClient redisClient = RedisClient.create(redisUri);
            StatefulRedisConnection<String, byte[]> connection = redisClient.connect(
                RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE)
            );
            
            return Bucket4jLettuce.casBasedBuilder(connection)
                .expirationAfterWrite(
                    ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofMinutes(10))
                )
                .build();
        } catch (Exception e) {
            log.error("Failed to connect to Redis for Rate Limiting. ProxyManager bean will not be available. Falling back to local rate limiting.", e);
            return null;
        }
    }
}
