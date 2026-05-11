package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.common.api.AiServerException;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisResponse;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
class AIAnalysisSupport {

    private static final String DEFAULT_CATEGORY_KEY = "freelance";
    private static final String DEFAULT_DIFFICULTY_KEY = "information_lack";
    private static final String DEFAULT_GUIDE_KEY = DEFAULT_CATEGORY_KEY + "__" + DEFAULT_DIFFICULTY_KEY;

    private static final Map<String, List<String>> DIFFICULTY_ALIASES = Map.of(
            "customer_acquisition", List.of(
                    "\uACE0\uAC1D\uD655\uBCF4",
                    "\uB9C8\uCF00\uD305",
                    "\uD64D\uBCF4",
                    "\uD0C0\uAC9F\uACE0\uAC1D",
                    "\uACE0\uAC1D\uC720\uC785",
                    "\uC720\uC785",
                    "customer",
                    "acquisition",
                    "promotion",
                    "marketinglack"
            ),
            "revenue_structure", List.of(
                    "\uC218\uC775\uAD6C\uC870",
                    "\uB9C8\uC9C4",
                    "\uC218\uC218\uB8CC",
                    "\uC790\uAE08\uBD80\uC871",
                    "revenue",
                    "profit",
                    "margin",
                    "pricing"
            ),
            "time_management", List.of(
                    "\uC2DC\uAC04\uAD00\uB9AC",
                    "\uC2DC\uAC04\uBD80\uC871",
                    "\uC77C\uC815",
                    "time",
                    "schedule",
                    "executionoverload"
            ),
            "monetization", List.of(
                    "\uC218\uC775\uD654",
                    "\uB9E4\uCD9C",
                    "monetization"
            ),
            "sustainability", List.of(
                    "\uC6B4\uC601\uC9C0\uC18D\uC131",
                    "\uC9C0\uC18D",
                    "\uBC88\uC544\uC6C3",
                    "\uC6B4\uC601",
                    "sustain",
                    "operation",
                    "operations"
            ),
            "information_lack", List.of(
                    "\uC815\uBCF4\uBD80\uC871",
                    "\uC2DC\uC7A5\uC870\uC0AC",
                    "\uAC80\uC99D\uBD80\uC871",
                    "\uD0C0\uAC9F\uBD84\uC11D\uC2E4\uD328",
                    "validation",
                    "research",
                    "information",
                    "marketvalidationgap",
                    "targetanalysisfailure"
            ),
            "competition", List.of(
                    "\uACBD\uC7C1",
                    "\uD3EC\uD654",
                    "\uACBD\uC7C1\uC2EC\uD654",
                    "\uACBD\uC7C1\uBD84\uC11D\uBD80\uC871",
                    "competition",
                    "competitionanalysisfailure"
            )
    );

    private final ObjectMapper objectMapper;
    private Map<String, List<String>> guideIndex = Map.of();

    AIAnalysisSupport(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void loadGuideTemplates() {
        List<Path> candidates = List.of(
                Path.of("/app", "import-data", "matching_table.json"),
                Path.of("import-data", "matching_table.json").toAbsolutePath().normalize(),
                Path.of("server", "import-data", "matching_table.json").toAbsolutePath().normalize()
        );
        Path matchingTablePath = candidates.stream()
                .filter(Files::exists)
                .findFirst()
                .orElse(candidates.get(candidates.size() - 1));

        try (InputStream inputStream = Files.newInputStream(matchingTablePath)) {
            JsonNode root = objectMapper.readTree(inputStream);
            JsonNode guidesNode = root.path("guides");
            if (!guidesNode.isObject()) {
                throw new IllegalStateException("matching_table.json has no guides object: " + matchingTablePath);
            }

            Map<String, List<String>> guides = new HashMap<>();
            guidesNode.fields().forEachRemaining(entry -> {
                List<String> actions = extractGuideActions(entry.getValue().path("guide").asText(""));
                if (actions.size() == 3) {
                    guides.put(entry.getKey(), actions);
                }
            });
            guideIndex = Map.copyOf(guides);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load matching_table.json", exception);
        }
    }

    String writeJson(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (Exception exception) {
            throw new AiServerException("Failed to serialize AI analysis payload.", exception);
        }
    }

    String buildAdviceJson(FailureExperience experience, AiAnalysisResponse response) {
        if (response == null) {
            return "[]";
        }

        return buildStoredAdviceJson(
                experience,
                response.failureCategory(),
                response.summary()
        );
    }

    String buildStoredAdviceJson(FailureExperience experience, String failureCategory, String summary) {
        List<String> advice = resolveGuideActions(experience, failureCategory, summary);
        if (advice.isEmpty()) {
            advice = List.of(summary == null ? "" : summary.trim()).stream()
                    .filter(item -> !item.isBlank())
                    .toList();
        }
        return writeJson(advice);
    }

    private List<String> resolveGuideActions(FailureExperience experience, String failureCategory, String summary) {
        String guideKey = mapCategoryKey(experience) + "__" + mapDifficultyKey(experience, failureCategory, summary);
        List<String> guide = guideIndex.get(guideKey);
        if (guide != null && !guide.isEmpty()) {
            return guide;
        }
        return guideIndex.getOrDefault(DEFAULT_GUIDE_KEY, List.of());
    }

    private String mapCategoryKey(FailureExperience experience) {
        Long categoryId = experience.getCategory() == null ? null : experience.getCategory().getId();
        if (categoryId == null) {
            return DEFAULT_CATEGORY_KEY;
        }
        return switch (categoryId.intValue()) {
            case 1 -> "online_sales";
            case 2 -> "content_sns";
            case 3 -> "digital_products";
            case 4 -> "platform_work";
            case 5 -> "freelance";
            case 6 -> "investment";
            case 7 -> "offline_work";
            default -> DEFAULT_CATEGORY_KEY;
        };
    }

    private String mapDifficultyKey(FailureExperience experience, String failureCategory, String summary) {
        List<String> difficulties = ExperienceDtos.parseStringList(experience.getDifficulties());
        for (String difficulty : difficulties) {
            String mapped = mapDifficultyLabel(difficulty);
            if (mapped != null) {
                return mapped;
            }
        }

        String mappedFailureReason = mapDifficultyLabel(experience.getFailureReason());
        if (mappedFailureReason != null) {
            return mappedFailureReason;
        }

        String mappedAiCategory = mapDifficultyLabel(failureCategory);
        if (mappedAiCategory != null) {
            return mappedAiCategory;
        }

        String mappedSummary = mapDifficultyLabel(summary);
        if (mappedSummary != null) {
            return mappedSummary;
        }

        return DEFAULT_DIFFICULTY_KEY;
    }

    private String mapDifficultyLabel(String raw) {
        String normalized = normalize(raw);
        if (normalized.isBlank()) {
            return null;
        }

        for (Map.Entry<String, List<String>> entry : DIFFICULTY_ALIASES.entrySet()) {
            boolean matched = entry.getValue().stream()
                    .map(this::normalize)
                    .anyMatch(normalized::contains);
            if (matched) {
                return entry.getKey();
            }
        }
        return null;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFKC)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replace(" ", "")
                .replace("_", "")
                .replace("-", "")
                .replace("(", "")
                .replace(")", "")
                .replace("/", "")
                .replace(",", "")
                .replace(".", "");

        return normalized.replaceAll("[^\\p{L}\\p{N}]+", "");
    }

    private List<String> extractGuideActions(String guide) {
        if (guide == null || guide.isBlank()) {
            return List.of();
        }
        return Arrays.stream(guide.replace("\r\n", "\n").split("\n\n"))
                .map(String::trim)
                .filter(part -> part.matches("^[123]\\..+"))
                .map(this::stripGuideNumber)
                .map(part -> part.replace("\n", " ").trim())
                .filter(part -> !part.isBlank())
                .limit(3)
                .toList();
    }

    private String stripGuideNumber(String text) {
        return text.replaceFirst("^[123]\\.\\s*", "");
    }

    BigDecimal toRiskScore(String riskLevel) {
        if (riskLevel == null) {
            return null;
        }
        return switch (riskLevel.toLowerCase(Locale.ROOT)) {
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
        return switch (riskLevel.toLowerCase(Locale.ROOT)) {
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

    List<MatchedCase> createMatchedCasesFromExperiences(
            AiAnalysis analysis,
            FailureExperience sourceExperience,
            List<FailureExperience> candidates,
            AiAnalysisResponse response
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        return candidates.stream()
                .filter(candidate -> candidate.getId() != null)
                .filter(candidate -> !candidate.getId().equals(sourceExperience.getId()))
                .map(candidate -> MatchedCase.create(
                        analysis,
                        String.valueOf(candidate.getId()),
                        truncate(candidate.getTitle(), 200),
                        firstNonBlank(candidate.getLessonsLearned(), candidate.getContent()),
                        firstNonBlank(candidate.getLessonsLearned(), response.summary(), candidate.getContent()),
                        defaultMatchRate(response.riskLevel())
                ))
                .toList();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
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
