package com.failforward.backend.domain.chatbot.service;

import com.failforward.backend.common.api.RateLimitExceededException;
import com.failforward.backend.common.config.ChatbotProperties;
import com.failforward.backend.domain.chatbot.entity.ChatbotRateLimitState;
import com.failforward.backend.domain.chatbot.repository.ChatbotRateLimitStateRepository;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
public class ChatbotRateLimiter {

    private final ChatbotProperties properties;
    private final ChatbotRateLimitStateRepository chatbotRateLimitStateRepository;

    public ChatbotRateLimiter(
            ChatbotProperties properties,
            ChatbotRateLimitStateRepository chatbotRateLimitStateRepository
    ) {
        this.properties = properties;
        this.chatbotRateLimitStateRepository = chatbotRateLimitStateRepository;
    }

    @Transactional
    public void checkLimit(Long userId) {
        LocalDateTime windowStart = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        ChatbotRateLimitState state = loadOrCreateState(userId, windowStart);

        if (!windowStart.equals(state.getWindowStart())) {
            state.resetWindow(windowStart);
        }
        if (state.getRequestCount() >= properties.rateLimitPerMin()) {
            throw new RateLimitExceededException("Too many chatbot requests. Please try again later.");
        }

        state.increment();
        log.debug("chatbot_rate_limit_used userId={} windowStart={} requestCount={} limit={}",
                userId, state.getWindowStart(), state.getRequestCount(), properties.rateLimitPerMin());
    }

    private ChatbotRateLimitState loadOrCreateState(Long userId, LocalDateTime windowStart) {
        return chatbotRateLimitStateRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> createState(userId, windowStart));
    }

    private ChatbotRateLimitState createState(Long userId, LocalDateTime windowStart) {
        try {
            return chatbotRateLimitStateRepository.saveAndFlush(ChatbotRateLimitState.initialize(userId, windowStart));
        } catch (DataIntegrityViolationException exception) {
            return chatbotRateLimitStateRepository.findByUserIdForUpdate(userId)
                    .orElseThrow(() -> exception);
        }
    }
}
