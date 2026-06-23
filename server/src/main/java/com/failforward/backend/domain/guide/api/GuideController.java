package com.failforward.backend.domain.guide.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.guide.dto.GuideDtos.ExperienceGuideResponse;
import com.failforward.backend.domain.guide.dto.GuideWritingExampleDtos.GuideWritingExamplesResponse;
import com.failforward.backend.domain.guide.service.GuideService;
import com.failforward.backend.domain.guide.service.GuideWritingExampleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/guides", "/guides"})
@RequiredArgsConstructor
public class GuideController {

    private final GuideService guideService;
    private final GuideWritingExampleService guideWritingExampleService;

    @GetMapping("/experiences/{experienceId}")
    public ApiResponse<ExperienceGuideResponse> getExperienceGuide(@PathVariable Long experienceId) {
        return ApiResponse.ok("Experience guide loaded.", guideService.getExperienceGuide(experienceId));
    }

    @GetMapping("/writing-examples")
    public ApiResponse<GuideWritingExamplesResponse> getGuideWritingExamples() {
        return ApiResponse.ok("Guide writing examples loaded.", guideWritingExampleService.getExamples());
    }
}
