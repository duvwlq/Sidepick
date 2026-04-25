package com.failforward.backend.domain.auth.service;

import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationConfirmRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.LoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.OAuthLoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.SignUpRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final LocalAuthService localAuthService;
    private final EmailVerificationService emailVerificationService;
    private final OAuthAuthService oAuthAuthService;

    @Transactional
    public AuthPayload signUp(SignUpRequest request) {
        return localAuthService.signUp(request);
    }

    public AuthPayload login(LoginRequest request) {
        return localAuthService.login(request);
    }

    @Transactional
    public EmailVerificationPayload requestEmailVerification(EmailVerificationRequest request) {
        return emailVerificationService.request(request);
    }

    @Transactional
    public EmailVerificationPayload confirmEmailVerification(EmailVerificationConfirmRequest request) {
        return emailVerificationService.confirm(request);
    }

    @Transactional
    public AuthPayload loginWithKakao(OAuthLoginRequest request) {
        return oAuthAuthService.loginWithKakao(request);
    }

    @Transactional
    public AuthPayload loginWithGoogle(OAuthLoginRequest request) {
        return oAuthAuthService.loginWithGoogle(request);
    }
}
