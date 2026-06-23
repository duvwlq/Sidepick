package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.config.AuthFeatureProperties;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.LoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.SignUpRequest;
import com.failforward.backend.domain.user.entity.AuthProvider;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.Period;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocalAuthService {
    private static final java.util.regex.Pattern PASSWORD_POLICY =
            java.util.regex.Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,64}$");


    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthFeatureProperties authFeatureProperties;
    private final EmailVerificationService emailVerificationService;
    private final AuthTokenService authTokenService;

    @Transactional
    public AuthPayload signUp(SignUpRequest request) {
        ensureLocalAuthEnabled();
        if (!PASSWORD_POLICY.matcher(request.password()).matches()) {
            throw new BadRequestException("Password must include letters and numbers and be at least 8 characters long.");
        }
        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    throw new BadRequestException("Email is already in use.");
                });
        userRepository.findByNickname(request.nickname())
                .ifPresent(user -> {
                    throw new BadRequestException("Nickname is already in use.");
                });

        emailVerificationService.getVerifiedToken(request.email());

        User user = userRepository.save(User.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nickname(),
                request.fullName(),
                request.birthDate(),
                request.gender(),
                request.region(),
                request.signupPurposes(),
                request.experienceStatus(),
                resolveAgeGroup(request.ageGroup(), request.birthDate())
        ));
        user.verifyEmail();
        return authTokenService.issue(user);
    }

    public AuthPayload login(LoginRequest request) {
        ensureLocalAuthEnabled();
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Email or password is invalid."));
        if (user.getPassword() == null || user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new BadRequestException("This account must sign in with a social login provider.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Email or password is invalid.");
        }
        return authTokenService.issue(user);
    }

    private void ensureLocalAuthEnabled() {
        if (!authFeatureProperties.localEnabled()) {
            throw new BadRequestException("Email login is not available right now.");
        }
    }

    private String resolveAgeGroup(String ageGroup, LocalDate birthDate) {
        if (ageGroup != null && !ageGroup.isBlank()) {
            return ageGroup.trim();
        }
        if (birthDate == null) {
            return "UNKNOWN";
        }
        int age = Math.max(0, Period.between(birthDate, LocalDate.now()).getYears());
        if (age < 10) {
            return "UNDER_10";
        }
        if (age >= 70) {
            return "70+";
        }
        return (age / 10) * 10 + "s";
    }
}
