package com.failforward.backend.domain.admin.api;

import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminChatbotOpsApiIntegrationTest extends ApiIntegrationTestSupport {

    @Autowired
    private RestTemplate aiRestTemplate;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.bindTo(aiRestTemplate).ignoreExpectOrder(true).build();
    }

    @Test
    void adminChatbotOpsRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/chatbot-ops"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminChatbotOpsRejectsNonAdminUser() throws Exception {
        String token = registerAndLogin("ops_user@sidepick.dev", "password123", "opsUser", "20s");

        mockMvc.perform(get("/api/admin/chatbot-ops")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    void adminChatbotOpsReturnsQueueTokenAndRateLimitSnapshot() throws Exception {
        String adminToken = registerAndLogin("admin@sidepick.dev", "password123", "opsAdmin", "20s");
        String userToken = registerAndLogin("ops_target@sidepick.dev", "password123", "opsTarget", "20s");

        mockServer.expect(ExpectedCount.times(2), requestTo("http://localhost:8001/chatbot/message"))
                .andExpect(method(POST))
                .andRespond(withSuccess("""
                        {
                          "reply": "This is a safe enough chatbot reply with source context.",
                          "type": "react",
                          "sources": [],
                          "status": "success",
                          "explanation": {
                            "fallback": false
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        for (int index = 0; index < 2; index++) {
            mockMvc.perform(post("/api/chatbot/message")
                            .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "session_id": "ops-session",
                                      "message": "compare failure cases and stats with enough detail to route react %d"
                                    }
                                    """.formatted(index)))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(get("/api/admin/chatbot-ops")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.limits.rateLimitPerMin").value(10))
                .andExpect(jsonPath("$.data.limits.queueCapacity").value(4))
                .andExpect(jsonPath("$.data.queue.scope").value("single-instance"))
                .andExpect(jsonPath("$.data.queue.capacity").value(4))
                .andExpect(jsonPath("$.data.queue.availableSlots").value(4))
                .andExpect(jsonPath("$.data.queue.activeRequests").value(0))
                .andExpect(jsonPath("$.data.tokenBudget.usedTokens").isNumber())
                .andExpect(jsonPath("$.data.tokenBudget.remainingTokens").isNumber())
                .andExpect(jsonPath("$.data.rateLimit.trackedUsersInCurrentWindow").value(1))
                .andExpect(jsonPath("$.data.rateLimit.highestRequestCountInCurrentWindow").value(2))
                .andExpect(jsonPath("$.data.rateLimit.topUsers[0].requestCount").value(2));
    }
}
