package com.failforward.backend.domain.analysis.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AnalysisApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void getAnalysisBeforeCreationReturnsNotFound() throws Exception {
        String token = registerAndLogin("analysis_view@sidepick.dev", "password123", "analysisUser", "20s");
        long experienceId = createExperience(token, "Analysis source", "This experience is used to verify analysis creation.");

        mockMvc.perform(get("/api/experiences/{experienceId}/analysis", experienceId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("NOT_FOUND"));
    }

    @Test
    void createAnalysisAndLoadMatchedCasesWorksForAuthenticatedUser() throws Exception {
        String token = registerAndLogin("analysis_create@sidepick.dev", "password123", "analysisCreate", "20s");
        long experienceId = createExperience(token, "Analysis target", "This experience triggers generated AI analysis for MVP tests.");

        MvcResult createResult = mockMvc.perform(post("/api/experiences/{experienceId}/analysis", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.extractedPatterns").isArray())
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
    }
}
