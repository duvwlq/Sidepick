package com.failforward.backend.domain.bookmark.service;

import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.bookmark.dto.BookmarkDtos.BookmarkStatusResponse;
import com.failforward.backend.domain.bookmark.entity.ExperienceBookmark;
import com.failforward.backend.domain.bookmark.repository.ExperienceBookmarkRepository;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
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

    @Transactional
    public BookmarkStatusResponse bookmark(Long experienceId) {
        User user = currentUserProvider.getCurrentUserEntity();
        FailureExperience experience = getExperience(experienceId);
        Optional<ExperienceBookmark> existing = bookmarkRepository.findByExperienceAndUserId(experience, user.getId());
        if (existing.isPresent()) {
            return new BookmarkStatusResponse(experienceId, true);
        }

        bookmarkRepository.save(ExperienceBookmark.create(experience, user));
        experience.increaseLikeCount();
        return new BookmarkStatusResponse(experienceId, true);
    }

    @Transactional
    public BookmarkStatusResponse unbookmark(Long experienceId) {
        User user = currentUserProvider.getCurrentUserEntity();
        FailureExperience experience = getExperience(experienceId);
        bookmarkRepository.findByExperienceAndUserId(experience, user.getId()).ifPresent(bookmark -> {
            bookmarkRepository.delete(bookmark);
            experience.decreaseLikeCount();
        });
        return new BookmarkStatusResponse(experienceId, false);
    }

    public BookmarkStatusResponse getStatus(Long experienceId) {
        User user = currentUserProvider.getCurrentUserEntity();
        return new BookmarkStatusResponse(experienceId, bookmarkRepository.existsByExperienceIdAndUserId(experienceId, user.getId()));
    }

    private FailureExperience getExperience(Long experienceId) {
        return experienceRepository.findWithUserAndCategoryById(experienceId)
                .orElseThrow(() -> new com.failforward.backend.common.api.NotFoundException("Experience not found."));
    }
}
