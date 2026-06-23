package com.failforward.backend.domain.successcase.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceResponse;
import com.failforward.backend.domain.experience.service.ExperienceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SuccessCaseController {

    private final ExperienceService experienceService;

    @GetMapping("/api/success-cases")
    public ApiResponse<List<ExperienceResponse>> getSuccessCases(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.ok("Success cases loaded.", experienceService.getSuccessCases(categoryId, limit));
    }

    @GetMapping("/api/success-cases/{successCaseId}")
    public ApiResponse<ExperienceResponse> getSuccessCaseDetail(@PathVariable Long successCaseId) {
        return ApiResponse.ok("Success case loaded.", experienceService.getSuccessCaseDetail(successCaseId));
    }
}
