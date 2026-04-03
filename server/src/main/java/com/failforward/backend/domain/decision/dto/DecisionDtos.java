package com.failforward.backend.domain.decision.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

public final class DecisionDtos {

    private DecisionDtos() {
    }

    public record DecisionRequest(
            List<Long> viewedExperiences,
            List<Long> comparedExperiences,
            @NotBlank String decisionType,
            String decisionReason,
            @Min(1) @Max(10) Integer confidenceLevel,
            @Min(1) Integer timeSpentMinutes
    ) {
    }

    public record DecisionResponse(
            Long id,
            Long userId,
            List<Long> viewedExperiences,
            List<Long> comparedExperiences,
            String decisionType,
            String decisionReason,
            Integer confidenceLevel,
            Integer timeSpentMinutes,
            LocalDateTime completedAt
    ) {
    }
}
