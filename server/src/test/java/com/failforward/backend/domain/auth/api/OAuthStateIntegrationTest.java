package com.failforward.backend.domain.auth.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OAuthStateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void issueOAuthStateReturnsStatePayload() throws Exception {
        mockMvc.perform(post("/api/auth/oauth/state")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "provider": "KAKAO",
                                  "redirectUri": "http://localhost:4174/auth/kakao/callback"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.state").isNotEmpty())
                .andExpect(jsonPath("$.data.provider").value("KAKAO"))
                .andExpect(jsonPath("$.data.expiresAt").isNotEmpty());
    }

    @Test
    void oauthLoginWithoutIssuedStateReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/auth/oauth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "dummy-code",
                                  "state": "unknown-state",
                                  "redirectUri": "http://localhost:4174/auth/kakao/callback"
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }
}
