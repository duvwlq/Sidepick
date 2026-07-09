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
    void analyzeDraftReturnsQuestionCardsWhenCoreContextIsMissing() throws Exception {
        String token = registerAndLogin("agenta_user@sidepick.dev", "password123", "agentaUser", "20s");

        mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "content-sns",
                                    "body": "I started an SNS side job."
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ok"))
                .andExpect(jsonPath("$.data.needs_questions").value(true))
                .andExpect(jsonPath("$.data.trigger_reason").value("MISSING_CORE_FIELDS"))
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
                                    "body": "For 3 months I sold handmade goods online, spent 500000 won on ads, targeted office workers, used instagram marketing, but I got stuck because conversion was low."
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
    void analyzeDraftSkipsQuestionCardsWhenDraftHasEnoughContext() throws Exception {
        String token = registerAndLogin("agenta_quality@sidepick.dev", "password123", "agentaQuality", "20s");

        mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "online-commerce",
                                    "body": "My goal was to validate repeat purchase demand. For 4 months I ran an online store, spent 800000 won, targeted office workers in their 20s, researched the market and competitors, used instagram and blog channels, hit a problem with low conversion, and the result was only 3 orders with almost no revenue."
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.needs_questions").value(false))
                .andExpect(jsonPath("$.data.trigger_reason").value("NONE"))
                .andExpect(jsonPath("$.data.questions.length()").value(0));
    }

    @Test
    void analyzeDraftRecognizesCommonKoreanDraftSignals() throws Exception {
        String token = registerAndLogin("agenta_korean@sidepick.dev", "password123", "agentaKorean", "20s");

        mockMvc.perform(post("/api/agent-a/analyze-draft")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "draft": {
                                    "category_slug": "online-commerce",
                                    "body": "회사 다니면서 추가 수익을 내보려고 스마트스토어를 4개월 운영했습니다. 광고비로 30만원 정도 썼고, 직장인을 타깃으로 인스타그램 채널을 사용했습니다. 과외 매칭 반응은 있었는데 주문 전환이 잘 안 돼서 걱정이 컸고 결국 주문은 거의 없었습니다."
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.needs_questions").value(false))
                .andExpect(jsonPath("$.data.trigger_reason").value("NONE"))
                .andExpect(jsonPath("$.data.questions.length()").value(0));
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
                                    "body": "draft"
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
                                        "body": "rate limit request %d"
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
                                    "body": "one more request"
                                  }
                                }
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.errorCode").value("RATE_LIMITED"));
    }
}
