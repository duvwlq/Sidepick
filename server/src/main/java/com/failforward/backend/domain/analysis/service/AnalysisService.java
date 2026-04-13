package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.analysis.repository.AiAnalysisRepository;
import com.failforward.backend.domain.analysis.repository.MatchedCaseRepository;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final FailureExperienceRepository experienceRepository;
    private final AiAnalysisRepository analysisRepository;
    private final MatchedCaseRepository matchedCaseRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PatternAnalysisResponse getAnalysis(Long experienceId) {
        FailureExperience experience = getExperience(experienceId);
        AiAnalysis analysis = analysisRepository.findByExperience(experience)
                .orElseThrow(() -> new NotFoundException("Analysis result not found."));
        return PatternAnalysisResponse.from(analysis);
    }

    public PatternAnalysisResponse createAnalysis(Long experienceId) {
        FailureExperience experience = getExperience(experienceId);
        return analysisRepository.findByExperience(experience)
                .map(PatternAnalysisResponse::from)
                .orElseGet(() -> PatternAnalysisResponse.from(saveGeneratedAnalysis(experience)));
    }

    public List<MatchedCaseResponse> getMatchedCases(Long analysisId) {
        AiAnalysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new NotFoundException("Analysis result not found."));
        return matchedCaseRepository.findByAnalysis(analysis).stream()
                .map(MatchedCaseResponse::from)
                .toList();
    }

    private AiAnalysis saveGeneratedAnalysis(FailureExperience experience) {
        AiAnalysis analysis = analysisRepository.save(AiAnalysis.create(
                experience,
                writeJson(List.of(experience.getFailureReason(), "Need better structure validation")),
                writeJson(List.of(
                        experience.getBusinessType() + " failure experience summary",
                        "Budget and validation plan need improvement"
                )),
                "The current analysis suggests stronger market validation and tighter budget planning.",
                BigDecimal.valueOf(0.87)
        ));

        matchedCaseRepository.save(MatchedCase.create(
                analysis,
                "CASE-" + experience.getId(),
                experience.getBusinessType() + " similar case",
                experience.getLessonsLearned(),
                "Review the failure reason and budget plan before the next attempt.",
                92
        ));

        return analysis;
    }

    private FailureExperience getExperience(Long experienceId) {
        return experienceRepository.findById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));
    }

    private String writeJson(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to create analysis payload.", exception);
        }
    }
}
