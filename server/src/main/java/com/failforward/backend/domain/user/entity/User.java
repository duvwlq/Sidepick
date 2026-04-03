package com.failforward.backend.domain.user.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
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

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, unique = true, length = 20)
    private String nickname;

    @Column(name = "age_group", nullable = false, length = 10)
    private String ageGroup;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    private User(String email, String password, String nickname, String ageGroup, String profileImage) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.ageGroup = ageGroup;
        this.profileImage = profileImage;
        this.isActive = true;
    }

    public static User create(String email, String password, String nickname, String ageGroup) {
        return new User(email, password, nickname, ageGroup, null);
    }

    public void updateProfile(String nickname, String ageGroup, String profileImage) {
        this.nickname = nickname;
        this.ageGroup = ageGroup;
        this.profileImage = profileImage;
    }
}
