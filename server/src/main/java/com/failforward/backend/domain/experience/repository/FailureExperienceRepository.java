package com.failforward.backend.domain.experience.repository;

import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;

public interface FailureExperienceRepository extends JpaRepository<FailureExperience, Long> {

    @EntityGraph(attributePaths = {"user", "category"})
    @Query("select e from FailureExperience e where e.id = :experienceId")
    Optional<FailureExperience> findWithUserAndCategoryById(Long experienceId);

    @EntityGraph(attributePaths = {"user", "category"})
    List<FailureExperience> findAllByIsPublicTrueOrderByCreatedAtDesc();
}
