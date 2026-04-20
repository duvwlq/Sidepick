package com.failforward.backend.domain.analysis.repository;

import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchedCaseRepository extends JpaRepository<MatchedCase, Long> {

    List<MatchedCase> findByAnalysis(AiAnalysis analysis);

    void deleteByAnalysis(AiAnalysis analysis);
}
