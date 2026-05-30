package com.failforward.backend.domain.user.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {
    private static final String PURPOSE_SEPARATOR = "||";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(nullable = false, unique = true, length = 20)
    private String nickname;

    @Column(name = "full_name", length = 50)
    private String fullName;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 30)
    private String gender;

    @Column(length = 50)
    private String region;

    @Column(name = "signup_purposes", length = 500)
    private String signupPurposes;

    @Column(name = "experience_status", length = 30)
    private String experienceStatus;

    @Column(name = "age_group", nullable = false, length = 10)
    private String ageGroup;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    private AuthProvider authProvider;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(name = "profile_completed", nullable = false)
    private Boolean profileCompleted = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    private User(
            String email,
            String password,
            String nickname,
            String fullName,
            LocalDate birthDate,
            String gender,
            String region,
            String signupPurposes,
            String experienceStatus,
            String ageGroup,
            String profileImage,
            AuthProvider authProvider,
            Boolean emailVerified,
            Boolean profileCompleted
    ) {
        this.email = email;
        this.password = password;
        this.nickname = normalize(nickname);
        this.fullName = normalize(fullName);
        this.birthDate = birthDate;
        this.gender = normalize(gender);
        this.region = normalize(region);
        this.signupPurposes = normalize(signupPurposes);
        this.experienceStatus = normalize(experienceStatus);
        this.ageGroup = normalize(ageGroup);
        this.profileImage = profileImage;
        this.authProvider = authProvider;
        this.emailVerified = emailVerified;
        this.profileCompleted = profileCompleted;
        this.isActive = true;
    }

    public static User create(String email, String password, String nickname, String ageGroup) {
        return new User(email, password, nickname, null, null, null, null, null, null, ageGroup, null, AuthProvider.LOCAL, false, true);
    }

    public static User create(
            String email,
            String password,
            String nickname,
            String fullName,
            LocalDate birthDate,
            String gender,
            String region,
            List<String> signupPurposes,
            String experienceStatus,
            String ageGroup
    ) {
        return new User(
                email,
                password,
                nickname,
                fullName,
                birthDate,
                gender,
                region,
                joinSignupPurposes(signupPurposes),
                experienceStatus,
                ageGroup,
                null,
                AuthProvider.LOCAL,
                false,
                true
        );
    }

    public static User createSocial(AuthProvider authProvider, String email, String nickname, String ageGroup, String profileImage) {
        return new User(email, null, nickname, null, null, null, null, null, null, ageGroup, profileImage, authProvider, true, false);
    }

    public void updateProfile(String nickname, String ageGroup, String profileImage) {
        updateProfile(nickname, null, null, null, null, List.of(), null, ageGroup, profileImage);
    }

    public void updateAccountSettings(String nickname, String experienceStatus) {
        this.nickname = normalize(nickname);
        this.experienceStatus = normalize(experienceStatus);
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void updateProfile(
            String nickname,
            String fullName,
            LocalDate birthDate,
            String gender,
            String region,
            List<String> signupPurposes,
            String experienceStatus,
            String ageGroup,
            String profileImage
    ) {
        this.nickname = normalize(nickname);
        this.fullName = normalize(fullName);
        this.birthDate = birthDate;
        this.gender = normalize(gender);
        this.region = normalize(region);
        this.signupPurposes = joinSignupPurposes(signupPurposes);
        this.experienceStatus = normalize(experienceStatus);
        this.ageGroup = normalize(ageGroup);
        this.profileImage = profileImage;
        this.profileCompleted = hasCompletedProfile();
    }

    public void verifyEmail() {
        this.emailVerified = true;
    }

    public boolean requiresEmailVerification() {
        return authProvider == AuthProvider.LOCAL && !Boolean.TRUE.equals(emailVerified);
    }

    public List<String> getSignupPurposeList() {
        if (signupPurposes == null || signupPurposes.isBlank()) {
            return List.of();
        }
        return Arrays.stream(signupPurposes.split(Pattern.quote(PURPOSE_SEPARATOR)))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private boolean hasCompletedProfile() {
        return nickname != null
                && !nickname.isBlank()
                && fullName != null
                && !fullName.isBlank()
                && birthDate != null
                && gender != null
                && !gender.isBlank()
                && region != null
                && !region.isBlank()
                && experienceStatus != null
                && !experienceStatus.isBlank()
                && !getSignupPurposeList().isEmpty()
                && ageGroup != null
                && !ageGroup.isBlank();
    }

    private static String joinSignupPurposes(List<String> signupPurposes) {
        if (signupPurposes == null || signupPurposes.isEmpty()) {
            return null;
        }
        return signupPurposes.stream()
                .map(User::normalize)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .reduce((left, right) -> left + PURPOSE_SEPARATOR + right)
                .orElse(null);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
