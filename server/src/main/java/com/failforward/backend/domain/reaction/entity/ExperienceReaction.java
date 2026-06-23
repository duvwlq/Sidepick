package com.failforward.backend.domain.reaction.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.user.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "experience_reactions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExperienceReaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = false)
    private FailureExperience experience;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private ReactionType reactionType;

    private ExperienceReaction(FailureExperience experience, User user, ReactionType reactionType) {
        this.experience = experience;
        this.user = user;
        this.reactionType = reactionType;
    }

    public static ExperienceReaction create(FailureExperience experience, User user, ReactionType reactionType) {
        return new ExperienceReaction(experience, user, reactionType);
    }
}
