package com.failforward.backend.domain.user.dto;

import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserProfileUpdateRequest(
            @NotBlank @Size(min = 2, max = 20) String nickname,
            @NotBlank @Size(min = 2, max = 30) String fullName,
            @NotNull @Past LocalDate birthDate,
            @NotBlank String gender,
            @NotBlank String region,
            @NotEmpty @Size(max = 3) List<String> signupPurposes,
            @NotBlank String experienceStatus,
            String ageGroup,
            String profileImage
    ) {
    }

    public record AccountSettingsUpdateRequest(
            @NotBlank @Size(min = 2, max = 20) String nickname,
            @NotBlank String experienceStatus
    ) {
    }

    public record PasswordChangeRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 64) String newPassword
    ) {
    }

    public record MyAnalysisItemResponse(
            Long experienceId,
            Long analysisId,
            String reportStatus,
            String title,
            String summary,
            String failureCategory,
            String riskLevel,
            LocalDateTime processedAt,
            LocalDateTime createdAt
    ) {
    }

    public record MeResponse(
            UserSummary user
    ) {
    }
}
