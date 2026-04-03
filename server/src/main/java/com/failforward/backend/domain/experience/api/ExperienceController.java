package com.failforward.backend.domain.experience.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.CompareRequest;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.CompareResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceCreateRequest;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceListPayload;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceUpdateRequest;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.SimilarityMatchResponse;
import com.failforward.backend.domain.experience.service.ExperienceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    public ApiResponse<ExperienceListPayload> getExperiences(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String failureReason
    ) {
        return ApiResponse.ok("실패 경험 목록 조회 성공", experienceService.getList(page, size, failureReason));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExperienceResponse> createExperience(@Valid @RequestBody ExperienceCreateRequest request) {
        return ApiResponse.ok("실패 경험 등록 성공", experienceService.create(request));
    }

    @GetMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> getExperience(@PathVariable Long experienceId) {
        return ApiResponse.ok("실패 경험 상세 조회 성공", experienceService.getDetail(experienceId));
    }

    @PatchMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> updateExperience(
            @PathVariable Long experienceId,
            @Valid @RequestBody ExperienceUpdateRequest request
    ) {
        return ApiResponse.ok("실패 경험 수정 성공", experienceService.update(experienceId, request));
    }

    @DeleteMapping("/{experienceId}")
    public ApiResponse<Void> deleteExperience(@PathVariable Long experienceId) {
        experienceService.delete(experienceId);
        return ApiResponse.ok("실패 경험 삭제 성공", null);
    }

    @GetMapping("/{experienceId}/similar")
    public ApiResponse<List<SimilarityMatchResponse>> getSimilarExperiences(
            @PathVariable Long experienceId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.ok("유사 사례 조회 성공", experienceService.getSimilar(experienceId, limit));
    }

    @PostMapping("/compare")
    public ApiResponse<CompareResponse> compareExperiences(@RequestBody CompareRequest request) {
        return ApiResponse.ok("실패 경험 비교 분석 성공", experienceService.compare(request.experienceIds()));
    }
}
