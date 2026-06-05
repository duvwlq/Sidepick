package com.failforward.backend.domain.agenta.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AgentAApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void analyzeDraftReturnsQuestionCardsForShortDraft() throws Exception {
        String token = registerAndLogin("agenta_user@sidepick.dev", "password123", "agentaUser", "20s");

        mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "content-sns",
                                    "body": "SNS 부업을 가볍게 시작했는데 어디서부터 정리해야 할지 막막합니다."
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ok"))
                .andExpect(jsonPath("$.data.needs_questions").value(true))
                .andExpect(jsonPath("$.data.questions.length()").value(5))
                .andExpect(jsonPath("$.data.questions[0].slot").value("goal"))
                .andExpect(jsonPath("$.data.questions[1].slot").value("obstacle"))
                .andExpect(jsonPath("$.data.meta.used_template").value(true));
    }

    @Test
    void analyzeDraftReturnsThreeToFiveQuestionsBasedOnDraftCompleteness() throws Exception {
        String token = registerAndLogin("agenta_range@sidepick.dev", "password123", "agentaRange", "20s");

        MvcResult result = mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "online-commerce",
                                    "body": "3개월 동안 온라인 판매를 했고 50만원 정도를 썼습니다. 고객은 직장인이었고 인스타그램 광고를 썼는데 반응이 낮았습니다."
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        int questionCount = response.path("data").path("questions").size();
        org.assertj.core.api.Assertions.assertThat(questionCount).isBetween(3, 5);
    }

    @Test
    void analyzeDraftReturnsBadRequestWhenRequiredFieldsAreMissing() throws Exception {
        String token = registerAndLogin("agenta_invalid@sidepick.dev", "password123", "agentaInvalid", "20s");

        mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "",
                                    "body": ""
                                  }
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void analyzeDraftRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "investment",
                                    "body": "초안입니다."
                                  }
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void analyzeDraftAppliesRateLimitPerUser() throws Exception {
        String token = registerAndLogin("agenta_limit@sidepick.dev", "password123", "agentaLimit", "20s");

        for (int index = 0; index < 5; index++) {
            mockMvc.perform(post("/api/agent-a/analyze-draft")
                            .header(HttpHeaders.AUTHORIZATION, bearer(token))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "draft": {
                                        "category_slug": "online-commerce",
                                        "body": "반복 요청 %d"
                                      }
                                    }
                                    """.formatted(index)))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "online-commerce",
                                    "body": "여섯 번째 요청"
                                  }
                                }
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.errorCode").value("RATE_LIMITED"));
    }
}
