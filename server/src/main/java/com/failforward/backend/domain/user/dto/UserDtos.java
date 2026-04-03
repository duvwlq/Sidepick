package com.failforward.backend.domain.user.dto;

import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserProfileUpdateRequest(
            @NotBlank @Size(min = 2, max = 20) String nickname,
            @NotBlank String ageGroup,
            String profileImage
    ) {
    }

    public record MeResponse(
            UserSummary user
    ) {
    }
}
