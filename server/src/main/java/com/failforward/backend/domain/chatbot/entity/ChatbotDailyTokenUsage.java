package com.failforward.backend.domain.chatbot.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "chatbot_daily_token_usage")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatbotDailyTokenUsage extends BaseTimeEntity {

    @Id
    @Column(nullable = false, length = 50)
    private String scope;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "used_tokens", nullable = false)
    private int usedTokens;

    private ChatbotDailyTokenUsage(String scope, LocalDate usageDate) {
        this.scope = scope;
        this.usageDate = usageDate;
        this.usedTokens = 0;
    }

    public static ChatbotDailyTokenUsage initialize(String scope, LocalDate usageDate) {
        return new ChatbotDailyTokenUsage(scope, usageDate);
    }

    public void resetDate(LocalDate usageDate) {
        this.usageDate = usageDate;
        this.usedTokens = 0;
    }

    public void consume(int tokenCount) {
        this.usedTokens += Math.max(0, tokenCount);
    }
}
