package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.LoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.SignUpRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

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
                request.password(),
                request.nickname(),
                request.ageGroup()
        ));
        return new AuthPayload(UserSummary.from(user), issueToken(), issueToken());
    }

    public AuthPayload login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .filter(found -> found.getPassword().equals(request.password()))
                .orElseThrow(() -> new BadRequestException("Email or password is invalid."));
        return new AuthPayload(UserSummary.from(user), issueToken(), issueToken());
    }

    private String issueToken() {
        return UUID.randomUUID().toString();
    }
}
