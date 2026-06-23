package com.failforward.backend.domain.experience.api;

import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ExperienceAiIntegrationTest extends ApiIntegrationTestSupport {

    @Autowired
    private RestTemplate aiRestTemplate;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.bindTo(aiRestTemplate).ignoreExpectOrder(true).build();
    }

    @Test
    void createExperienceStoresAiAnalysisAndReturnsAnalysisInDetail() throws Exception {
        String token = registerAndLogin("ai_success@sidepick.dev", "password123", "aiSuccess", "20s");

        mockServer.expect(requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "keywords": ["market research gap", "validation gap"],
                          "failure_category": "market_validation_gap",
                          "summary": "Customer validation and early promotion were both insufficient.",
                          "risk_level": "high"
                        }
                        """, MediaType.APPLICATION_JSON));

        var createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "AI linked experience",
                                  "content": "AI integration should run after experience creation.",
                                  "categoryId": 1,
                                  "businessType": "Online commerce",
                                  "investmentAmount": 3000000,
                                  "durationMonths": 3,
                                  "failureReason": "Lack of market research",
                                  "targetMarket": "Office workers",
                                  "marketingChannels": ["Instagram", "Blog"],
                                  "lessonsLearned": "I should have validated demand faster.",
                                  "wouldRetry": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.analysis").isEmpty())
                .andExpect(jsonPath("$.data.hasPatternAnalysis").value(false))
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysis.structuredSummary")
                        .value("Customer validation and early promotion were both insufficient."))
                .andExpect(jsonPath("$.data.analysis.keywords[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.analysis.failureCategory").value("market_validation_gap"))
                .andExpect(jsonPath("$.data.analysis.riskLevel").value("high"))
                .andExpect(jsonPath("$.data.hasPatternAnalysis").value(true));

        mockServer.verify();
    }

    @Test
    void createExperienceKeepsPostEvenWhenAiServerFails() throws Exception {
        String token = registerAndLogin("ai_fail@sidepick.dev", "password123", "aiFail", "20s");

        mockServer.expect(requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(withServerError());

        var createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "AI failure fallback",
                                  "content": "Experience should still be stored when AI is down.",
                                  "categoryId": 1,
                                  "failureReason": "AI fallback reason"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.analysis").isEmpty())
                .andExpect(jsonPath("$.data.hasPatternAnalysis").value(false))
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysis").isEmpty())
                .andExpect(jsonPath("$.data.hasPatternAnalysis").value(false));

        mockServer.verify();
    }

    @Test
    void updateExperienceRefreshesAiAnalysisAndReturnsLatestAnalysis() throws Exception {
        String token = registerAndLogin("ai_update@sidepick.dev", "password123", "aiUpdate", "20s");

        mockServer.expect(requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "keywords": ["initial pattern"],
                          "failure_category": "operations_gap",
                          "summary": "Initial AI summary",
                          "risk_level": "medium"
                        }
                        """, MediaType.APPLICATION_JSON));

        mockServer.expect(requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "keywords": ["updated pattern"],
                          "failure_category": "time_management",
                          "summary": "Updated AI summary",
                          "risk_level": "low"
                        }
                        """, MediaType.APPLICATION_JSON));

        var createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "AI refresh target",
                                  "content": "Initial experience content.",
                                  "categoryId": 1,
                                  "businessType": "Online store",
                                  "investmentAmount": 1000000,
                                  "durationMonths": 2,
                                  "failureReason": "Initial reason",
                                  "targetMarket": "Students",
                                  "marketingChannels": ["Instagram"],
                                  "lessonsLearned": "Initial lesson",
                                  "wouldRetry": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.analysis").isEmpty())
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(patch("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "AI refresh target updated",
                                  "content": "Updated experience content.",
                                  "categoryId": 1,
                                  "businessType": "Online store",
                                  "investmentAmount": 1200000,
                                  "durationMonths": 4,
                                  "failureReason": "Updated reason",
                                  "targetMarket": "Office workers",
                                  "marketingChannels": ["Blog", "YouTube"],
                                  "lessonsLearned": "Updated lesson",
                                  "wouldRetry": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysis.structuredSummary").value("Updated AI summary"))
                .andExpect(jsonPath("$.data.analysis.failureCategory").value("time_management"))
                .andExpect(jsonPath("$.data.analysis.keywords[0]").value("updated pattern"))
                .andExpect(jsonPath("$.data.analysis.riskLevel").value("low"))
                .andExpect(jsonPath("$.data.hasPatternAnalysis").value(true));

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysis.structuredSummary").value("Updated AI summary"))
                .andExpect(jsonPath("$.data.analysis.failureCategory").value("time_management"))
                .andExpect(jsonPath("$.data.analysis.keywords[0]").value("updated pattern"))
                .andExpect(jsonPath("$.data.analysis.riskLevel").value("low"))
                .andExpect(jsonPath("$.data.hasPatternAnalysis").value(true));

        mockServer.verify();
    }
}
