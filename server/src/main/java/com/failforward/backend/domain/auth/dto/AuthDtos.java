package com.failforward.backend.domain.auth.dto;

import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.entity.AuthProvider;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record SignUpRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8) String password,
            @NotBlank @Size(min = 2, max = 20) String nickname,
            String ageGroup
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record EmailVerificationRequest(
            @Email @NotBlank String email
    ) {
    }

    public record EmailVerificationConfirmRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, max = 6) String code
    ) {
    }

    public record OAuthLoginRequest(
            @NotBlank String code,
            @NotBlank String redirectUri
    ) {
    }

    public record UserSummary(
            Long id,
            String email,
            String nickname,
            String ageGroup,
            String profileImage,
            AuthProvider authProvider,
            boolean emailVerified,
            boolean profileCompleted,
            LocalDateTime createdAt
    ) {
        public static UserSummary from(User user) {
            return new UserSummary(
                    user.getId(),
                    user.getEmail(),
                    user.getNickname(),
                    user.getAgeGroup(),
                    user.getProfileImage(),
                    user.getAuthProvider(),
                    Boolean.TRUE.equals(user.getEmailVerified()),
                    Boolean.TRUE.equals(user.getProfileCompleted()),
                    user.getCreatedAt()
            );
        }
    }

    public record AuthPayload(
            UserSummary user,
            String tokenType,
            String accessToken,
            String refreshToken,
            long accessTokenExpiresIn,
            boolean emailVerificationRequired
    ) {
    }

    public record EmailVerificationPayload(
            String email,
            String status,
            String verificationCode,
            LocalDateTime expiresAt
    ) {
    }
}
