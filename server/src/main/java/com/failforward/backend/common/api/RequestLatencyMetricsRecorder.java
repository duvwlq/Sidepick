package com.failforward.backend.common.api;

import com.failforward.backend.common.config.LatencyMetricsProperties;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class RequestLatencyMetricsRecorder {

    private final ConcurrentHashMap<String, EndpointWindow> endpointWindows = new ConcurrentHashMap<>();
    private final int maxSamplesPerEndpoint;
    private final int maxEndpoints;

    public RequestLatencyMetricsRecorder(LatencyMetricsProperties properties) {
        this.maxSamplesPerEndpoint = properties.maxSamplesPerEndpoint();
        this.maxEndpoints = properties.maxEndpoints();
    }

    public void record(String endpointKey, long elapsedTimeMs) {
        if (endpointKey == null || endpointKey.isBlank()) {
            return;
        }

        if (endpointWindows.size() >= maxEndpoints && !endpointWindows.containsKey(endpointKey)) {
            return;
        }

        endpointWindows.computeIfAbsent(endpointKey, ignored -> new EndpointWindow(maxSamplesPerEndpoint))
                .add(elapsedTimeMs);
    }

    public RequestLatencyMetricsSnapshot snapshot() {
        List<RequestLatencyMetricsSnapshot.EndpointLatencyMetric> endpoints = endpointWindows.entrySet().stream()
                .map(entry -> entry.getValue().snapshot(entry.getKey()))
                .sorted(Comparator.comparingLong(RequestLatencyMetricsSnapshot.EndpointLatencyMetric::p95Ms)
                        .reversed()
                        .thenComparing(RequestLatencyMetricsSnapshot.EndpointLatencyMetric::count, Comparator.reverseOrder())
                        .thenComparing(RequestLatencyMetricsSnapshot.EndpointLatencyMetric::endpoint))
                .toList();

        long totalSamples = endpoints.stream()
                .mapToLong(RequestLatencyMetricsSnapshot.EndpointLatencyMetric::count)
                .sum();

        return new RequestLatencyMetricsSnapshot(totalSamples, endpoints);
    }

    public record RequestLatencyMetricsSnapshot(
            long totalSamples,
            List<EndpointLatencyMetric> endpoints
    ) {

        public record EndpointLatencyMetric(
                String endpoint,
                long count,
                long averageMs,
                long p50Ms,
                long p95Ms,
                long p99Ms,
                long maxMs
        ) {
        }
    }

    private static final class EndpointWindow {

        private final int maxSamples;
        private final Deque<Long> samples = new ArrayDeque<>();

        private EndpointWindow(int maxSamples) {
            this.maxSamples = maxSamples;
        }

        private synchronized void add(long elapsedTimeMs) {
            if (samples.size() >= maxSamples) {
                samples.removeFirst();
            }
            samples.addLast(Math.max(0L, elapsedTimeMs));
        }

        private synchronized RequestLatencyMetricsSnapshot.EndpointLatencyMetric snapshot(String endpoint) {
            List<Long> sortedSamples = new ArrayList<>(samples);
            sortedSamples.sort(Long::compareTo);
            long count = sortedSamples.size();

            if (count == 0) {
                return new RequestLatencyMetricsSnapshot.EndpointLatencyMetric(endpoint, 0, 0, 0, 0, 0, 0);
            }

            long sum = 0L;
            for (Long sample : sortedSamples) {
                sum += sample;
            }

            return new RequestLatencyMetricsSnapshot.EndpointLatencyMetric(
                    endpoint,
                    count,
                    Math.round((double) sum / count),
                    percentile(sortedSamples, 0.50d),
                    percentile(sortedSamples, 0.95d),
                    percentile(sortedSamples, 0.99d),
                    sortedSamples.get(sortedSamples.size() - 1)
            );
        }

        private long percentile(List<Long> sortedSamples, double percentile) {
            int index = (int) Math.ceil(percentile * sortedSamples.size()) - 1;
            return sortedSamples.get(Math.max(0, Math.min(index, sortedSamples.size() - 1)));
        }
    }
}
