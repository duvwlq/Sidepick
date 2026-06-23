package com.failforward.backend.domain.analysis.dto;

import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.fasterxml.jackson.annotation.JsonInclude;
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

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AnalysisExplanation(
            InputUsed inputUsed,
            List<String> matchedPatterns,
            List<String> similarCasesUsed,
            boolean isVerified,
            BigDecimal confidenceScore,
            DebugInfo debug
    ) {
    }

    public record InputUsed(
            String category,
            String bodyExcerpt
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DebugInfo(
            Integer totalSimilarCases,
            String source
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SimilarCaseExplanation(
            BigDecimal similarityScore,
            List<String> matchedKeywords,
            Boolean categoryMatch,
            String source,
            String caseId,
            DebugInfo debug
    ) {
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
            LocalDateTime processedAt,
            AnalysisExplanation explanation
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
                    analysis.getProcessedAt(),
                    buildAnalysisExplanation(analysis, List.of())
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
            LocalDateTime createdAt,
            SimilarCaseExplanation explanation
    ) {
        public static MatchedCaseResponse from(MatchedCase matchedCase) {
            return from(matchedCase, List.of());
        }

        public static MatchedCaseResponse from(MatchedCase matchedCase, List<String> matchedKeywords) {
            return new MatchedCaseResponse(
                    matchedCase.getId(),
                    matchedCase.getCaseId(),
                    matchedCase.getCaseTitle(),
                    matchedCase.getCaseSummary(),
                    matchedCase.getKeyLesson(),
                    matchedCase.getMatchRate(),
                    matchedCase.getCreatedAt(),
                    buildSimilarCaseExplanation(matchedCase, matchedKeywords)
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
            List<ReportSimilarCaseResponse> similarCases,
            AnalysisExplanation explanation
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
                            .map(matchedCase -> ReportSimilarCaseResponse.from(matchedCase, response.keywords()))
                            .toList(),
                    buildAnalysisExplanation(analysis, similarCases)
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
                    List.of(),
                    null
            );
        }
    }

    public record ReportSimilarCaseResponse(
            String caseId,
            String title,
            String summary,
            String keyLesson,
            Integer matchRate,
            SimilarCaseExplanation explanation
    ) {
        public static ReportSimilarCaseResponse from(MatchedCase matchedCase) {
            return from(matchedCase, List.of());
        }

        public static ReportSimilarCaseResponse from(MatchedCase matchedCase, List<String> matchedKeywords) {
            return new ReportSimilarCaseResponse(
                    matchedCase.getCaseId(),
                    matchedCase.getCaseTitle(),
                    matchedCase.getCaseSummary(),
                    matchedCase.getKeyLesson(),
                    matchedCase.getMatchRate(),
                    buildSimilarCaseExplanation(matchedCase, matchedKeywords)
            );
        }
    }

    private static AnalysisExplanation buildAnalysisExplanation(AiAnalysis analysis, List<MatchedCase> similarCases) {
        FailureExperience experience = analysis.getExperience();
        List<String> extractedPatterns = parseJsonList(analysis.getFailReasonTags());
        String category = experience.getCategory() == null ? null : experience.getCategory().getName();
        String bodyExcerpt = abbreviate(experience.getContent(), 140);
        String source = similarCases.stream().map(MatchedCase::getCaseId).anyMatch(AnalysisDtos::isAiSimilarCaseId)
                ? "ai-similar-search"
                : "server-generated";

        return new AnalysisExplanation(
                new InputUsed(category, bodyExcerpt),
                extractedPatterns,
                similarCases.stream().map(MatchedCase::getCaseId).toList(),
                true,
                analysis.getRiskScore(),
                new DebugInfo(similarCases.size(), source)
        );
    }

    private static SimilarCaseExplanation buildSimilarCaseExplanation(
            MatchedCase matchedCase,
            List<String> matchedKeywords
    ) {
        BigDecimal similarityScore = matchedCase.getMatchRate() == null
                ? null
                : BigDecimal.valueOf(matchedCase.getMatchRate() / 100.0d);
        String source = isAiSimilarCaseId(matchedCase.getCaseId()) ? "ai-similar-search" : "matched-case";
        String debugSource = isAiSimilarCaseId(matchedCase.getCaseId()) ? "ai-similar-search" : "server-generated";
        return new SimilarCaseExplanation(
                similarityScore,
                matchedKeywords.stream().filter(keyword -> keyword != null && !keyword.isBlank()).distinct().limit(3).toList(),
                null,
                source,
                matchedCase.getCaseId(),
                new DebugInfo(null, debugSource)
        );
    }

    private static boolean isAiSimilarCaseId(String caseId) {
        if (caseId == null || caseId.isBlank()) {
            return false;
        }
        return caseId.startsWith("pickply_") || caseId.startsWith("blog_");
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

    private static String abbreviate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return value;
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }
}
