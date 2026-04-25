package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.config.AuthFeatureProperties;
import com.failforward.backend.common.config.MailProperties;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationConfirmRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationRequest;
import com.failforward.backend.domain.auth.entity.EmailVerificationToken;
import com.failforward.backend.domain.auth.repository.EmailVerificationTokenRepository;
import com.failforward.backend.domain.user.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmailVerificationService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final AuthFeatureProperties authFeatureProperties;
    private final MailProperties mailProperties;
    private final EmailVerificationMailService emailVerificationMailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.auth.email-verification.expiration-minutes:10}")
    private long emailVerificationExpirationMinutes;

    @Value("${app.auth.email-verification.expose-code:true}")
    private boolean exposeVerificationCode;

    @Transactional
    public EmailVerificationPayload request(EmailVerificationRequest request) {
        ensureLocalAuthEnabled();
        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    if (Boolean.TRUE.equals(user.getEmailVerified())) {
                        throw new BadRequestException("This email is already verified.");
                    }
                });

        emailVerificationTokenRepository.deleteByEmail(request.email());
        String code = generateVerificationCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(emailVerificationExpirationMinutes);
        emailVerificationTokenRepository.save(EmailVerificationToken.issue(request.email(), code, expiresAt));
        if (!mailProperties.enabled() && !exposeVerificationCode) {
            throw new BadRequestException("Email delivery is disabled on the server.");
        }
        if (mailProperties.enabled()) {
            emailVerificationMailService.sendVerificationCode(request.email(), code, expiresAt);
        }

        return new EmailVerificationPayload(
                request.email(),
                "PENDING",
                exposeVerificationCode ? code : null,
                expiresAt
        );
    }

    @Transactional
    public EmailVerificationPayload confirm(EmailVerificationConfirmRequest request) {
        ensureLocalAuthEnabled();
        EmailVerificationToken token = emailVerificationTokenRepository.findTopByEmailOrderByCreatedAtDesc(request.email())
                .orElseThrow(() -> new BadRequestException("Email verification was not requested."));

        if (token.isVerified()) {
            throw new BadRequestException("Email is already verified.");
        }
        if (token.isExpired(LocalDateTime.now())) {
            throw new BadRequestException("Verification code has expired.");
        }
        if (!token.getCode().equals(request.code())) {
            throw new BadRequestException("Verification code is invalid.");
        }
        token.verify(LocalDateTime.now());
        emailVerificationTokenRepository.save(token);

        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    user.verifyEmail();
                    userRepository.save(user);
                });

        return new EmailVerificationPayload(
                request.email(),
                "VERIFIED",
                null,
                token.getExpiresAt()
        );
    }

    public EmailVerificationToken getVerifiedToken(String email) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new BadRequestException("Email verification is required before registration."));

        if (!verificationToken.isVerified()) {
            throw new BadRequestException("Email verification must be completed before registration.");
        }
        if (verificationToken.isExpired(LocalDateTime.now())) {
            throw new BadRequestException("Email verification has expired. Please request a new code.");
        }
        return verificationToken;
    }

    private void ensureLocalAuthEnabled() {
        if (!authFeatureProperties.localEnabled()) {
            throw new BadRequestException("Email login is not available right now.");
        }
    }

    private String generateVerificationCode() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
