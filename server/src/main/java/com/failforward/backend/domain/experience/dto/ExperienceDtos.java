package com.failforward.backend.domain.experience.dto;

import com.failforward.backend.common.api.PageInfo;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.category.dto.CategoryResponse;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public final class ExperienceDtos {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ExperienceDtos() {
    }

    public record ExperienceCreateRequest(
            String title,
            @NotBlank String content,
            @NotNull Long categoryId,
            String businessType,
            Integer investmentAmount,
            Integer durationMonths,
            String failureReason,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry
    ) {
    }

    public record ExperienceUpdateRequest(
            String title,
            @NotBlank String content,
            @NotNull Long categoryId,
            String businessType,
            Integer investmentAmount,
            Integer durationMonths,
            String failureReason,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry
    ) {
    }

    public record ExperienceResponse(
            Long id,
            UserSummary author,
            CategoryResponse category,
            String title,
            String content,
            String businessType,
            Integer investmentAmount,
            Integer durationMonths,
            String failureReason,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry,
            Map<String, Object> structuredData,
            Integer viewCount,
            Integer likeCount,
            boolean hasPatternAnalysis,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static ExperienceResponse from(FailureExperience experience, AiAnalysis analysis) {
            Map<String, Object> structured = parseObject(experience.getStructuredData());
            return new ExperienceResponse(
                    experience.getId(),
                    UserSummary.from(experience.getUser()),
                    new CategoryResponse(
                            experience.getCategory().getId(),
                            experience.getCategory().getName(),
                            experience.getCategory().getDescription(),
                            experience.getCategory().getIcon(),
                            experience.getCategory().getColor()
                    ),
                    experience.getTitle(),
                    experience.getContent(),
                    experience.getBusinessType(),
                    experience.getInvestmentAmount(),
                    experience.getDurationMonths(),
                    experience.getFailureReason(),
                    experience.getTargetMarket(),
                    parseStringList(experience.getMarketingChannels()),
                    experience.getLessonsLearned(),
                    experience.getWouldRetry(),
                    structured,
                    experience.getViewCount(),
                    experience.getLikeCount(),
                    analysis != null,
                    experience.getCreatedAt(),
                    experience.getUpdatedAt()
            );
        }
    }

    public record ExperienceListPayload(
            List<ExperienceResponse> experiences,
            PageInfo pagination
    ) {
    }

    public record SimilarityMatchResponse(
            ExperienceResponse similarExperience,
            double similarityScore,
            List<String> matchingFactors,
            List<String> differenceFactors
    ) {
    }

    public record CompareRequest(List<Long> experienceIds) {
    }

    public record CompareResponse(
            List<ExperienceResponse> experiences,
            List<String> commonPatterns,
            List<String> differences,
            List<String> recommendations
    ) {
    }

    public static List<String> parseStringList(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(value, new TypeReference<>() {});
        } catch (Exception ignored) {
            return Collections.emptyList();
        }
    }

    public static Map<String, Object> parseObject(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return OBJECT_MAPPER.readValue(value, new TypeReference<>() {});
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }
}
