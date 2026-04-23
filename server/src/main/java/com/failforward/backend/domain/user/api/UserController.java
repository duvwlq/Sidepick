package com.failforward.backend.domain.user.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.user.dto.UserDtos.MeResponse;
import com.failforward.backend.domain.user.dto.UserDtos.UserProfileUpdateRequest;
import com.failforward.backend.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Authenticated user APIs")
public class UserController {

    private final UserService userService;

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
}
