package com.failforward.backend.domain.auth.dto;

import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.entity.AuthProvider;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record SignUpRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, max = 64) String password,
            @NotBlank @Size(min = 2, max = 30) String fullName,
            @NotNull @Past LocalDate birthDate,
            @NotBlank String gender,
            @NotBlank String region,
            @NotEmpty @Size(max = 3) List<String> signupPurposes,
            @NotBlank @Size(min = 2, max = 20) String nickname,
            @NotBlank String experienceStatus,
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
            @NotBlank String state,
            @NotBlank String redirectUri
    ) {
    }

    public record OAuthStateRequest(
            @NotNull AuthProvider provider,
            @NotBlank String redirectUri
    ) {
    }

    public record OAuthStatePayload(
            String state,
            AuthProvider provider,
            LocalDateTime expiresAt
    ) {
    }

    public record UserSummary(
            Long id,
            String email,
            String nickname,
            String fullName,
            LocalDate birthDate,
            String gender,
            String region,
            List<String> signupPurposes,
            String experienceStatus,
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
                    user.getFullName(),
                    user.getBirthDate(),
                    user.getGender(),
                    user.getRegion(),
                    user.getSignupPurposeList(),
                    user.getExperienceStatus(),
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
