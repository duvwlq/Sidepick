package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.security.JwtTokenProvider;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthTokenService {

    private final JwtTokenProvider jwtTokenProvider;

    public AuthPayload issue(User user) {
        return new AuthPayload(
                UserSummary.from(user),
                "Bearer",
                jwtTokenProvider.generateAccessToken(user),
                jwtTokenProvider.generateRefreshToken(user),
                3600L,
                user.requiresEmailVerification()
        );
    }
}
