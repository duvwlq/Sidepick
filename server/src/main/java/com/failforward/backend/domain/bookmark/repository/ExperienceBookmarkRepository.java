package com.failforward.backend.domain.bookmark.repository;

import com.failforward.backend.domain.bookmark.entity.ExperienceBookmark;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperienceBookmarkRepository extends JpaRepository<ExperienceBookmark, Long> {

    Optional<ExperienceBookmark> findByExperienceAndUserId(FailureExperience experience, Long userId);

    boolean existsByExperienceIdAndUserId(Long experienceId, Long userId);

    @EntityGraph(attributePaths = {"experience", "experience.user", "experience.category"})
    List<ExperienceBookmark> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
