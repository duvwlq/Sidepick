package com.failforward.backend.domain.agenta.service;

import com.failforward.backend.common.api.RateLimitExceededException;
import com.failforward.backend.common.config.AgentAProperties;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class AgentARateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final AgentAProperties properties;
    private final Map<Long, Deque<Instant>> requestHistory = new ConcurrentHashMap<>();

    public AgentARateLimiter(AgentAProperties properties) {
        this.properties = properties;
    }

    public void checkLimit(Long userId) {
        Instant now = Instant.now();
        Deque<Instant> timestamps = requestHistory.computeIfAbsent(userId, unused -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(now.minus(WINDOW))) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= properties.rateLimitPerMin()) {
                throw new RateLimitExceededException("Too many Agent A requests. Please try again later.");
            }
            timestamps.addLast(now);
        }
    }
}
