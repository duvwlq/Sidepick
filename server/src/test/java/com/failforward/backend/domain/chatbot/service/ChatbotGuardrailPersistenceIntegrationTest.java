package com.failforward.backend.domain.chatbot.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.failforward.backend.common.api.RateLimitExceededException;
import com.failforward.backend.common.config.ChatbotProperties;
import com.failforward.backend.domain.chatbot.repository.ChatbotDailyTokenUsageRepository;
import com.failforward.backend.domain.chatbot.repository.ChatbotRateLimitStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@ActiveProfiles("test")
class ChatbotGuardrailPersistenceIntegrationTest {

    @Autowired
    private ChatbotProperties chatbotProperties;

    @Autowired
    private ChatbotRateLimitStateRepository chatbotRateLimitStateRepository;

    @Autowired
    private ChatbotDailyTokenUsageRepository chatbotDailyTokenUsageRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void setUp() {
        chatbotRateLimitStateRepository.deleteAll();
        chatbotDailyTokenUsageRepository.deleteAll();
    }

    @Test
    void rateLimitStateSurvivesNewLimiterInstance() {
        Long userId = 9001L;
        ChatbotRateLimiter firstLimiter = new ChatbotRateLimiter(chatbotProperties, chatbotRateLimitStateRepository);
        ChatbotRateLimiter restartedLimiter = new ChatbotRateLimiter(chatbotProperties, chatbotRateLimitStateRepository);
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        for (int index = 0; index < chatbotProperties.rateLimitPerMin(); index++) {
            transactionTemplate.executeWithoutResult(status -> firstLimiter.checkLimit(userId));
        }

        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(status -> restartedLimiter.checkLimit(userId)))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("Too many chatbot requests");
    }

    @Test
    void dailyTokenBudgetSurvivesNewBudgetInstance() {
        ChatbotTokenBudget firstBudget = new ChatbotTokenBudget(chatbotProperties, chatbotDailyTokenUsageRepository);
        ChatbotTokenBudget restartedBudget = new ChatbotTokenBudget(chatbotProperties, chatbotDailyTokenUsageRepository);
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        transactionTemplate.executeWithoutResult(
                status -> firstBudget.checkAndConsume(chatbotProperties.dailyTokenLimit() - 100)
        );

        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(status -> restartedBudget.checkAndConsume(101)))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("daily token limit exceeded");
    }
}
