package com.failforward.backend.domain.user.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.user.dto.UserDtos.MeResponse;
import com.failforward.backend.domain.user.dto.UserDtos.UserProfileUpdateRequest;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    public MeResponse getCurrentUser() {
        return new MeResponse(UserSummary.from(getCurrentUserEntity()));
    }

    public MeResponse updateCurrentUser(UserProfileUpdateRequest request) {
        User user = getCurrentUserEntity();
        userRepository.findByNickname(request.nickname())
                .filter(found -> !found.getId().equals(user.getId()))
                .ifPresent(found -> {
                    throw new BadRequestException("Nickname is already in use.");
                });

        user.updateProfile(request.nickname(), request.ageGroup(), request.profileImage());
        return new MeResponse(UserSummary.from(userRepository.save(user)));
    }

    private User getCurrentUserEntity() {
        return currentUserProvider.getCurrentUserEntity();
    }
}
