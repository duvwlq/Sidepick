package com.failforward.backend.domain.analysis.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.AnalysisReportResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.service.AnalysisService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping("/api/reports/{experienceId}")
    public ApiResponse<AnalysisReportResponse> getReport(@PathVariable Long experienceId) {
        return ApiResponse.ok("Report loaded.", analysisService.getReport(experienceId));
    }

    @GetMapping("/api/experiences/{experienceId}/analysis")
    public ApiResponse<PatternAnalysisResponse> getAnalysis(@PathVariable Long experienceId) {
        return ApiResponse.ok("Analysis loaded.", analysisService.getAnalysis(experienceId));
    }

    @PostMapping("/api/experiences/{experienceId}/analysis")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<Void> createAnalysis(@PathVariable Long experienceId) {
        analysisService.createAnalysis(experienceId);
        return ApiResponse.ok("Analysis started.", null);
    }

    @GetMapping("/api/analysis/{analysisId}/matched-cases")
    public ApiResponse<List<MatchedCaseResponse>> getMatchedCases(@PathVariable Long analysisId) {
        return ApiResponse.ok("Matched cases loaded.", analysisService.getMatchedCases(analysisId));
    }
}
