package com.failforward.backend.domain.experience.repository;

import com.failforward.backend.domain.experience.entity.FailureExperience;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FailureExperienceRepository extends JpaRepository<FailureExperience, Long> {
}
