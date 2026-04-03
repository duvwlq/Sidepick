package com.failforward.backend.domain.analysis.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.service.AnalysisService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping("/api/experiences/{experienceId}/analysis")
    public ApiResponse<PatternAnalysisResponse> getAnalysis(@PathVariable Long experienceId) {
        return ApiResponse.ok("AI 분석 결과 조회 성공", analysisService.getAnalysis(experienceId));
    }

    @PostMapping("/api/experiences/{experienceId}/analysis")
    public ApiResponse<PatternAnalysisResponse> createAnalysis(@PathVariable Long experienceId) {
        return ApiResponse.ok("AI 분석 완료", analysisService.createAnalysis(experienceId));
    }

    @GetMapping("/api/analysis/{analysisId}/matched-cases")
    public ApiResponse<List<MatchedCaseResponse>> getMatchedCases(@PathVariable Long analysisId) {
        return ApiResponse.ok("유사 사례 조회 성공", analysisService.getMatchedCases(analysisId));
    }
}
