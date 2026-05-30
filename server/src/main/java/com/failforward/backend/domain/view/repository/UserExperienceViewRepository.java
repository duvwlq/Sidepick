package com.failforward.backend.domain.view.repository;

import com.failforward.backend.domain.view.entity.UserExperienceView;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserExperienceViewRepository extends JpaRepository<UserExperienceView, Long> {

    Optional<UserExperienceView> findByExperienceIdAndUserId(Long experienceId, Long userId);

    @EntityGraph(attributePaths = {"experience", "experience.user", "experience.category"})
    List<UserExperienceView> findAllByUserIdOrderByLastViewedAtDesc(Long userId);
}
