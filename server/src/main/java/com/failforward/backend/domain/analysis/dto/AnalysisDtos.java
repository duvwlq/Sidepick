package com.failforward.backend.domain.analysis.dto;

import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public final class AnalysisDtos {

    private AnalysisDtos() {
    }

    public record PatternAnalysisResponse(
            Long id,
            Long experienceId,
            List<String> extractedPatterns,
            List<String> riskFactors,
            List<String> successFactors,
            String structuredSummary,
            BigDecimal confidenceScore,
            LocalDateTime processedAt
    ) {
        public static PatternAnalysisResponse from(AiAnalysis analysis) {
            List<String> tags = parseJsonList(analysis.getFailReasonTags());
            List<String> summaries = parseJsonList(analysis.getSummaryList());
            return new PatternAnalysisResponse(
                    analysis.getId(),
                    analysis.getExperience().getId(),
                    tags,
                    tags.stream().map(tag -> "위험 요인: " + tag).toList(),
                    List.of("재도전 의지 확인 필요", "배운 점 기반 재시도 가능"),
                    summaries.isEmpty() ? analysis.getRiskFactorAnalysis() : String.join(" / ", summaries),
                    analysis.getRiskScore(),
                    analysis.getProcessedAt()
            );
        }
    }

    public record MatchedCaseResponse(
            Long id,
            String caseId,
            String caseTitle,
            String caseSummary,
            String keyLesson,
            Integer matchRate,
            LocalDateTime createdAt
    ) {
        public static MatchedCaseResponse from(MatchedCase matchedCase) {
            return new MatchedCaseResponse(
                    matchedCase.getId(),
                    matchedCase.getCaseId(),
                    matchedCase.getCaseTitle(),
                    matchedCase.getCaseSummary(),
                    matchedCase.getKeyLesson(),
                    matchedCase.getMatchRate(),
                    matchedCase.getCreatedAt()
            );
        }
    }

    private static List<String> parseJsonList(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }
        String normalized = value.replace("[", "").replace("]", "").replace("\"", "");
        if (normalized.isBlank()) {
            return Collections.emptyList();
        }
        return List.of(normalized.split(","))
                .stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();
    }
}
