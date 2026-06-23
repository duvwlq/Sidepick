package com.failforward.backend.domain.guide.api;

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
class GuideApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void experienceGuideReturnsGuideLinesForExperience() throws Exception {
        String token = registerAndLogin("guide_api_owner@sidepick.dev", "password123", "guideApiOwner", "20s");
        long experienceId = createExperience(token, "Guide target", "Guide target content");

        mockMvc.perform(get("/api/guides/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.categoryId").value(1))
                .andExpect(jsonPath("$.data.categoryKey").isNotEmpty())
                .andExpect(jsonPath("$.data.difficultyKey").isNotEmpty())
                .andExpect(jsonPath("$.data.guideLines.length()").value(3));
    }

    @Test
    void guideWritingExamplesCanBeLoadedWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/guides/writing-examples"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version").value("1.0"))
                .andExpect(jsonPath("$.data.categories.length()").value(7))
                .andExpect(jsonPath("$.data.categories[0].examples.length()").value(7));
    }
}
