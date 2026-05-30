package com.failforward.backend.domain.user.service;

import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.analysis.service.AIAnalysisService;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.bookmark.repository.ExperienceBookmarkRepository;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceResponse;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.user.dto.UserDtos.MeResponse;
import com.failforward.backend.domain.user.dto.UserDtos.MyAnalysisItemResponse;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.view.repository.UserExperienceViewRepository;
import java.util.List;
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

    private ExperienceResponse toResponse(FailureExperience experience) {
        return ExperienceResponse.from(experience, aiAnalysisService.findByExperience(experience).orElse(null));
    }
}
