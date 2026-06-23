package com.failforward.backend.domain.decision.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DecisionApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void createDecisionWithoutAuthReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/decisions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "viewedExperiences": [1, 2],
                                  "comparedExperiences": [2],
                                  "decisionType": "retry",
                                  "decisionReason": "Need one more attempt",
                                  "confidenceLevel": 7,
                                  "timeSpentMinutes": 20
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void createDecisionWithAuthReturnsRecordedDecision() throws Exception {
        String token = registerAndLogin("decision_test@sidepick.dev", "password123", "decisionUser", "20s");

        mockMvc.perform(post("/api/decisions")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "viewedExperiences": [1, 2, 3],
                                  "comparedExperiences": [2, 3],
                                  "decisionType": "retry",
                                  "decisionReason": "Retry after validation",
                                  "confidenceLevel": 7,
                                  "timeSpentMinutes": 20
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.decisionType").value("retry"))
                .andExpect(jsonPath("$.data.confidenceLevel").value(7))
                .andExpect(jsonPath("$.data.timeSpentMinutes").value(20));
    }
}
