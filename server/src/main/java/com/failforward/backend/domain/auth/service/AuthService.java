package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.security.JwtTokenProvider;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.LoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.SignUpRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthPayload signUp(SignUpRequest request) {
        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    throw new BadRequestException("Email is already in use.");
                });
        userRepository.findByNickname(request.nickname())
                .ifPresent(user -> {
                    throw new BadRequestException("Nickname is already in use.");
                });

        User user = userRepository.save(User.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nickname(),
                normalizeAgeGroup(request.ageGroup())
        ));
        return issueAuthPayload(user);
    }

    public AuthPayload login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Email or password is invalid."));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Email or password is invalid.");
        }
        return issueAuthPayload(user);
    }

    private AuthPayload issueAuthPayload(User user) {
        return new AuthPayload(
                UserSummary.from(user),
                "Bearer",
                jwtTokenProvider.generateAccessToken(user),
                jwtTokenProvider.generateRefreshToken(user),
                3600L
        );
    }

    private String normalizeAgeGroup(String ageGroup) {
        if (ageGroup == null || ageGroup.isBlank()) {
            return "UNKNOWN";
        }
        return ageGroup;
    }
}
