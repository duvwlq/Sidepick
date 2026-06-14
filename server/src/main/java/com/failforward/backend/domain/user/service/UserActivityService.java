package com.failforward.backend.domain.user.service;

import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.analysis.service.AIAnalysisService;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.bookmark.repository.ExperienceBookmarkRepository;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceResponse;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.user.dto.UserDtos.MeResponse;
import com.failforward.backend.domain.user.dto.UserDtos.HomeFeedResponse;
import com.failforward.backend.domain.user.dto.UserDtos.MyAnalysisItemResponse;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.view.repository.UserExperienceViewRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserActivityService {

    private final CurrentUserProvider currentUserProvider;
    private final FailureExperienceRepository experienceRepository;
    private final ExperienceBookmarkRepository bookmarkRepository;
    private final UserExperienceViewRepository userExperienceViewRepository;
    private final AIAnalysisService aiAnalysisService;

    public List<ExperienceResponse> getMyExperiences() {
        User user = currentUserProvider.getCurrentUserEntity();
        return experienceRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ExperienceResponse> getMyBookmarks() {
        User user = currentUserProvider.getCurrentUserEntity();
        return bookmarkRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(bookmark -> toResponse(bookmark.getExperience()))
                .toList();
    }

    public List<ExperienceResponse> getMyRecentViews() {
        User user = currentUserProvider.getCurrentUserEntity();
        return userExperienceViewRepository.findAllByUserIdOrderByLastViewedAtDesc(user.getId()).stream()
                .map(view -> toResponse(view.getExperience()))
                .toList();
    }

    public MeResponse getCurrentUser() {
        return new MeResponse(UserSummary.from(currentUserProvider.getCurrentUserEntity()));
    }

    public List<MyAnalysisItemResponse> getMyAnalysisReports() {
        User user = currentUserProvider.getCurrentUserEntity();
        return experienceRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(experience -> {
                    var analysis = aiAnalysisService.findByExperience(experience).orElse(null);
                    return new MyAnalysisItemResponse(
                            experience.getId(),
                            analysis != null ? analysis.getId() : null,
                            analysis != null ? "READY" : "NOT_READY",
                            experience.getTitle(),
                            analysis != null ? analysis.getStructuredSummary() : null,
                            analysis != null ? analysis.getFailureCategory() : null,
                            analysis != null ? analysis.getRiskLevel() : null,
                            analysis != null ? analysis.getProcessedAt() : null,
                            experience.getCreatedAt()
                    );
                })
                .toList();
    }

    public HomeFeedResponse getMyHomeFeed() {
        User user = currentUserProvider.getCurrentUserEntity();
        Map<Long, Integer> categoryWeights = new LinkedHashMap<>();

        accumulateCategoryWeights(categoryWeights, experienceRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()), 2);
        accumulateCategoryWeights(
                categoryWeights,
                bookmarkRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(bookmark -> bookmark.getExperience())
                        .toList(),
                3
        );
        accumulateCategoryWeights(
                categoryWeights,
                userExperienceViewRepository.findAllByUserIdOrderByLastViewedAtDesc(user.getId()).stream()
                        .map(view -> view.getExperience())
                        .toList(),
                1
        );

        List<Long> preferredCategoryIds = categoryWeights.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue(Comparator.reverseOrder()))
                .map(Map.Entry::getKey)
                .limit(3)
                .toList();

        List<FailureExperience> recommended = new ArrayList<>();
        for (Long categoryId : preferredCategoryIds) {
            List<FailureExperience> items = experienceRepository.searchPublicPopular(
                    null,
                    categoryId,
                    null,
                    null,
                    null,
                    null,
                    null
            );
            for (FailureExperience item : items) {
                if (recommended.stream().noneMatch(existing -> existing.getId().equals(item.getId()))) {
                    recommended.add(item);
                }
                if (recommended.size() >= 12) {
                    break;
                }
            }
            if (recommended.size() >= 12) {
                break;
            }
        }

        String strategy = "activity-based";
        if (recommended.isEmpty()) {
            strategy = "popular-fallback";
            recommended.addAll(
                    experienceRepository.searchPublicPopular(
                                    null,
                                    null,
                                    null,
                                    null,
                                    null,
                                    null,
                                    null
                            ).stream()
                            .limit(12)
                            .toList()
            );
        }

        return new HomeFeedResponse(
                strategy,
                preferredCategoryIds,
                recommended.stream().map(this::toResponse).toList()
        );
    }

    private ExperienceResponse toResponse(FailureExperience experience) {
        return ExperienceResponse.from(
                experience,
                aiAnalysisService.findByExperience(experience).orElse(null),
                bookmarkRepository.countByExperienceId(experience.getId())
        );
    }

    private void accumulateCategoryWeights(
            Map<Long, Integer> categoryWeights,
            List<FailureExperience> experiences,
            int weight
    ) {
        for (FailureExperience experience : experiences) {
            Long categoryId = experience.getCategory().getId();
            categoryWeights.merge(categoryId, weight, Integer::sum);
        }
    }
}
