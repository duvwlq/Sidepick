package com.failforward.backend.domain.admin.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class AdminChatbotOpsDtos {

    private AdminChatbotOpsDtos() {
    }

    public record ChatbotOpsResponse(
            LimitsResponse limits,
            QueueResponse queue,
            TokenBudgetResponse tokenBudget,
            RateLimitResponse rateLimit
    ) {
    }

    public record LimitsResponse(
            int rateLimitPerMin,
            int queueCapacity,
            int dailyTokenLimit,
            int maxMessageLength,
            int minimumGuideMessageLength
    ) {
    }

    public record QueueResponse(
            String scope,
            int capacity,
            int availableSlots,
            int activeRequests
    ) {
    }

    public record TokenBudgetResponse(
            LocalDate usageDate,
            int usedTokens,
            int remainingTokens
    ) {
    }

    public record RateLimitResponse(
            LocalDateTime currentWindowStart,
            long trackedUsersInCurrentWindow,
            int highestRequestCountInCurrentWindow,
            List<UserWindowResponse> topUsers
    ) {
    }

    public record UserWindowResponse(
            Long userId,
            int requestCount,
            LocalDateTime windowStart
    ) {
    }
}
