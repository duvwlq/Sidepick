package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.AnalysisReportResponse;
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

    public void createAnalysis(Long experienceId) {
        aiAnalysisService.createAnalysis(experienceId);
    }

    public AnalysisReportResponse getReport(Long experienceId) {
        return aiAnalysisService.getReport(experienceId);
    }

    public List<MatchedCaseResponse> getMatchedCases(Long analysisId) {
        return aiAnalysisService.getMatchedCases(analysisId);
    }
}
