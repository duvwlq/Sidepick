package com.failforward.backend.domain.stats.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "app.stats.minimum-sufficient-sample=3")
class StatsApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void failurePatternReturnsAggregatedPayloadForCategory() throws Exception {
        String token = registerAndLogin("stats-pattern@test.com", "Password123!", "stats-pattern", "30s");
        createExperience(token, 1L, 2, List.of("marketing"));
        createExperience(token, 1L, 3, List.of("marketing"));
        createExperience(token, 1L, 5, List.of("marketing", "time-management"));

        mockMvc.perform(get("/api/stats/failure-patterns")
                        .param("category", "online-commerce"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.category").value("online-commerce"))
                .andExpect(jsonPath("$.data.labelKo").isNotEmpty())
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.sufficientData").value(true))
                .andExpect(jsonPath("$.data.summary").value(Matchers.containsString("marketing")))
                .andExpect(jsonPath("$.data.explanation.chartType").value("pattern_ratio"))
                .andExpect(jsonPath("$.data.explanation.totalCases").value(3))
                .andExpect(jsonPath("$.data.explanation.dataSource").value("database"))
                .andExpect(jsonPath("$.data.explanation.lastUpdated").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.minSampleSize").value(3))
                .andExpect(jsonPath("$.data.patterns[0].label").value("marketing"))
                .andExpect(jsonPath("$.data.patterns[0].count").value(3))
                .andExpect(jsonPath("$.data.patterns[0].percent").value(100.0))
                .andExpect(jsonPath("$.data.patterns[1].label").value("time-management"))
                .andExpect(jsonPath("$.data.patterns[1].count").value(1));
    }

    @Test
    void failurePatternReturnsInsufficientMessageForLowSampleCategory() throws Exception {
        String token = registerAndLogin("stats-low@test.com", "Password123!", "stats-low", "30s");
        createExperience(token, 3L, 2, List.of("insufficient-sample"));

        mockMvc.perform(get("/api/stats/failure-pattern")
                        .param("category", "digital-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.sufficientData").value(false))
                .andExpect(jsonPath("$.data.summary").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.sufficientData").value(false))
                .andExpect(jsonPath("$.data.explanation.minSampleSize").value(3))
                .andExpect(jsonPath("$.data.explanation.insufficientMessage").isNotEmpty());
    }

    @Test
    void failureTimingReturnsAggregatedDistributionFromDatabase() throws Exception {
        String token = registerAndLogin("stats-timing@test.com", "Password123!", "stats-timing", "30s");
        createExperience(token, 2L, 0, List.of("execution"));
        createExperience(token, 2L, 0, List.of("execution"));
        createExperience(token, 2L, 7, List.of("time-management"));

        mockMvc.perform(get("/api/stats/failure-timing")
                        .param("category", "content-sns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("content-sns"))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.sufficientData").value(true))
                .andExpect(jsonPath("$.data.summary").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.chartType").value("timing_distribution"))
                .andExpect(jsonPath("$.data.explanation.dataSource").value("database"))
                .andExpect(jsonPath("$.data.explanation.lastUpdated").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.minSampleSize").value(3))
                .andExpect(jsonPath("$.data.peakBucket").value("under-1m"))
                .andExpect(jsonPath("$.data.distribution.length()").value(5))
                .andExpect(jsonPath("$.data.distribution[0].bucket").value("under-1m"))
                .andExpect(jsonPath("$.data.distribution[0].count").value(2))
                .andExpect(jsonPath("$.data.distribution[0].percent").value(66.7))
                .andExpect(jsonPath("$.data.distribution[3].bucket").value("6-12m"))
                .andExpect(jsonPath("$.data.distribution[3].count").value(1));
    }

    @Test
    void statsEndpointsRejectMissingCategory() throws Exception {
        mockMvc.perform(get("/api/stats/failure-pattern"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void statsEndpointsRejectUnsupportedCategory() throws Exception {
        mockMvc.perform(get("/api/stats/failure-timing")
                        .param("category", "unknown-slug"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void statsRootReturnsNotFoundInsteadOfInternalServerError() throws Exception {
        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    private void createExperience(
            String token,
            Long categoryId,
            int durationMonths,
            List<String> difficulties
    ) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", "stats-case-" + categoryId + "-" + durationMonths + "-" + difficulties.get(0));
        payload.put("content", "Stats aggregation verification body.");
        payload.put("categoryId", categoryId);
        payload.put("businessType", "stats-business");
        payload.put("investmentAmount", 100000);
        payload.put("durationMonths", durationMonths);
        payload.put("weeklyHours", 10);
        payload.put("averageDailyHours", "ONE_TO_THREE_HOURS");
        payload.put("isConcurrentWithMainJob", true);
        payload.put("monthlyRevenue", 50000);
        payload.put("failureReason", difficulties.get(0));
        payload.put("failureReasons", difficulties);
        payload.put("difficulties", difficulties);
        payload.put("difficultyEtc", "");
        payload.put("difficultyExtra", "");
        payload.put("targetMarket", "test-market");
        payload.put("marketingChannels", List.of("blog"));
        payload.put("lessonsLearned", "test-lesson");
        payload.put("wouldRetry", false);

        mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated());
    }
}
