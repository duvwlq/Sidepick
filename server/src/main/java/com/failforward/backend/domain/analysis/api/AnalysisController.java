package com.failforward.backend.domain.analysis.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.service.AIAnalysisService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnalysisController {

    private final AIAnalysisService aiAnalysisService;

    @GetMapping("/api/experiences/{experienceId}/analysis")
    public ApiResponse<PatternAnalysisResponse> getAnalysis(@PathVariable Long experienceId) {
        return ApiResponse.ok("Analysis loaded.", aiAnalysisService.getAnalysis(experienceId));
    }

    @PostMapping("/api/experiences/{experienceId}/analysis")
    public ApiResponse<PatternAnalysisResponse> createAnalysis(@PathVariable Long experienceId) {
        return ApiResponse.ok("Analysis created.", aiAnalysisService.createAnalysis(experienceId));
    }

    @GetMapping("/api/analysis/{analysisId}/matched-cases")
    public ApiResponse<List<MatchedCaseResponse>> getMatchedCases(@PathVariable Long analysisId) {
        return ApiResponse.ok("Matched cases loaded.", aiAnalysisService.getMatchedCases(analysisId));
    }
}
