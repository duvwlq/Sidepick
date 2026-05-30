package com.failforward.backend.domain.user.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceResponse;
import com.failforward.backend.domain.user.dto.UserDtos.MyAnalysisItemResponse;
import com.failforward.backend.domain.user.service.UserActivityService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserActivityController {

    private final UserActivityService userActivityService;

    @GetMapping("/experiences")
    public ApiResponse<List<ExperienceResponse>> getMyExperiences() {
        return ApiResponse.ok("My experiences loaded.", userActivityService.getMyExperiences());
    }

    @GetMapping("/bookmarks")
    public ApiResponse<List<ExperienceResponse>> getMyBookmarks() {
        return ApiResponse.ok("My bookmarks loaded.", userActivityService.getMyBookmarks());
    }

    @GetMapping("/recent-views")
    public ApiResponse<List<ExperienceResponse>> getMyRecentViews() {
        return ApiResponse.ok("My recent views loaded.", userActivityService.getMyRecentViews());
    }

    @GetMapping("/analysis-reports")
    public ApiResponse<List<MyAnalysisItemResponse>> getMyAnalysisReports() {
        return ApiResponse.ok("My analysis reports loaded.", userActivityService.getMyAnalysisReports());
    }
}
