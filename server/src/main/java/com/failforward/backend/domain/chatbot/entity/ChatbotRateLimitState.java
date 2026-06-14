package com.failforward.backend.domain.chatbot.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "chatbot_rate_limit_state")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatbotRateLimitState extends BaseTimeEntity {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Column(name = "request_count", nullable = false)
    private int requestCount;

    private ChatbotRateLimitState(Long userId, LocalDateTime windowStart) {
        this.userId = userId;
        this.windowStart = windowStart;
        this.requestCount = 0;
    }

    public static ChatbotRateLimitState initialize(Long userId, LocalDateTime windowStart) {
        return new ChatbotRateLimitState(userId, windowStart);
    }

    public void resetWindow(LocalDateTime windowStart) {
        this.windowStart = windowStart;
        this.requestCount = 0;
    }

    public void increment() {
        this.requestCount += 1;
    }
}
