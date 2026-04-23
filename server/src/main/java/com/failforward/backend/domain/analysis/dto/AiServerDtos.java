package com.failforward.backend.domain.analysis.dto;

import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.math.BigDecimal;
import java.util.List;

public final class AiServerDtos {

    private AiServerDtos() {
    }

    public record AiAnalysisRequest(
            Long experienceId,
            Long categoryId,
            String categoryName,
            String title,
            String content,
            String businessType,
            Integer investmentAmount,
            Integer durationMonths,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Integer monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry
    ) {
        public static AiAnalysisRequest from(FailureExperience experience) {
            return new AiAnalysisRequest(
                    experience.getId(),
                    experience.getCategory().getId(),
                    experience.getCategory().getName(),
                    experience.getTitle(),
                    experience.getContent(),
                    experience.getBusinessType(),
                    experience.getInvestmentAmount(),
                    experience.getDurationMonths(),
                    experience.getAverageDailyHours(),
                    experience.getIsConcurrentWithMainJob(),
                    experience.getMonthlyRevenue(),
                    experience.getFailureReason(),
                    ExperienceDtos.parseStringList(experience.getFailureReasons()),
                    ExperienceDtos.parseStringList(experience.getDifficulties()),
                    experience.getTargetMarket(),
                    ExperienceDtos.parseStringList(experience.getMarketingChannels()),
                    experience.getLessonsLearned(),
                    experience.getWouldRetry()
            );
        }
    }

    public record AiAnalysisResponse(
            Long id,
            Long experienceId,
            List<String> extractedPatterns,
            List<String> riskFactors,
            List<String> successFactors,
            String structuredSummary,
            BigDecimal confidenceScore,
            String processedAt
    ) {
    }
}
