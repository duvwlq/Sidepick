package com.failforward.backend.domain.user.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.user.dto.UserDtos.MeResponse;
import com.failforward.backend.domain.user.dto.UserDtos.UserProfileUpdateRequest;
import com.failforward.backend.domain.user.service.UserService;
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
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<MeResponse> getMe() {
        return ApiResponse.ok("내 정보 조회 성공", userService.getCurrentUser());
    }

    @PatchMapping("/me")
    public ApiResponse<MeResponse> updateMe(@Valid @RequestBody UserProfileUpdateRequest request) {
        return ApiResponse.ok("내 정보 수정 성공", userService.updateCurrentUser(request));
    }
}
