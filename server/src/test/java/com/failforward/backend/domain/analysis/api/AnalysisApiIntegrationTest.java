package com.failforward.backend.domain.analysis.api;

import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.response.DefaultResponseCreator;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AnalysisApiIntegrationTest extends ApiIntegrationTestSupport {

    private static final String FAILURE_CATEGORY = "market_validation_gap";
    private static final String SUMMARY = "The team failed because customer validation and early promotion were both insufficient.";

    @Autowired
    private RestTemplate aiRestTemplate;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.bindTo(aiRestTemplate).ignoreExpectOrder(true).build();
    }

    @Test
    void getAnalysisBeforeCreationReturnsNotFound() throws Exception {
        String token = registerAndLogin("analysis_view@sidepick.dev", "password123", "analysisUser", "20s");
        expectAiFailure();
        long experienceId = createExperience(token, "Analysis source", "This experience is used to verify analysis creation.");

        mockMvc.perform(get("/api/experiences/{experienceId}/analysis", experienceId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("REPORT_NOT_FOUND"));

        mockServer.verify();
    }

    @Test
    void getReportReturnsNotReadyWhenAnalysisDoesNotExist() throws Exception {
        String token = registerAndLogin("report_pending@sidepick.dev", "password123", "reportPending", "20s");
        expectAiFailure();
        long experienceId = createExperience(token, "Pending report", "This experience has no stored analysis yet.");

        mockMvc.perform(get("/api/reports/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.reportStatus").value("NOT_READY"))
                .andExpect(jsonPath("$.data.analysisId").isEmpty())
                .andExpect(jsonPath("$.data.keywords.length()").value(0))
                .andExpect(jsonPath("$.data.riskFactors.length()").value(0))
                .andExpect(jsonPath("$.data.explanation").isEmpty())
                .andExpect(jsonPath("$.data.similarCases.length()").value(0));

        mockServer.verify();
    }

    @Test
    void createAnalysisAndLoadMatchedCasesWorksForAuthenticatedUser() throws Exception {
        String token = registerAndLogin("analysis_create@sidepick.dev", "password123", "analysisCreate", "20s");
        expectAiFailure();
        expectAiFailure();
        expectAiAnalysis();
        long similarExperienceId = createExperience(
                token,
                "Similar public case",
                "This seeded public experience should be used as a similar case."
        );
        long experienceId = createExperience(token, "Analysis target", "This experience triggers AI analysis creation.");

        mockMvc.perform(post("/api/experiences/{experienceId}/analysis", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult analysisResult = mockMvc.perform(get("/api/experiences/{experienceId}/analysis", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.keywords[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.failureCategory").value(FAILURE_CATEGORY))
                .andExpect(jsonPath("$.data.riskLevel").value("high"))
                .andExpect(jsonPath("$.data.structuredSummary").value(SUMMARY))
                .andExpect(jsonPath("$.data.explanation").exists())
                .andExpect(jsonPath("$.data.explanation.inputUsed.category").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.inputUsed.bodyExcerpt").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.matchedPatterns[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.explanation.similarCasesUsed.length()").value(0))
                .andExpect(jsonPath("$.data.explanation.isVerified").value(true))
                .andExpect(jsonPath("$.data.explanation.confidenceScore").isNumber())
                .andExpect(jsonPath("$.data.explanation.debug.totalSimilarCases").value(0))
                .andExpect(jsonPath("$.data.explanation.debug.source").value("server-generated"))
                .andReturn();

        long analysisId = readId(analysisResult);

        mockMvc.perform(get("/api/analysis/{analysisId}/matched-cases", analysisId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").exists())
                .andExpect(jsonPath("$.data[0].caseId").value(String.valueOf(similarExperienceId)))
                .andExpect(jsonPath("$.data[0].caseTitle").isNotEmpty())
                .andExpect(jsonPath("$.data[0].matchRate").isNumber())
                .andExpect(jsonPath("$.data[0].caseId").value(org.hamcrest.Matchers.not(String.valueOf(experienceId))))
                .andExpect(jsonPath("$.data[0].explanation.similarityScore").value(0.8))
                .andExpect(jsonPath("$.data[0].explanation.matchedKeywords[0]").value("market research gap"))
                .andExpect(jsonPath("$.data[0].explanation.caseId").value(String.valueOf(similarExperienceId)))
                .andExpect(jsonPath("$.data[0].explanation.source").value("matched-case"))
                .andExpect(jsonPath("$.data[0].explanation.debug.source").value("server-generated"));

        mockServer.verify();
    }

    @Test
    void getReportReturnsSummaryAndSimilarCasesWhenAnalysisExists() throws Exception {
        String token = registerAndLogin("report_ready@sidepick.dev", "password123", "reportReady", "20s");
        expectAiFailure();
        expectAiAnalysis();
        long similarExperienceId = createExperience(
                token,
                "Seeded similar report case",
                "This report seed should appear as a similar case instead of a self match."
        );
        long experienceId = createExperience(token, "Report target", "This experience should expose a ready report.");

        mockMvc.perform(get("/api/reports/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.reportStatus").value("READY"))
                .andExpect(jsonPath("$.data.summary").value(SUMMARY))
                .andExpect(jsonPath("$.data.extractedPatterns[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.keywords[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.riskFactors.length()").value(0))
                .andExpect(jsonPath("$.data.similarCases[0].caseId").value(String.valueOf(similarExperienceId)))
                .andExpect(jsonPath("$.data.similarCases[0].title").isNotEmpty())
                .andExpect(jsonPath("$.data.similarCases[0].matchRate").isNumber())
                .andExpect(jsonPath("$.data.similarCases[0].caseId").value(org.hamcrest.Matchers.not(String.valueOf(experienceId))))
                .andExpect(jsonPath("$.data.explanation.inputUsed.category").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.inputUsed.bodyExcerpt").isNotEmpty())
                .andExpect(jsonPath("$.data.explanation.matchedPatterns[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.explanation.similarCasesUsed[0]").value(String.valueOf(similarExperienceId)))
                .andExpect(jsonPath("$.data.explanation.confidenceScore").isNumber())
                .andExpect(jsonPath("$.data.explanation.debug.totalSimilarCases").value(1))
                .andExpect(jsonPath("$.data.explanation.debug.source").value("server-generated"))
                .andExpect(jsonPath("$.data.similarCases[0].explanation.similarityScore").value(0.8))
                .andExpect(jsonPath("$.data.similarCases[0].explanation.matchedKeywords[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.similarCases[0].explanation.caseId").value(String.valueOf(similarExperienceId)))
                .andExpect(jsonPath("$.data.similarCases[0].explanation.debug.source").value("server-generated"));

        mockServer.verify();
    }

    @Test
    void analysisCacheReusesAiResponseForSamePayload() throws Exception {
        String token = registerAndLogin("analysis_cache@sidepick.dev", "password123", "analysisCache", "20s");
        mockServer.expect(ExpectedCount.once(), requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "keywords": ["market research gap", "validation gap"],
                          "failure_category": "market_validation_gap",
                          "summary": "The team failed because customer validation and early promotion were both insufficient.",
                          "risk_level": "high"
                        }
                        """, MediaType.APPLICATION_JSON));

        long firstExperienceId = createExperience(token, "Cache first", "Same payload for cache reuse.");
        long secondExperienceId = createExperience(token, "Cache second", "Same payload for cache reuse.");

        mockMvc.perform(get("/api/experiences/{experienceId}/analysis", firstExperienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.structuredSummary").value(SUMMARY));

        mockMvc.perform(get("/api/experiences/{experienceId}/analysis", secondExperienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.structuredSummary").value(SUMMARY));

        mockServer.verify();
    }

    private void expectAiFailure() {
        mockServer.expect(requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(withServerError());
    }

    private void expectAiAnalysis() {
        DefaultResponseCreator response = withSuccess("""
                {
                  "keywords": ["market research gap", "validation gap"],
                  "failure_category": "market_validation_gap",
                  "summary": "The team failed because customer validation and early promotion were both insufficient.",
                  "risk_level": "high"
                }
                """, MediaType.APPLICATION_JSON);

        mockServer.expect(requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(response);
    }
}
