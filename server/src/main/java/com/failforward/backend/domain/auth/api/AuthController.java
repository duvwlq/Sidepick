package com.failforward.backend.domain.auth.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationConfirmRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.LoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.OAuthLoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.OAuthStatePayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.OAuthStateRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.SignUpRequest;
import com.failforward.backend.domain.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/auth", "/auth"})
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication APIs")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원가입")
    @PostMapping({"/register", "/signup"})
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthPayload> signUp(@Valid @RequestBody SignUpRequest request) {
        return ApiResponse.ok("Registration succeeded.", authService.signUp(request));
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ApiResponse<AuthPayload> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login succeeded.", authService.login(request));
    }

    @Operation(summary = "이메일 인증 코드 발급")
    @PostMapping("/email-verifications")
    public ApiResponse<EmailVerificationPayload> requestEmailVerification(
            @Valid @RequestBody EmailVerificationRequest request
    ) {
        return ApiResponse.ok("Email verification requested.", authService.requestEmailVerification(request));
    }

    @Operation(summary = "이메일 인증 코드 확인")
    @PostMapping("/email-verifications/confirm")
    public ApiResponse<EmailVerificationPayload> confirmEmailVerification(
            @Valid @RequestBody EmailVerificationConfirmRequest request
    ) {
        return ApiResponse.ok("Email verification confirmed.", authService.confirmEmailVerification(request));
    }

    @Operation(summary = "카카오 OAuth 로그인")
    @PostMapping("/oauth/kakao")
    public ApiResponse<AuthPayload> loginWithKakao(@Valid @RequestBody OAuthLoginRequest request) {
        return ApiResponse.ok("Kakao login succeeded.", authService.loginWithKakao(request));
    }

    @Operation(summary = "구글 OAuth 로그인")
    @PostMapping("/oauth/google")
    public ApiResponse<AuthPayload> loginWithGoogle(@Valid @RequestBody OAuthLoginRequest request) {
        return ApiResponse.ok("Google login succeeded.", authService.loginWithGoogle(request));
    }

    @Operation(summary = "Naver OAuth login")
    @PostMapping("/oauth/naver")
    public ApiResponse<AuthPayload> loginWithNaver(@Valid @RequestBody OAuthLoginRequest request) {
        return ApiResponse.ok("Naver login succeeded.", authService.loginWithNaver(request));
    }

    @Operation(summary = "Issue OAuth state")
    @PostMapping("/oauth/state")
    public ApiResponse<OAuthStatePayload> issueOAuthState(@Valid @RequestBody OAuthStateRequest request) {
        return ApiResponse.ok("OAuth state issued.", authService.issueOAuthState(request));
    }
}
