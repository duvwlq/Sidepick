package com.failforward.backend.domain.bookmark.service;

import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.bookmark.dto.BookmarkDtos.BookmarkStatusResponse;
import com.failforward.backend.domain.bookmark.entity.ExperienceBookmark;
import com.failforward.backend.domain.bookmark.repository.ExperienceBookmarkRepository;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.notification.service.NotificationService;
import com.failforward.backend.domain.user.entity.User;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookmarkService {

    private final ExperienceBookmarkRepository bookmarkRepository;
    private final FailureExperienceRepository experienceRepository;
    private final CurrentUserProvider currentUserProvider;
    private final NotificationService notificationService;

    @Transactional
    public BookmarkStatusResponse bookmark(Long experienceId) {
        User user = currentUserProvider.getCurrentUserEntity();
        FailureExperience experience = getExperience(experienceId);
        Optional<ExperienceBookmark> existing = bookmarkRepository.findByExperienceAndUserId(experience, user.getId());
        if (existing.isPresent()) {
            return new BookmarkStatusResponse(experienceId, true, bookmarkRepository.countByExperienceId(experienceId));
        }

        bookmarkRepository.save(ExperienceBookmark.create(experience, user));
        notificationService.createExperienceBookmarkNotification(
                experience.getUser(),
                user,
                experience.getId(),
                experience.getTitle()
        );
        experience.increaseLikeCount();
        return new BookmarkStatusResponse(experienceId, true, bookmarkRepository.countByExperienceId(experienceId));
    }

    @Transactional
    public BookmarkStatusResponse unbookmark(Long experienceId) {
        User user = currentUserProvider.getCurrentUserEntity();
        FailureExperience experience = getExperience(experienceId);
        bookmarkRepository.findByExperienceAndUserId(experience, user.getId()).ifPresent(bookmark -> {
            bookmarkRepository.delete(bookmark);
            experience.decreaseLikeCount();
        });
        return new BookmarkStatusResponse(experienceId, false, bookmarkRepository.countByExperienceId(experienceId));
    }

    public BookmarkStatusResponse getStatus(Long experienceId) {
        User user = currentUserProvider.getCurrentUserEntity();
        FailureExperience experience = getExperience(experienceId);
        return new BookmarkStatusResponse(
                experienceId,
                bookmarkRepository.existsByExperienceIdAndUserId(experienceId, user.getId()),
                bookmarkRepository.countByExperienceId(experienceId)
        );
    }

    private FailureExperience getExperience(Long experienceId) {
        return experienceRepository.findWithUserAndCategoryById(experienceId)
                .orElseThrow(() -> new com.failforward.backend.common.api.NotFoundException("Experience not found."));
    }
}
