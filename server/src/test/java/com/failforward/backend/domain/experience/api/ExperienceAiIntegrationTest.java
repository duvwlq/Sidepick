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

        mockServer.expect(requestTo("http://localhost:8000/analyze"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "id": 1,
                          "experienceId": 1,
                          "extractedPatterns": ["market research gap", "validation gap"],
                          "riskFactors": ["weak marketing execution"],
                          "successFactors": ["start with faster validation"],
                          "structuredSummary": "The launch failed because market validation and marketing planning were both weak.",
                          "confidenceScore": 0.82,
                          "processedAt": "2026-04-15T00:00:00"
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
                .andExpect(jsonPath("$.data.analysis.structuredSummary")
                        .value("The launch failed because market validation and marketing planning were both weak."))
                .andExpect(jsonPath("$.data.analysis.extractedPatterns[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.hasPatternAnalysis").value(true))
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysis.structuredSummary")
                        .value("The launch failed because market validation and marketing planning were both weak."))
                .andExpect(jsonPath("$.data.analysis.confidenceScore").value(0.82));

        mockServer.verify();
    }

    @Test
    void createExperienceKeepsPostEvenWhenAiServerFails() throws Exception {
        String token = registerAndLogin("ai_fail@sidepick.dev", "password123", "aiFail", "20s");

        mockServer.expect(requestTo("http://localhost:8000/analyze"))
                .andExpect(method(POST))
                .andRespond(withServerError());

        var createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "AI failure fallback",
                                  "content": "Experience should still be stored when AI is down.",
                                  "categoryId": 1
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

        mockServer.expect(requestTo("http://localhost:8000/analyze"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "id": 1,
                          "experienceId": 1,
                          "extractedPatterns": ["initial pattern"],
                          "riskFactors": ["initial risk"],
                          "successFactors": ["initial success"],
                          "structuredSummary": "Initial AI summary",
                          "confidenceScore": 0.61,
                          "processedAt": "2026-04-15T00:00:00"
                        }
                        """, MediaType.APPLICATION_JSON));

        mockServer.expect(requestTo("http://localhost:8000/analyze"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "id": 2,
                          "experienceId": 1,
                          "extractedPatterns": ["updated pattern"],
                          "riskFactors": ["updated risk"],
                          "successFactors": ["updated success"],
                          "structuredSummary": "Updated AI summary",
                          "confidenceScore": 0.93,
                          "processedAt": "2026-04-16T00:00:00"
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
                .andExpect(jsonPath("$.data.analysis.structuredSummary").value("Initial AI summary"))
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
                .andExpect(jsonPath("$.data.analysis.extractedPatterns[0]").value("updated pattern"))
                .andExpect(jsonPath("$.data.analysis.confidenceScore").value(0.93));

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysis.structuredSummary").value("Updated AI summary"))
                .andExpect(jsonPath("$.data.analysis.riskFactors[0]").value("updated risk"))
                .andExpect(jsonPath("$.data.analysis.successFactors[0]").value("updated success"));

        mockServer.verify();
    }
}
