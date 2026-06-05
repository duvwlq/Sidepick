package com.failforward.backend.domain.stats.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StatsApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void failurePatternReturnsFixturePayloadForCategory() throws Exception {
        mockMvc.perform(get("/api/stats/failure-patterns")
                        .param("category", "online-commerce"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.category").value("online-commerce"))
                .andExpect(jsonPath("$.data.labelKo").value("온라인 판매·이커머스"))
                .andExpect(jsonPath("$.data.sufficientData").value(true))
                .andExpect(jsonPath("$.data.patterns.length()").value(5))
                .andExpect(jsonPath("$.data.patterns[0].label").value("마케팅 부족"));
    }

    @Test
    void failurePatternReturnsCollectionMessageForLowSampleCategory() throws Exception {
        mockMvc.perform(get("/api/stats/failure-pattern")
                        .param("category", "digital-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sufficientData").value(false));
    }

    @Test
    void failureTimingReturnsDistributionPayload() throws Exception {
        mockMvc.perform(get("/api/stats/failure-timing")
                        .param("category", "content-sns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("content-sns"))
                .andExpect(jsonPath("$.data.peakBucket").value("3-6m"))
                .andExpect(jsonPath("$.data.distribution.length()").value(5));
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
}
