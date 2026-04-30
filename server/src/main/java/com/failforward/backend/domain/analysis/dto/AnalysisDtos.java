package com.failforward.backend.domain.analysis.dto;

import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public final class AnalysisDtos {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private AnalysisDtos() {
    }

    public record PatternAnalysisResponse(
            Long id,
            Long experienceId,
            List<String> extractedPatterns,
            List<String> keywords,
            String failureCategory,
            String riskLevel,
            List<String> riskFactors,
            List<String> successFactors,
            String structuredSummary,
            BigDecimal confidenceScore,
            LocalDateTime processedAt
    ) {
        public static PatternAnalysisResponse from(AiAnalysis analysis) {
            List<String> extractedPatterns = parseJsonList(analysis.getFailReasonTags());
            List<String> riskFactors = parseJsonList(analysis.getRiskFactorAnalysis());
            List<String> successFactors = parseJsonList(analysis.getSummaryList());
            return new PatternAnalysisResponse(
                    analysis.getId(),
                    analysis.getExperience().getId(),
                    extractedPatterns,
                    extractedPatterns,
                    analysis.getFailureCategory(),
                    analysis.getRiskLevel(),
                    riskFactors,
                    successFactors,
                    analysis.getStructuredSummary(),
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

    public record AnalysisReportResponse(
            Long experienceId,
            Long analysisId,
            String reportStatus,
            String title,
            String summary,
            List<String> extractedPatterns,
            List<String> keywords,
            String failureCategory,
            String riskLevel,
            List<String> riskFactors,
            List<String> advice,
            BigDecimal confidenceScore,
            LocalDateTime processedAt,
            List<ReportSimilarCaseResponse> similarCases
    ) {
        public static AnalysisReportResponse from(
                FailureExperience experience,
                AiAnalysis analysis,
                List<MatchedCase> similarCases
        ) {
            PatternAnalysisResponse response = PatternAnalysisResponse.from(analysis);
            return new AnalysisReportResponse(
                    experience.getId(),
                    analysis.getId(),
                    "READY",
                    experience.getTitle(),
                    response.structuredSummary(),
                    response.extractedPatterns(),
                    response.keywords(),
                    response.failureCategory(),
                    response.riskLevel(),
                    response.riskFactors(),
                    response.successFactors().isEmpty()
                            ? (response.structuredSummary() == null || response.structuredSummary().isBlank()
                                    ? List.of()
                                    : List.of(response.structuredSummary()))
                            : response.successFactors(),
                    response.confidenceScore(),
                    response.processedAt(),
                    similarCases.stream()
                            .map(ReportSimilarCaseResponse::from)
                            .toList()
            );
        }

        public static AnalysisReportResponse notReady(FailureExperience experience) {
            return new AnalysisReportResponse(
                    experience.getId(),
                    null,
                    "NOT_READY",
                    experience.getTitle(),
                    null,
                    List.of(),
                    List.of(),
                    null,
                    null,
                    List.of(),
                    List.of(),
                    null,
                    null,
                    List.of()
            );
        }
    }

    public record ReportSimilarCaseResponse(
            String caseId,
            String title,
            String summary,
            String keyLesson,
            Integer matchRate
    ) {
        public static ReportSimilarCaseResponse from(MatchedCase matchedCase) {
            return new ReportSimilarCaseResponse(
                    matchedCase.getCaseId(),
                    matchedCase.getCaseTitle(),
                    matchedCase.getCaseSummary(),
                    matchedCase.getKeyLesson(),
                    matchedCase.getMatchRate()
            );
        }
    }

    private static List<String> parseJsonList(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(value, new TypeReference<>() {});
        } catch (Exception ignored) {
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
