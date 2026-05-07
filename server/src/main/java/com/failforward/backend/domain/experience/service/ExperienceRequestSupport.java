package com.failforward.backend.domain.experience.service;

import com.failforward.backend.common.api.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
class ExperienceRequestSupport {

    private final ObjectMapper objectMapper;

    ExperienceRequestSupport(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    void validateWriteRequest(
            String content,
            Integer investmentAmount,
            Integer durationMonths,
            Integer monthlyRevenue,
            String failureReason,
            List<String> failureReasons
    ) {
        if (!hasText(content)) {
            throw new BadRequestException("Experience content is required.");
        }
        if (investmentAmount != null && investmentAmount < 0) {
            throw new BadRequestException("Investment amount must be zero or greater.");
        }
        if (durationMonths != null && durationMonths < 0) {
            throw new BadRequestException("Duration must be zero or greater.");
        }
        if (monthlyRevenue != null && monthlyRevenue < 0) {
            throw new BadRequestException("Monthly revenue must be zero or greater.");
        }
        boolean hasStructuredFailureReason = failureReasons != null && failureReasons.stream().anyMatch(this::hasText);
        if (!hasText(failureReason) && !hasStructuredFailureReason) {
            throw new BadRequestException("At least one failure reason is required.");
        }
    }

    String resolveBusinessType(String businessType, String categoryName) {
        return hasText(businessType) ? businessType : categoryName;
    }

    Integer resolveDurationMonths(Integer durationMonths) {
        return durationMonths != null && durationMonths > 0 ? durationMonths : 1;
    }

    Integer resolveWeeklyHours(Integer weeklyHours) {
        return weeklyHours != null && weeklyHours > 0 ? weeklyHours : 1;
    }

    List<String> normalizeTextList(List<String> values) {
        return values == null ? List.of() : values.stream()
                .filter(this::hasText)
                .toList();
    }

    String normalizeOptionalText(String value) {
        return hasText(value) ? value.trim() : "";
    }

    String resolveFailureReason(String failureReason, List<String> failureReasons) {
        return hasText(failureReason)
                ? failureReason
                : (failureReasons.isEmpty() ? "UNSPECIFIED" : failureReasons.get(0));
    }

    String resolveTitle(String title, String businessType) {
        return hasText(title) ? title : businessType + " failure experience";
    }

    String resolveLessons(String lessonsLearned, String content) {
        return hasText(lessonsLearned) ? lessonsLearned : content;
    }

    Map<String, Object> buildStructuredData(
            Long categoryId,
            String categoryName,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Integer monthlyRevenue,
            List<String> failureReasons,
            List<String> difficulties,
            String difficultyEtc,
            String difficultyExtra,
            String targetMarket,
            Boolean wouldRetry
    ) {
        Map<String, Object> structured = new HashMap<>();
        structured.put("categoryId", categoryId);
        structured.put("categoryName", categoryName);
        structured.put("durationMonths", durationMonths);
        structured.put("weeklyHours", weeklyHours);
        structured.put("averageDailyHours", averageDailyHours);
        structured.put("isConcurrentWithMainJob", isConcurrentWithMainJob != null ? isConcurrentWithMainJob : Boolean.FALSE);
        structured.put("monthlyRevenue", monthlyRevenue);
        structured.put("failureReasons", failureReasons);
        structured.put("difficulties", difficulties);
        structured.put("difficultyEtc", difficultyEtc);
        structured.put("difficultyExtra", difficultyExtra);
        structured.put("targetMarket", targetMarket);
        structured.put("wouldRetry", wouldRetry != null ? wouldRetry : Boolean.FALSE);
        return structured;
    }

    String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new BadRequestException("Failed to serialize JSON payload.");
        }
    }

    boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
