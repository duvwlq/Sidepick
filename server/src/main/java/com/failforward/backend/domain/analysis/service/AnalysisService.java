package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final AIAnalysisService aiAnalysisService;

    public PatternAnalysisResponse getAnalysis(Long experienceId) {
        return aiAnalysisService.getAnalysis(experienceId);
    }

    public PatternAnalysisResponse createAnalysis(Long experienceId) {
        return aiAnalysisService.createAnalysis(experienceId);
    }

    public List<MatchedCaseResponse> getMatchedCases(Long analysisId) {
        return aiAnalysisService.getMatchedCases(analysisId);
    }
}
