package com.failforward.backend.domain.analysis.repository;

import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiAnalysisRepository extends JpaRepository<AiAnalysis, Long> {

    Optional<AiAnalysis> findByExperience(FailureExperience experience);
}
