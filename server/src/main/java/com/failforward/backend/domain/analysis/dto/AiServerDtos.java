package com.failforward.backend.domain.analysis.dto;

import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class AiServerDtos {

    private AiServerDtos() {
    }

    public record AiAnalysisRequest(
            String category,
            List<String> difficulties,
            @JsonProperty("difficulty_etc")
            String difficultyEtc,
            @JsonProperty("difficulty_extra")
            String difficultyExtra,
            @JsonProperty("duration_months")
            Integer durationMonths,
            @JsonProperty("weekly_hours")
            Integer weeklyHours,
            @JsonProperty("free_text")
            String freeText
    ) {
        public static AiAnalysisRequest from(FailureExperience experience) {
            Map<String, Object> structuredData = ExperienceDtos.parseObject(experience.getStructuredData());
            Integer durationMonths = experience.getDurationMonths() != null
                    ? experience.getDurationMonths()
                    : 1;
            Integer weeklyHours = experience.getWeeklyHours() != null
                    ? experience.getWeeklyHours()
                    : 1;
            return new AiAnalysisRequest(
                    experience.getCategory().getName(),
                    ExperienceDtos.parseStringList(experience.getDifficulties()),
                    readStructuredString(structuredData, "difficultyEtc", experience.getDifficultyEtc()),
                    readStructuredString(structuredData, "difficultyExtra", experience.getDifficultyExtra()),
                    durationMonths,
                    weeklyHours,
                    experience.getContent()
            );
        }

        private static String readStructuredString(
                Map<String, Object> structuredData,
                String key,
                String fallback
        ) {
            Object value = structuredData.get(key);
            if (value instanceof String text && !text.isBlank()) {
                return text;
            }
            return fallback == null ? "" : fallback;
        }
    }

    public record AiAnalysisResponse(
            List<String> keywords,
            @JsonProperty("failure_category")
            String failureCategory,
            String summary,
            @JsonProperty("risk_level")
            String riskLevel
    ) {
    }
}
