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
                .orElseThrow(() -> new NotFoundException("분석 결과를 찾을 수 없습니다."));
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
                .orElseThrow(() -> new NotFoundException("분석 결과를 찾을 수 없습니다."));
        return matchedCaseRepository.findByAnalysis(analysis).stream()
                .map(MatchedCaseResponse::from)
                .toList();
    }

    private AiAnalysis saveGeneratedAnalysis(FailureExperience experience) {
        AiAnalysis analysis = analysisRepository.save(AiAnalysis.create(
                experience,
                writeJson(List.of(experience.getFailureReason(), "구조화 재검토 필요")),
                writeJson(List.of(experience.getBusinessType() + " 실패 경험 요약", "재도전 전 전략 보완 필요")),
                "마케팅, 시장 검증, 자금 계획 측면에서 보완이 필요한 것으로 분석되었습니다.",
                BigDecimal.valueOf(0.87)
        ));

        matchedCaseRepository.save(MatchedCase.create(
                analysis,
                "CASE-" + experience.getId(),
                experience.getBusinessType() + " 유사 사례",
                experience.getLessonsLearned(),
                "실패 원인과 자금 계획을 함께 검토할 것",
                92
        ));

        return analysis;
    }

    private FailureExperience getExperience(Long experienceId) {
        return experienceRepository.findById(experienceId)
                .orElseThrow(() -> new NotFoundException("실패 경험을 찾을 수 없습니다."));
    }

    private String writeJson(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("분석 데이터 생성에 실패했습니다.", exception);
        }
    }
}
