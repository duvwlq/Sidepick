package com.failforward.backend.domain.chatbot.repository;

import com.failforward.backend.domain.chatbot.entity.ChatbotRateLimitState;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface ChatbotRateLimitStateRepository extends JpaRepository<ChatbotRateLimitState, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select state from ChatbotRateLimitState state where state.userId = :userId")
    Optional<ChatbotRateLimitState> findByUserIdForUpdate(@Param("userId") Long userId);

    long countByWindowStart(LocalDateTime windowStart);

    Optional<ChatbotRateLimitState> findTopByWindowStartOrderByRequestCountDesc(LocalDateTime windowStart);
}
