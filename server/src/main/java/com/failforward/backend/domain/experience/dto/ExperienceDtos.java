package com.failforward.backend.domain.experience.dto;

import com.failforward.backend.common.api.PageInfo;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.category.dto.CategoryResponse;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

public final class ExperienceDtos {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern MARKDOWN_IMAGE_PATTERN = Pattern.compile("!\\[[^\\]]*]\\((https?://[^)\\s]+)\\)");
    private static final Pattern HTML_IMAGE_PATTERN = Pattern.compile("<img[^>]+src=[\"'](https?://[^\"']+)[\"'][^>]*>");
    private static final Pattern DIRECT_IMAGE_URL_PATTERN =
            Pattern.compile("https?://[^\\s<>\"')]+?\\.(?:png|jpe?g|gif|webp|svg)(?:\\?[^\\s<>\"')]*)?");

    private ExperienceDtos() {
    }

    public record ExperienceCreateRequest(
            String title,
            @NotBlank String content,
            @NotNull Long categoryId,
            String businessType,
            Long investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Long monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String difficultyEtc,
            String difficultyExtra,
            String targetMarket,
            List<String> marketingChannels,
            List<String> imageUrls,
            String lessonsLearned,
            Boolean wouldRetry,
            AiSupplementRequest aiSupplement
    ) {
    }

    public record ExperienceUpdateRequest(
            String title,
            @NotBlank String content,
            @NotNull Long categoryId,
            String businessType,
            Long investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Long monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String difficultyEtc,
            String difficultyExtra,
            String targetMarket,
            List<String> marketingChannels,
            List<String> imageUrls,
            String lessonsLearned,
            Boolean wouldRetry,
            AiSupplementRequest aiSupplement
    ) {
    }

    public record AiSupplementRequest(
            String originalContent,
            List<AiSupplementAnswer> answers
    ) {
    }

    public record AiSupplementAnswer(
            String slot,
            String question,
            String answer
    ) {
    }

    public record ExperienceResponse(
            Long id,
            UserSummary author,
            CategoryResponse category,
            String caseStatus,
            String title,
            String content,
            String businessType,
            Long investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Long monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String difficultyEtc,
            String difficultyExtra,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry,
            AnalysisSummary analysis,
            Map<String, Object> structuredData,
            Integer viewCount,
            Integer likeCount,
            Integer bookmarkCount,
            boolean hasPatternAnalysis,
            @JsonInclude(JsonInclude.Include.NON_NULL)
            String recommendationReason,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static ExperienceResponse from(FailureExperience experience, AiAnalysis analysis) {
            return from(experience, analysis, 0);
        }

        public static ExperienceResponse from(FailureExperience experience, AiAnalysis analysis, Integer bookmarkCount) {
            return from(experience, analysis, bookmarkCount, null);
        }

        public static ExperienceResponse from(
                FailureExperience experience,
                AiAnalysis analysis,
                Integer bookmarkCount,
                String recommendationReason
        ) {
            Map<String, Object> structured = parseObject(experience.getStructuredData());
            return new ExperienceResponse(
                    experience.getId(),
                    UserSummary.from(experience.getUser()),
                    CategoryResponse.from(experience.getCategory()),
                    experience.getCaseStatus(),
                    experience.getTitle(),
                    experience.getContent(),
                    experience.getBusinessType(),
                    experience.getInvestmentAmount(),
                    experience.getDurationMonths(),
                    experience.getWeeklyHours(),
                    experience.getAverageDailyHours(),
                    experience.getIsConcurrentWithMainJob(),
                    experience.getMonthlyRevenue(),
                    experience.getFailureReason(),
                    parseStringList(experience.getFailureReasons()),
                    parseStringList(experience.getDifficulties()),
                    experience.getDifficultyEtc(),
                    experience.getDifficultyExtra(),
                    experience.getTargetMarket(),
                    parseStringList(experience.getMarketingChannels()),
                    experience.getLessonsLearned(),
                    experience.getWouldRetry(),
                    AnalysisSummary.from(analysis),
                    structured,
                    experience.getViewCount(),
                    experience.getLikeCount(),
                    bookmarkCount,
                    analysis != null,
                    recommendationReason,
                    experience.getCreatedAt(),
                    experience.getUpdatedAt()
            );
        }
    }

    public record AnalysisSummary(
            String structuredSummary,
            List<String> extractedPatterns,
            List<String> keywords,
            String failureCategory,
            String riskLevel,
            List<String> riskFactors,
            List<String> successFactors,
            BigDecimal confidenceScore
    ) {
        public static AnalysisSummary from(AiAnalysis analysis) {
            if (analysis == null) {
                return null;
            }
            PatternAnalysisResponse response = PatternAnalysisResponse.from(analysis);
            return new AnalysisSummary(
                    response.structuredSummary(),
                    response.extractedPatterns(),
                    response.keywords(),
                    response.failureCategory(),
                    response.riskLevel(),
                    response.riskFactors(),
                    response.successFactors(),
                    response.confidenceScore()
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

    public record ExperienceShareResponse(
            Long experienceId,
            String title,
            String description,
            String shareUrl,
            String imageUrl,
            String downloadImageUrl,
            String webUrl,
            String caseStatus,
            String categoryName
    ) {
    }

    public record ExperienceSharePageResponse(
            Long experienceId,
            String title,
            String description,
            String shareUrl,
            String downloadImageUrl,
            String webUrl,
            String categoryName
    ) {
    }

    public record ExperienceImageUploadResponse(
            List<String> imageUrls
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

    public static List<String> extractImageUrls(FailureExperience experience) {
        List<String> urls = new ArrayList<>();
        collectUrlsFromContent(experience.getContent(), urls);
        collectUrlsFromUnknown(parseObject(experience.getStructuredData()), urls);
        return urls.stream().distinct().toList();
    }

    private static void collectUrlsFromContent(String content, List<String> result) {
        if (content == null || content.isBlank()) {
            return;
        }
        collectGroupMatches(MARKDOWN_IMAGE_PATTERN, content, result, true);
        collectGroupMatches(HTML_IMAGE_PATTERN, content, result, true);
        collectGroupMatches(DIRECT_IMAGE_URL_PATTERN, content, result, false);
    }

    private static void collectGroupMatches(Pattern pattern, String content, List<String> result, boolean useGroupOne) {
        var matcher = pattern.matcher(content);
        while (matcher.find()) {
            String value = (useGroupOne ? matcher.group(1) : matcher.group()).trim();
            if (!value.isBlank()) {
                result.add(value);
            }
        }
    }

    private static void collectUrlsFromUnknown(Object value, List<String> result) {
        if (value == null) {
            return;
        }
        if (value instanceof String stringValue) {
            String trimmed = stringValue.trim();
            if (DIRECT_IMAGE_URL_PATTERN.matcher(trimmed).matches()) {
                result.add(trimmed);
            }
            return;
        }
        if (value instanceof List<?> listValue) {
            listValue.forEach(item -> collectUrlsFromUnknown(item, result));
            return;
        }
        if (value instanceof Map<?, ?> mapValue) {
            mapValue.forEach((key, nestedValue) -> {
                String loweredKey = key == null ? "" : key.toString().toLowerCase();
                if (containsImageKey(loweredKey)) {
                    collectUrlsFromUnknown(nestedValue, result);
                }
            });
        }
    }

    private static boolean containsImageKey(String key) {
        return Set.of("image", "img", "photo").stream().anyMatch(key::contains);
    }
}
