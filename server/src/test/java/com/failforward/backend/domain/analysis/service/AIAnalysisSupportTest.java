package com.failforward.backend.domain.analysis.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisResponse;
import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.entity.BusinessCategoryType;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.user.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

class AIAnalysisSupportTest {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void buildsRevenueStructureAdviceFromTemplate() throws Exception {
        AIAnalysisSupport support = new AIAnalysisSupport(objectMapper);
        support.loadGuideTemplates();

        FailureExperience experience = createExperience(
                1L,
                "[\"\uC218\uC775 \uAD6C\uC870 \uC774\uD574\"]",
                "\uC2DC\uC7A5 \uC870\uC0AC \uBD80\uC871"
        );
        AiAnalysisResponse response = new AiAnalysisResponse(
                List.of("\uB9C8\uC9C4"),
                "market_validation_gap",
                "summary",
                "high"
        );

        List<String> advice = objectMapper.readValue(support.buildAdviceJson(experience, response), STRING_LIST_TYPE);

        assertThat(advice).containsExactlyElementsOf(loadGuide("online_sales__revenue_structure"));
    }

    @Test
    void fallsBackToAiFailureCategoryWhenDifficultyIsMissing() throws Exception {
        AIAnalysisSupport support = new AIAnalysisSupport(objectMapper);
        support.loadGuideTemplates();

        FailureExperience experience = createExperience(1L, "[]", "");

        List<String> advice = objectMapper.readValue(
                support.buildStoredAdviceJson(experience, "\uD0C0\uAC9F\uBD84\uC11D\uC2E4\uD328", "summary"),
                STRING_LIST_TYPE
        );

        assertThat(advice).containsExactlyElementsOf(loadGuide("online_sales__information_lack"));
    }

    @Test
    void buildsTimeManagementAdviceFromTemplate() throws Exception {
        AIAnalysisSupport support = new AIAnalysisSupport(objectMapper);
        support.loadGuideTemplates();

        FailureExperience experience = createExperience(
                1L,
                "[\"\uC2DC\uAC04 \uAD00\uB9AC\"]",
                "\uC2DC\uAC04 \uBD80\uC871"
        );
        AiAnalysisResponse response = new AiAnalysisResponse(
                List.of("\uC2DC\uAC04"),
                "time_management",
                "summary",
                "medium"
        );

        List<String> advice = objectMapper.readValue(support.buildAdviceJson(experience, response), STRING_LIST_TYPE);

        assertThat(advice).containsExactlyElementsOf(loadGuide("online_sales__time_management"));
    }

    private List<String> loadGuide(String guideKey) throws Exception {
        Path directPath = Path.of("import-data", "matching_table.json").toAbsolutePath().normalize();
        Path fallbackPath = Path.of("server", "import-data", "matching_table.json").toAbsolutePath().normalize();
        Path matchingTablePath = Files.exists(directPath) ? directPath : fallbackPath;
        try (var inputStream = Files.newInputStream(matchingTablePath)) {
            JsonNode root = objectMapper.readTree(inputStream);
            String guide = root.path("guides").path(guideKey).path("guide").asText();
            return guide.lines()
                    .map(String::trim)
                    .filter(line -> line.matches("^[123]\\..+"))
                    .map(line -> line.replaceFirst("^[123]\\.\\s*", ""))
                    .toList();
        }
    }

    private FailureExperience createExperience(Long categoryId, String difficulties, String failureReason) {
        User user = User.create("guide-test@sidepick.local", "password", "guide-test", "30s");
        BusinessCategory category = BusinessCategory.create(
                categoryId,
                "\uD14C\uC2A4\uD2B8 \uCE74\uD14C\uACE0\uB9AC",
                "description",
                "icon",
                "#000000",
                BusinessCategoryType.business_field
        );

        return FailureExperience.create(
                user,
                category,
                "title",
                "content",
                "business",
                1000L,
                3,
                10,
                "ONE_TO_THREE_HOURS",
                true,
                100L,
                failureReason,
                "[]",
                difficulties,
                "",
                "",
                null,
                "[]",
                "lesson",
                false,
                "{}",
                "FAILURE"
        );
    }
}
