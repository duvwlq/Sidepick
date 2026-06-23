package com.failforward.backend.domain.view.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "user_experience_views")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserExperienceView extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = false)
    private FailureExperience experience;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "last_viewed_at", nullable = false)
    private LocalDateTime lastViewedAt;

    private UserExperienceView(FailureExperience experience, User user, LocalDateTime lastViewedAt) {
        this.experience = experience;
        this.user = user;
        this.lastViewedAt = lastViewedAt;
    }

    public static UserExperienceView create(FailureExperience experience, User user, LocalDateTime lastViewedAt) {
        return new UserExperienceView(experience, user, lastViewedAt);
    }

    public void refresh(LocalDateTime lastViewedAt) {
        this.lastViewedAt = lastViewedAt;
    }
}
