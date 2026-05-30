package com.failforward.backend.domain.bookmark.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.user.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "experience_bookmarks")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExperienceBookmark extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = false)
    private FailureExperience experience;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private ExperienceBookmark(FailureExperience experience, User user) {
        this.experience = experience;
        this.user = user;
    }

    public static ExperienceBookmark create(FailureExperience experience, User user) {
        return new ExperienceBookmark(experience, user);
    }
}
