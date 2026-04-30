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
                .andExpect(jsonPath("$.data.code").value("NOT_FOUND"));

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
                .andExpect(jsonPath("$.data.similarCases.length()").value(0));

        mockServer.verify();
    }

    @Test
    void createAnalysisAndLoadMatchedCasesWorksForAuthenticatedUser() throws Exception {
        String token = registerAndLogin("analysis_create@sidepick.dev", "password123", "analysisCreate", "20s");
        expectAiFailure();
        expectAiAnalysis();
        long experienceId = createExperience(token, "Analysis target", "This experience triggers AI analysis creation.");

        MvcResult createResult = mockMvc.perform(post("/api/experiences/{experienceId}/analysis", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.keywords[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.failureCategory").value("타겟분석실패"))
                .andExpect(jsonPath("$.data.riskLevel").value("high"))
                .andExpect(jsonPath("$.data.structuredSummary").value("시장 검증과 초기 홍보 전략이 부족해 수요 확보에 실패했습니다."))
                .andReturn();

        long analysisId = readId(createResult);

        mockMvc.perform(get("/api/analysis/{analysisId}/matched-cases", analysisId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").exists())
                .andExpect(jsonPath("$.data[0].caseId").isNotEmpty())
                .andExpect(jsonPath("$.data[0].caseTitle").isNotEmpty())
                .andExpect(jsonPath("$.data[0].matchRate").isNumber());

        mockServer.verify();
    }

    @Test
    void getReportReturnsSummaryAndSimilarCasesWhenAnalysisExists() throws Exception {
        String token = registerAndLogin("report_ready@sidepick.dev", "password123", "reportReady", "20s");
        expectAiAnalysis();
        long experienceId = createExperience(token, "Report target", "This experience should expose a ready report.");

        mockMvc.perform(get("/api/reports/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.reportStatus").value("READY"))
                .andExpect(jsonPath("$.data.summary").value("시장 검증과 초기 홍보 전략이 부족해 수요 확보에 실패했습니다."))
                .andExpect(jsonPath("$.data.extractedPatterns[0]").value("market research gap"))
                .andExpect(jsonPath("$.data.riskFactors[0]").value("타겟분석실패"))
                .andExpect(jsonPath("$.data.similarCases[0].caseId").isNotEmpty())
                .andExpect(jsonPath("$.data.similarCases[0].title").isNotEmpty())
                .andExpect(jsonPath("$.data.similarCases[0].matchRate").isNumber());

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
                  "failure_category": "타겟분석실패",
                  "summary": "시장 검증과 초기 홍보 전략이 부족해 수요 확보에 실패했습니다.",
                  "risk_level": "high"
                }
                """, MediaType.APPLICATION_JSON);

        mockServer.expect(requestTo("http://localhost:8001/analyze"))
                .andExpect(method(POST))
                .andRespond(response);
    }
}
