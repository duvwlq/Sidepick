package com.failforward.backend.domain.user.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.user.dto.UserDtos.AccountSettingsUpdateRequest;
import com.failforward.backend.domain.user.dto.UserDtos.MeResponse;
import com.failforward.backend.domain.user.dto.UserDtos.PasswordChangeRequest;
import com.failforward.backend.domain.user.dto.UserDtos.ProfileImageUploadResponse;
import com.failforward.backend.domain.user.dto.UserDtos.UserProfileUpdateRequest;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserProfileImageService userProfileImageService;

    public MeResponse getCurrentUser() {
        return new MeResponse(UserSummary.from(getCurrentUserEntity()));
    }

    public MeResponse updateCurrentUser(UserProfileUpdateRequest request) {
        User user = getCurrentUserEntity();
        ensureNicknameAvailable(user, request.nickname());

        user.updateProfile(
                request.nickname(),
                request.fullName(),
                request.birthDate(),
                request.gender(),
                request.region(),
                request.signupPurposes(),
                request.experienceStatus(),
                resolveAgeGroup(request.ageGroup(), request.birthDate()),
                request.profileImage()
        );
        return new MeResponse(UserSummary.from(userRepository.save(user)));
    }

    public MeResponse updateAccountSettings(AccountSettingsUpdateRequest request) {
        User user = getCurrentUserEntity();
        ensureNicknameAvailable(user, request.nickname());
        user.updateAccountSettings(request.nickname(), request.experienceStatus());
        return new MeResponse(UserSummary.from(userRepository.save(user)));
    }

    public void changePassword(PasswordChangeRequest request) {
        User user = getCurrentUserEntity();
        if (user.getPassword() == null) {
            throw new BadRequestException("This account does not support password changes.");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (!request.newPassword().matches("^(?=.*[A-Za-z])(?=.*\\d).{8,64}$")) {
            throw new BadRequestException("Password must include letters and numbers and be at least 8 characters long.");
        }
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public ProfileImageUploadResponse uploadCurrentUserProfileImage(MultipartFile file, String publicBaseUrl) {
        User user = getCurrentUserEntity();
        String imageUrl = userProfileImageService.store(user, file, publicBaseUrl);
        return new ProfileImageUploadResponse(imageUrl, UserSummary.from(user));
    }

    private User getCurrentUserEntity() {
        return currentUserProvider.getCurrentUserEntity();
    }

    private void ensureNicknameAvailable(User user, String nickname) {
        userRepository.findByNickname(nickname)
                .filter(found -> !found.getId().equals(user.getId()))
                .ifPresent(found -> {
                    throw new BadRequestException("Nickname is already in use.");
                });
    }

    private String resolveAgeGroup(String ageGroup, java.time.LocalDate birthDate) {
        if (ageGroup != null && !ageGroup.isBlank()) {
            return ageGroup.trim();
        }
        if (birthDate == null) {
            return "UNKNOWN";
        }
        int age = Math.max(0, java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears());
        if (age < 10) {
            return "UNDER_10";
        }
        if (age >= 70) {
            return "70+";
        }
        return (age / 10) * 10 + "s";
    }
}
