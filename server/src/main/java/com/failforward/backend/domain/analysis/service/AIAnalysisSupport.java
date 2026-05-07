package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.common.api.AiServerException;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisResponse;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
class AIAnalysisSupport {

    private final ObjectMapper objectMapper;

    AIAnalysisSupport(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    String writeJson(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (Exception exception) {
            throw new AiServerException("Failed to serialize AI analysis payload.", exception);
        }
    }

    String buildAdviceJson(AiAnalysisResponse response) {
        if (response == null) {
            return "[]";
        }

        List<String> advice = List.of(
                response.summary() == null ? "" : response.summary().trim()
        ).stream()
                .filter(item -> !item.isBlank())
                .toList();

        return writeJson(advice);
    }

    BigDecimal toRiskScore(String riskLevel) {
        if (riskLevel == null) {
            return null;
        }
        return switch (riskLevel.toLowerCase()) {
            case "high" -> BigDecimal.valueOf(0.9);
            case "medium" -> BigDecimal.valueOf(0.6);
            case "low" -> BigDecimal.valueOf(0.3);
            default -> null;
        };
    }

    int defaultMatchRate(String riskLevel) {
        if (riskLevel == null) {
            return 70;
        }
        return switch (riskLevel.toLowerCase()) {
            case "high" -> 80;
            case "medium" -> 70;
            case "low" -> 60;
            default -> 70;
        };
    }

    String normalizeRiskLevel(String riskLevel) {
        return truncate(riskLevel, 20);
    }

    String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    MatchedCase createDefaultMatchedCase(AiAnalysis analysis, FailureExperience experience, AiAnalysisResponse response) {
        return MatchedCase.create(
                analysis,
                "CASE-" + experience.getId(),
                truncate(experience.getBusinessType() + " similar case", 200),
                experience.getLessonsLearned(),
                response.summary(),
                defaultMatchRate(response.riskLevel())
        );
    }

    Map<String, Object> buildAiLogFields(
            Long experienceId,
            Long analysisId,
            Integer externalApiStatus,
            String detail
    ) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("requestPath", "/api/experiences/" + experienceId + "/analysis");
        fields.put("method", "POST");
        fields.put("userId", null);
        fields.put("experienceId", experienceId);
        fields.put("status", null);
        fields.put("errorCode", null);
        fields.put("externalApiStatus", externalApiStatus);
        fields.put("elapsedTimeMs", null);
        fields.put("traceId", org.slf4j.MDC.get("traceId"));
        fields.put("timestamp", OffsetDateTime.now().toString());
        fields.put("analysisId", analysisId);
        fields.put("detail", detail);
        return fields;
    }
}
