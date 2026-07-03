package com.failforward.backend.domain.experience.service;

import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
class ExperienceComparisonSupport {

    SimilarityDetails calculateSimilarity(FailureExperience target, FailureExperience candidate) {
        double score = 0.4;
        List<String> matching = new ArrayList<>();
        List<String> differences = new ArrayList<>();

        if (target.getBusinessType().equals(candidate.getBusinessType())) {
            score += 0.3;
            matching.add("Same business type");
        } else {
            differences.add("Business type differs");
        }

        if (target.getFailureReason().equals(candidate.getFailureReason())) {
            score += 0.2;
            matching.add("Same failure reason");
        } else {
            differences.add("Failure reason differs");
        }

        if (target.getInvestmentAmount() != null && candidate.getInvestmentAmount() != null) {
            long gap = Math.abs(target.getInvestmentAmount() - candidate.getInvestmentAmount());
            if (gap <= 500000) {
                score += 0.1;
                matching.add("Similar investment amount");
            } else {
                differences.add("Investment amount differs");
            }
        }

        return new SimilarityDetails(Math.min(score, 0.99), matching, differences);
    }

    List<String> buildCommonPatterns(List<FailureExperience> experiences) {
        return experiences.stream()
                .map(FailureExperience::getFailureReason)
                .filter(reason -> reason != null && !reason.isBlank())
                .distinct()
                .limit(3)
                .map(reason -> "Shared failure reason: " + reason)
                .toList();
    }

    List<String> buildDifferences(List<FailureExperience> experiences) {
        return experiences.stream()
                .map(FailureExperience::getBusinessType)
                .filter(type -> type != null && !type.isBlank())
                .distinct()
                .limit(3)
                .map(type -> "Different business type: " + type)
                .toList();
    }

    record SimilarityDetails(double score, List<String> matching, List<String> differences) {
    }
}
