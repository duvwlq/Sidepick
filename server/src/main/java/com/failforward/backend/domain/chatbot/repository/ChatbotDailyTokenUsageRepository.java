package com.failforward.backend.domain.chatbot.repository;

import com.failforward.backend.domain.chatbot.entity.ChatbotDailyTokenUsage;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatbotDailyTokenUsageRepository extends JpaRepository<ChatbotDailyTokenUsage, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select usage from ChatbotDailyTokenUsage usage where usage.scope = :scope")
    Optional<ChatbotDailyTokenUsage> findByScopeForUpdate(@Param("scope") String scope);
}
