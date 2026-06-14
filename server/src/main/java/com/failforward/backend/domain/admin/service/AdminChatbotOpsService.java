package com.failforward.backend.domain.admin.service;

import com.failforward.backend.common.config.ChatbotProperties;
import com.failforward.backend.common.security.AdminAccessPolicy;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.admin.dto.AdminChatbotOpsDtos.ChatbotOpsResponse;
import com.failforward.backend.domain.admin.dto.AdminChatbotOpsDtos.LimitsResponse;
import com.failforward.backend.domain.admin.dto.AdminChatbotOpsDtos.QueueResponse;
import com.failforward.backend.domain.admin.dto.AdminChatbotOpsDtos.RateLimitResponse;
import com.failforward.backend.domain.admin.dto.AdminChatbotOpsDtos.TokenBudgetResponse;
import com.failforward.backend.domain.admin.dto.AdminChatbotOpsDtos.UserWindowResponse;
import com.failforward.backend.domain.chatbot.entity.ChatbotDailyTokenUsage;
import com.failforward.backend.domain.chatbot.entity.ChatbotRateLimitState;
import com.failforward.backend.domain.chatbot.repository.ChatbotDailyTokenUsageRepository;
import com.failforward.backend.domain.chatbot.repository.ChatbotRateLimitStateRepository;
import com.failforward.backend.domain.chatbot.service.ChatbotRequestQueue;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminChatbotOpsService {

    private static final String CHATBOT_GLOBAL_SCOPE = "chatbot-global";
    private static final String SINGLE_INSTANCE_SCOPE = "single-instance";

    private final CurrentUserProvider currentUserProvider;
    private final AdminAccessPolicy adminAccessPolicy;
    private final ChatbotProperties chatbotProperties;
    private final ChatbotRequestQueue chatbotRequestQueue;
    private final ChatbotDailyTokenUsageRepository chatbotDailyTokenUsageRepository;
    private final ChatbotRateLimitStateRepository chatbotRateLimitStateRepository;

    public ChatbotOpsResponse getChatbotOps() {
        if (!adminAccessPolicy.isAdmin(currentUserProvider.getCurrentUser())) {
            throw new AccessDeniedException("Admin access is required.");
        }

        LocalDate today = LocalDate.now();
        LocalDateTime currentWindowStart = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);

        ChatbotDailyTokenUsage usage = chatbotDailyTokenUsageRepository.findById(CHATBOT_GLOBAL_SCOPE)
                .filter(item -> today.equals(item.getUsageDate()))
                .orElse(null);

        int usedTokens = usage == null ? 0 : usage.getUsedTokens();
        int remainingTokens = Math.max(0, chatbotProperties.dailyTokenLimit() - usedTokens);

        List<UserWindowResponse> topUsers = chatbotRateLimitStateRepository.findAll().stream()
                .filter(state -> currentWindowStart.equals(state.getWindowStart()))
                .sorted(Comparator.comparingInt(ChatbotRateLimitState::getRequestCount).reversed())
                .limit(5)
                .map(state -> new UserWindowResponse(
                        state.getUserId(),
                        state.getRequestCount(),
                        state.getWindowStart()
                ))
                .toList();

        int highestRequestCount = topUsers.isEmpty() ? 0 : topUsers.get(0).requestCount();

        return new ChatbotOpsResponse(
                new LimitsResponse(
                        chatbotProperties.rateLimitPerMin(),
                        chatbotProperties.queueCapacity(),
                        chatbotProperties.dailyTokenLimit(),
                        chatbotProperties.maxMessageLength(),
                        chatbotProperties.minimumGuideMessageLength()
                ),
                new QueueResponse(
                        SINGLE_INSTANCE_SCOPE,
                        chatbotRequestQueue.capacity(),
                        chatbotRequestQueue.availableSlots(),
                        chatbotRequestQueue.activeRequests()
                ),
                new TokenBudgetResponse(today, usedTokens, remainingTokens),
                new RateLimitResponse(
                        currentWindowStart,
                        chatbotRateLimitStateRepository.countByWindowStart(currentWindowStart),
                        highestRequestCount,
                        topUsers
                )
        );
    }
}
