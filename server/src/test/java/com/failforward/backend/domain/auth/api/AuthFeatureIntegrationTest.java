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

@SpringBootTest(properties = "app.auth.local-enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthFeatureIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void localAuthDisabledReturnsBadRequestForEmailAuthApis() throws Exception {
        mockMvc.perform(post("/api/auth/email-verifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "disabled@sidepick.dev"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.detail").value("Email login is not available right now."));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "disabled@sidepick.dev",
                                  "password": "password123",
                                  "nickname": "disabled",
                                  "ageGroup": "20s"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.detail").value("Email login is not available right now."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "disabled@sidepick.dev",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.detail").value("Email login is not available right now."));
    }
}
