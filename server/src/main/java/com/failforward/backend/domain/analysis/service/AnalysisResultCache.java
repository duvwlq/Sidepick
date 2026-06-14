package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.common.config.AnalysisCacheProperties;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisRequest;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AnalysisResultCache {

    private final Duration ttl;
    private final int maxEntries;
    private final ConcurrentMap<String, CacheEntry> entries = new ConcurrentHashMap<>();
    private final AtomicLong hitCount = new AtomicLong();
    private final AtomicLong missCount = new AtomicLong();

    public AnalysisResultCache(AnalysisCacheProperties properties) {
        this.ttl = Duration.ofHours(Math.max(1, properties.ttlHours()));
        this.maxEntries = Math.max(100, properties.maxEntries());
    }

    public Optional<AiAnalysisResponse> get(AiAnalysisRequest request) {
        String key = buildKey(request);
        CacheEntry entry = entries.get(key);
        if (entry == null) {
            long misses = missCount.incrementAndGet();
            log.info("analysis_cache_miss key={} hits={} misses={}", shorten(key), hitCount.get(), misses);
            return Optional.empty();
        }
        if (entry.expiresAt().isBefore(Instant.now())) {
            entries.remove(key, entry);
            long misses = missCount.incrementAndGet();
            log.info("analysis_cache_expired key={} hits={} misses={}", shorten(key), hitCount.get(), misses);
            return Optional.empty();
        }

        long hits = hitCount.incrementAndGet();
        log.info("analysis_cache_hit key={} hits={} misses={}", shorten(key), hits, missCount.get());
        return Optional.of(entry.response());
    }

    public void put(AiAnalysisRequest request, AiAnalysisResponse response) {
        if (entries.size() >= maxEntries) {
            evictExpiredEntries();
        }
        if (entries.size() >= maxEntries) {
            String oldestKey = entries.entrySet().stream()
                    .min((left, right) -> left.getValue().createdAt().compareTo(right.getValue().createdAt()))
                    .map(java.util.Map.Entry::getKey)
                    .orElse(null);
            if (oldestKey != null) {
                entries.remove(oldestKey);
            }
        }

        String key = buildKey(request);
        entries.put(key, new CacheEntry(response, Instant.now(), Instant.now().plus(ttl)));
        log.info("analysis_cache_store key={} size={}", shorten(key), entries.size());
    }

    private void evictExpiredEntries() {
        Instant now = Instant.now();
        entries.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private String buildKey(AiAnalysisRequest request) {
        String canonical = String.join("|",
                safe(request.category()),
                String.join(",", normalizeList(request.difficulties())),
                safe(request.difficultyEtc()),
                safe(request.difficultyExtra()),
                String.valueOf(request.durationMonths()),
                String.valueOf(request.weeklyHours()),
                safe(request.freeText()));
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(canonical.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private List<String> normalizeList(List<String> values) {
        return values == null ? List.of() : values.stream().map(this::safe).toList();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim().replace("\r", "").replace("\n", " ");
    }

    private String shorten(String key) {
        return key.substring(0, Math.min(12, key.length()));
    }

    private record CacheEntry(
            AiAnalysisResponse response,
            Instant createdAt,
            Instant expiresAt
    ) {
    }
}
