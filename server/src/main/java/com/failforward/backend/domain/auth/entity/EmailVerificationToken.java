package com.failforward.backend.domain.auth.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "email_verification_tokens")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailVerificationToken extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    private EmailVerificationToken(String email, String code, LocalDateTime expiresAt) {
        this.email = email;
        this.code = code;
        this.expiresAt = expiresAt;
    }

    public static EmailVerificationToken issue(String email, String code, LocalDateTime expiresAt) {
        return new EmailVerificationToken(email, code, expiresAt);
    }

    public boolean isExpired(LocalDateTime now) {
        return expiresAt.isBefore(now);
    }

    public boolean isVerified() {
        return verifiedAt != null;
    }

    public void verify(LocalDateTime now) {
        this.verifiedAt = now;
    }
}
