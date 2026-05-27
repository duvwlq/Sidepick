package com.failforward.backend.domain.user.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(nullable = false, unique = true, length = 20)
    private String nickname;

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
            String ageGroup,
            String profileImage,
            AuthProvider authProvider,
            Boolean emailVerified,
            Boolean profileCompleted
    ) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.ageGroup = ageGroup;
        this.profileImage = profileImage;
        this.authProvider = authProvider;
        this.emailVerified = emailVerified;
        this.profileCompleted = profileCompleted;
        this.isActive = true;
    }

    public static User create(String email, String password, String nickname, String ageGroup) {
        return new User(email, password, nickname, ageGroup, null, AuthProvider.LOCAL, false, true);
    }

    public static User createSocial(AuthProvider authProvider, String email, String nickname, String ageGroup, String profileImage) {
        return new User(email, null, nickname, ageGroup, profileImage, authProvider, true, false);
    }

    public void updateProfile(String nickname, String ageGroup, String profileImage) {
        this.nickname = nickname;
        this.ageGroup = ageGroup;
        this.profileImage = profileImage;
        this.profileCompleted = nickname != null
                && !nickname.isBlank()
                && ageGroup != null
                && !ageGroup.isBlank();
    }

    public void verifyEmail() {
        this.emailVerified = true;
    }

    public boolean requiresEmailVerification() {
        return authProvider == AuthProvider.LOCAL && !Boolean.TRUE.equals(emailVerified);
    }
}
