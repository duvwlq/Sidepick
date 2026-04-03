package com.failforward.backend.domain.auth.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.LoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.SignUpRequest;
import com.failforward.backend.domain.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthPayload> signUp(@Valid @RequestBody SignUpRequest request) {
        return ApiResponse.ok("Signup succeeded", authService.signUp(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthPayload> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login succeeded", authService.login(request));
    }
}
