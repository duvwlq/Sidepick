package com.failforward.backend.domain.guide.service;

import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.guide.dto.GuideDtos.ExperienceGuideResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GuideService {

    private static final String DEFAULT_CATEGORY_KEY = "freelance";
    private static final String DEFAULT_DIFFICULTY_KEY = "information_lack";
    private static final String DEFAULT_GUIDE_KEY = DEFAULT_CATEGORY_KEY + "__" + DEFAULT_DIFFICULTY_KEY;

    private static final Map<String, List<String>> DIFFICULTY_ALIASES = Map.of(
            "customer_acquisition", List.of("고객확보", "마케팅", "홍보", "타겟고객", "고객유입", "유입", "customer", "acquisition", "promotion", "marketinglack"),
            "revenue_structure", List.of("수익구조", "마진", "수수료", "자금부족", "revenue", "profit", "margin", "pricing"),
            "time_management", List.of("시간관리", "시간부족", "일정", "time", "schedule", "executionoverload"),
            "monetization", List.of("수익화", "매출", "monetization"),
            "sustainability", List.of("운영지속성", "지속", "번아웃", "운영", "sustain", "operation", "operations"),
            "information_lack", List.of("정보부족", "시장조사", "검증부족", "타겟분석실패", "validation", "research", "information", "marketvalidationgap", "targetanalysisfailure"),
            "competition", List.of("경쟁", "포화", "경쟁심화", "경쟁분석부족", "competition", "competitionanalysisfailure")
    );

    private final FailureExperienceRepository experienceRepository;
    private final ObjectMapper objectMapper;

    private Map<String, List<String>> guideIndex = Map.of();

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

    public ExperienceGuideResponse getExperienceGuide(Long experienceId) {
        FailureExperience experience = experienceRepository.findWithUserAndCategoryById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));

        String categoryKey = mapCategoryKey(experience);
        String difficultyKey = mapDifficultyKey(experience, null, null);
        String guideKey = categoryKey + "__" + difficultyKey;
        List<String> guideLines = guideIndex.get(guideKey);
        if (guideLines == null || guideLines.isEmpty()) {
            guideLines = guideIndex.getOrDefault(DEFAULT_GUIDE_KEY, List.of());
        }

        Long categoryId = experience.getCategory() == null ? null : experience.getCategory().getId();
        return new ExperienceGuideResponse(experienceId, categoryId, categoryKey, difficultyKey, guideLines);
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
                .map(part -> part.replaceFirst("^[123]\\.\\s*", ""))
                .map(part -> part.replace("\n", " ").trim())
                .filter(part -> !part.isBlank())
                .limit(3)
                .toList();
    }
}
