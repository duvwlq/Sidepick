package com.failforward.backend.domain.experience.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.CompareRequest;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.CompareResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceCreateRequest;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceImageUploadResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceListPayload;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceSharePageResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceShareResponse;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceUpdateRequest;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.SimilarityMatchResponse;
import com.failforward.backend.domain.experience.service.ExperienceService;
import com.failforward.backend.domain.experience.service.ExperienceSharePageRenderer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping({"/api/experiences", "/experiences"})
@RequiredArgsConstructor
@Tag(name = "Experiences", description = "Experience APIs")
public class ExperienceController {

    private final ExperienceService experienceService;
    private final ExperienceSharePageRenderer experienceSharePageRenderer;

    @Operation(summary = "List experiences")
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
            @RequestParam(required = false) Long investmentAmountMin,
            @RequestParam(required = false) Long investmentAmountMax
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

    @Operation(summary = "Search cases")
    @GetMapping({"/search", "/cases/search"})
    public ApiResponse<ExperienceListPayload> searchCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String failureReason,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer durationMonthsMin,
            @RequestParam(required = false) Integer durationMonthsMax,
            @RequestParam(required = false) Long investmentAmountMin,
            @RequestParam(required = false) Long investmentAmountMax
    ) {
        return ApiResponse.ok("Cases search loaded.", experienceService.getList(
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

    @Operation(summary = "Create experience")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExperienceResponse> createExperience(@Valid @RequestBody ExperienceCreateRequest request) {
        return ApiResponse.ok("Experience created.", experienceService.create(request));
    }

    @Operation(summary = "Upload experience images")
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ExperienceImageUploadResponse> uploadExperienceImages(
            @RequestParam("files") List<MultipartFile> files,
            HttpServletRequest request
    ) {
        return ApiResponse.ok(
                "Experience images uploaded.",
                experienceService.uploadExperienceImages(files, resolvePublicBaseUrl(request))
        );
    }

    @Operation(summary = "Get experience detail")
    @GetMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> getExperience(@PathVariable Long experienceId) {
        return ApiResponse.ok("Experience loaded.", experienceService.getDetail(experienceId));
    }

    @Operation(summary = "Get experience share payload")
    @GetMapping("/{experienceId}/share")
    public ApiResponse<ExperienceShareResponse> getExperienceShare(@PathVariable Long experienceId) {
        return ApiResponse.ok("Experience share payload loaded.", experienceService.getShare(experienceId));
    }

    @Operation(summary = "Get experience share page with OG metadata")
    @GetMapping(value = "/{experienceId}/share-page", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getExperienceSharePage(@PathVariable Long experienceId) {
        ExperienceSharePageResponse page = experienceService.getSharePage(experienceId);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(experienceSharePageRenderer.render(page));
    }

    @Operation(summary = "Download experience share image")
    @GetMapping(value = "/{experienceId}/share-image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> downloadExperienceShareImage(@PathVariable Long experienceId) {
        byte[] image = experienceService.createShareImage(experienceId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(
                        "Content-Disposition",
                        ContentDisposition.attachment()
                                .filename("sidepick-share-" + experienceId + ".png")
                                .build()
                                .toString()
                )
                .body(image);
    }

    @Operation(summary = "Update experience")
    @PatchMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> updateExperience(
            @PathVariable Long experienceId,
            @Valid @RequestBody ExperienceUpdateRequest request
    ) {
        return ApiResponse.ok("Experience updated.", experienceService.update(experienceId, request));
    }

    @Operation(summary = "Replace experience")
    @PutMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> replaceExperience(
            @PathVariable Long experienceId,
            @Valid @RequestBody ExperienceUpdateRequest request
    ) {
        return ApiResponse.ok("Experience updated.", experienceService.update(experienceId, request));
    }

    @Operation(summary = "Delete experience")
    @DeleteMapping("/{experienceId}")
    public ApiResponse<Void> deleteExperience(@PathVariable Long experienceId) {
        experienceService.delete(experienceId);
        return ApiResponse.ok("Experience deleted.", null);
    }

    @Operation(summary = "List similar experiences")
    @GetMapping("/{experienceId}/similar")
    public ApiResponse<List<SimilarityMatchResponse>> getSimilarExperiences(
            @PathVariable Long experienceId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.ok("Similar experiences loaded.", experienceService.getSimilar(experienceId, limit));
    }

    @Operation(summary = "List related success cases")
    @GetMapping("/{experienceId}/success-cases")
    public ApiResponse<List<ExperienceResponse>> getRelatedSuccessCases(
            @PathVariable Long experienceId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.ok("Related success cases loaded.", experienceService.getRelatedSuccessCases(experienceId, limit));
    }

    @Operation(summary = "Compare experiences")
    @PostMapping("/compare")
    public ApiResponse<CompareResponse> compareExperiences(@RequestBody CompareRequest request) {
        return ApiResponse.ok("Experiences compared.", experienceService.compare(request.experienceIds()));
    }

    private String resolvePublicBaseUrl(HttpServletRequest request) {
        StringBuilder builder = new StringBuilder();
        builder.append(request.getScheme())
                .append("://")
                .append(request.getServerName());
        if (!isDefaultPort(request.getScheme(), request.getServerPort())) {
            builder.append(":").append(request.getServerPort());
        }
        return builder.toString();
    }

    private boolean isDefaultPort(String scheme, int port) {
        return ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443);
    }
}
