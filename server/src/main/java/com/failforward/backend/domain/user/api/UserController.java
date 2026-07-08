package com.failforward.backend.domain.user.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.common.config.PublicBaseUrlResolver;
import com.failforward.backend.domain.user.dto.UserDtos.AccountSettingsUpdateRequest;
import com.failforward.backend.domain.user.dto.UserDtos.MeResponse;
import com.failforward.backend.domain.user.dto.UserDtos.PasswordChangeRequest;
import com.failforward.backend.domain.user.dto.UserDtos.ProfileImageUploadResponse;
import com.failforward.backend.domain.user.dto.UserDtos.UserProfileUpdateRequest;
import com.failforward.backend.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Authenticated user APIs")
public class UserController {

    private final UserService userService;
    private final PublicBaseUrlResolver publicBaseUrlResolver;

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<MeResponse> getMe() {
        return ApiResponse.ok("Current user loaded.", userService.getCurrentUser());
    }

    @Operation(summary = "내 정보 수정")
    @PatchMapping("/me")
    public ApiResponse<MeResponse> updateMe(@Valid @RequestBody UserProfileUpdateRequest request) {
        return ApiResponse.ok("Current user updated.", userService.updateCurrentUser(request));
    }

    @Operation(summary = "계정 설정 수정")
    @PatchMapping("/me/account-settings")
    public ApiResponse<MeResponse> updateAccountSettings(@Valid @RequestBody AccountSettingsUpdateRequest request) {
        return ApiResponse.ok("Account settings updated.", userService.updateAccountSettings(request));
    }

    @Operation(summary = "비밀번호 변경")
    @PatchMapping("/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        userService.changePassword(request);
        return ApiResponse.ok("Password changed.", null);
    }

    @PostMapping("/me/profile-image")
    public ApiResponse<ProfileImageUploadResponse> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        return ApiResponse.ok(
                "Profile image uploaded.",
                userService.uploadCurrentUserProfileImage(file, publicBaseUrlResolver.resolve(request))
        );
    }
}
