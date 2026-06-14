package com.failforward.backend.domain.chatbot.service;

import com.failforward.backend.common.api.RateLimitExceededException;
import com.failforward.backend.common.config.ChatbotProperties;
import com.failforward.backend.domain.chatbot.entity.ChatbotDailyTokenUsage;
import com.failforward.backend.domain.chatbot.repository.ChatbotDailyTokenUsageRepository;
import java.time.LocalDate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
public class ChatbotTokenBudget {

    private static final String CHATBOT_GLOBAL_SCOPE = "chatbot-global";

    private final ChatbotProperties properties;
    private final ChatbotDailyTokenUsageRepository chatbotDailyTokenUsageRepository;

    public ChatbotTokenBudget(
            ChatbotProperties properties,
            ChatbotDailyTokenUsageRepository chatbotDailyTokenUsageRepository
    ) {
        this.properties = properties;
        this.chatbotDailyTokenUsageRepository = chatbotDailyTokenUsageRepository;
    }

    @Transactional
    public void checkAndConsume(int estimatedTokens) {
        LocalDate today = LocalDate.now();
        ChatbotDailyTokenUsage usage = loadOrCreateUsage(today);

        if (!today.equals(usage.getUsageDate())) {
            usage.resetDate(today);
        }

        int nextUsage = usage.getUsedTokens() + Math.max(0, estimatedTokens);
        if (nextUsage > properties.dailyTokenLimit()) {
            throw new RateLimitExceededException("Chatbot daily token limit exceeded.");
        }

        usage.consume(estimatedTokens);
        log.info("chatbot_token_budget_used date={} used={} limit={}", usage.getUsageDate(), usage.getUsedTokens(),
                properties.dailyTokenLimit());
    }

    private ChatbotDailyTokenUsage loadOrCreateUsage(LocalDate today) {
        return chatbotDailyTokenUsageRepository.findByScopeForUpdate(CHATBOT_GLOBAL_SCOPE)
                .orElseGet(() -> createUsage(today));
    }

    private ChatbotDailyTokenUsage createUsage(LocalDate today) {
        try {
            return chatbotDailyTokenUsageRepository.saveAndFlush(
                    ChatbotDailyTokenUsage.initialize(CHATBOT_GLOBAL_SCOPE, today)
            );
        } catch (DataIntegrityViolationException exception) {
            return chatbotDailyTokenUsageRepository.findByScopeForUpdate(CHATBOT_GLOBAL_SCOPE)
                    .orElseThrow(() -> exception);
        }
    }
}
