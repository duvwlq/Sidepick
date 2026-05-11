package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.analysis.repository.AiAnalysisRepository;
import com.failforward.backend.domain.analysis.repository.MatchedCaseRepository;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisResponse;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ai-similar-case-repair.enabled", havingValue = "true")
public class AiSimilarCaseRepairRunner implements ApplicationRunner {

    private final AiAnalysisRepository aiAnalysisRepository;
    private final MatchedCaseRepository matchedCaseRepository;
    private final FailureExperienceRepository experienceRepository;
    private final AIAnalysisSupport analysisSupport;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<AiAnalysis> analyses = aiAnalysisRepository.findAllByOrderByIdAsc();
        int updatedCount = 0;

        for (AiAnalysis analysis : analyses) {
            FailureExperience experience = analysis.getExperience();
            if (experience == null || experience.getId() == null) {
                continue;
            }

            List<MatchedCase> currentMatchedCases = matchedCaseRepository.findByAnalysis(analysis);
            if (currentMatchedCases.isEmpty() || currentMatchedCases.stream().noneMatch(item -> isSelfMatch(item, experience.getId()))) {
                continue;
            }

            List<FailureExperience> similarExperiences = findSimilarExperiences(experience);
            AiAnalysisResponse response = new AiAnalysisResponse(
                    List.of(),
                    analysis.getFailureCategory(),
                    analysis.getStructuredSummary(),
                    analysis.getRiskLevel()
            );
            List<MatchedCase> repairedCases = analysisSupport.createMatchedCasesFromExperiences(
                    analysis,
                    experience,
                    similarExperiences,
                    response
            );

            matchedCaseRepository.deleteByAnalysis(analysis);
            if (!repairedCases.isEmpty()) {
                matchedCaseRepository.saveAll(repairedCases);
            }
            updatedCount++;
        }

        log.info("ai_similar_case_repair_completed totalAnalyses={} updatedCount={}", analyses.size(), updatedCount);
    }

    private boolean isSelfMatch(MatchedCase matchedCase, Long experienceId) {
        String caseId = matchedCase.getCaseId();
        if (caseId == null || experienceId == null) {
            return false;
        }
        return caseId.equals(String.valueOf(experienceId)) || caseId.equals("CASE-" + experienceId);
    }

    private List<FailureExperience> findSimilarExperiences(FailureExperience experience) {
        if (experience.getCategory() == null || experience.getCategory().getId() == null) {
            return List.of();
        }

        PageRequest topThree = PageRequest.of(0, 3);
        List<FailureExperience> exactMatches = experienceRepository.findPublicSimilarByCategoryAndFailureReason(
                experience.getId(),
                experience.getCategory().getId(),
                experience.getFailureReason(),
                topThree
        );
        if (!exactMatches.isEmpty()) {
            return exactMatches;
        }

        return experienceRepository.findPublicSimilarByCategory(
                experience.getId(),
                experience.getCategory().getId(),
                topThree
        );
    }
}
