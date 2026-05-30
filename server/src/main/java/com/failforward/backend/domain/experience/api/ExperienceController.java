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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/experiences", "/experiences"})
@RequiredArgsConstructor
@Tag(name = "Experiences", description = "Experience APIs")
public class ExperienceController {

    private final ExperienceService experienceService;

    @Operation(summary = "사례 목록 조회")
    @GetMapping
    public ApiResponse<ExperienceListPayload> getExperiences(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String failureReason,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer durationMonthsMin,
            @RequestParam(required = false) Integer durationMonthsMax,
            @RequestParam(required = false) Integer investmentAmountMin,
            @RequestParam(required = false) Integer investmentAmountMax
    ) {
        return ApiResponse.ok("Experiences loaded.", experienceService.getList(
                page,
                size,
                failureReason,
                q,
                sort,
                categoryId,
                durationMonthsMin,
                durationMonthsMax,
                investmentAmountMin,
                investmentAmountMax
        ));
    }

    @Operation(summary = "사례 작성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExperienceResponse> createExperience(@Valid @RequestBody ExperienceCreateRequest request) {
        return ApiResponse.ok("Experience created.", experienceService.create(request));
    }

    @Operation(summary = "사례 상세 조회")
    @GetMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> getExperience(@PathVariable Long experienceId) {
        return ApiResponse.ok("Experience loaded.", experienceService.getDetail(experienceId));
    }

    @Operation(summary = "사례 수정")
    @PatchMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> updateExperience(
            @PathVariable Long experienceId,
            @Valid @RequestBody ExperienceUpdateRequest request
    ) {
        return ApiResponse.ok("Experience updated.", experienceService.update(experienceId, request));
    }

    @Operation(summary = "?щ? ?섏젙")
    @PutMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> replaceExperience(
            @PathVariable Long experienceId,
            @Valid @RequestBody ExperienceUpdateRequest request
    ) {
        return ApiResponse.ok("Experience updated.", experienceService.update(experienceId, request));
    }

    @Operation(summary = "사례 삭제")
    @DeleteMapping("/{experienceId}")
    public ApiResponse<Void> deleteExperience(@PathVariable Long experienceId) {
        experienceService.delete(experienceId);
        return ApiResponse.ok("Experience deleted.", null);
    }

    @Operation(summary = "유사 사례 조회")
    @GetMapping("/{experienceId}/similar")
    public ApiResponse<List<SimilarityMatchResponse>> getSimilarExperiences(
            @PathVariable Long experienceId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.ok("Similar experiences loaded.", experienceService.getSimilar(experienceId, limit));
    }

    @Operation(summary = "관련 성공 사례 조회")
    @GetMapping("/{experienceId}/success-cases")
    public ApiResponse<List<ExperienceResponse>> getRelatedSuccessCases(
            @PathVariable Long experienceId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.ok("Related success cases loaded.", experienceService.getRelatedSuccessCases(experienceId, limit));
    }

    @Operation(summary = "사례 비교")
    @PostMapping("/compare")
    public ApiResponse<CompareResponse> compareExperiences(@RequestBody CompareRequest request) {
        return ApiResponse.ok("Experiences compared.", experienceService.compare(request.experienceIds()));
    }
}
