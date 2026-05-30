package com.failforward.backend.domain.reaction.repository;

import com.failforward.backend.domain.reaction.entity.ExperienceReaction;
import com.failforward.backend.domain.reaction.entity.ReactionType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperienceReactionRepository extends JpaRepository<ExperienceReaction, Long> {

    Optional<ExperienceReaction> findByExperienceIdAndUserIdAndReactionType(Long experienceId, Long userId, ReactionType reactionType);

    long countByExperienceIdAndReactionType(Long experienceId, ReactionType reactionType);

    List<ExperienceReaction> findAllByExperienceIdAndUserId(Long experienceId, Long userId);
}
