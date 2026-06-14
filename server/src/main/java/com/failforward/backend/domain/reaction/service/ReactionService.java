package com.failforward.backend.domain.reaction.service;

import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.notification.service.NotificationService;
import com.failforward.backend.domain.reaction.dto.ReactionDtos.ReactionSummaryResponse;
import com.failforward.backend.domain.reaction.entity.ExperienceReaction;
import com.failforward.backend.domain.reaction.entity.ReactionType;
import com.failforward.backend.domain.reaction.repository.ExperienceReactionRepository;
import com.failforward.backend.domain.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReactionService {

    private final ExperienceReactionRepository reactionRepository;
    private final FailureExperienceRepository experienceRepository;
    private final CurrentUserProvider currentUserProvider;
    private final NotificationService notificationService;

    @Transactional
    public ReactionSummaryResponse react(Long experienceId, ReactionType reactionType) {
        User user = currentUserProvider.getCurrentUserEntity();
        FailureExperience experience = getExperience(experienceId);
        boolean created = reactionRepository.findByExperienceIdAndUserIdAndReactionType(experienceId, user.getId(), reactionType)
                .map(existing -> false)
                .orElseGet(() -> {
                    reactionRepository.save(ExperienceReaction.create(experience, user, reactionType));
                    return true;
                });

        if (created && reactionType == ReactionType.HEART) {
            notificationService.createExperienceLikeNotification(
                    experience.getUser(),
                    user,
                    experience.getId(),
                    experience.getTitle()
            );
        }
        return getSummary(experienceId);
    }

    @Transactional
    public ReactionSummaryResponse unreact(Long experienceId, ReactionType reactionType) {
        User user = currentUserProvider.getCurrentUserEntity();
        ensureExperienceExists(experienceId);
        reactionRepository.findByExperienceIdAndUserIdAndReactionType(experienceId, user.getId(), reactionType)
                .ifPresent(reactionRepository::delete);
        return getSummary(experienceId);
    }

    public ReactionSummaryResponse getSummary(Long experienceId) {
        User user = currentUserProvider.getCurrentUserEntity();
        ensureExperienceExists(experienceId);
        List<ReactionType> myReactions = reactionRepository.findAllByExperienceIdAndUserId(experienceId, user.getId()).stream()
                .map(ExperienceReaction::getReactionType)
                .toList();
        return new ReactionSummaryResponse(
                experienceId,
                reactionRepository.countByExperienceIdAndReactionType(experienceId, ReactionType.HEART),
                reactionRepository.countByExperienceIdAndReactionType(experienceId, ReactionType.TEAR),
                myReactions
        );
    }

    private FailureExperience getExperience(Long experienceId) {
        return experienceRepository.findById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));
    }

    private void ensureExperienceExists(Long experienceId) {
        if (!experienceRepository.existsById(experienceId)) {
            throw new NotFoundException("Experience not found.");
        }
    }
}
