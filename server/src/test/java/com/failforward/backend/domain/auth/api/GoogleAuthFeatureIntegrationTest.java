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

@SpringBootTest(properties = "app.auth.google-enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class GoogleAuthFeatureIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void googleAuthDisabledReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/oauth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "dummy-code",
                                  "redirectUri": "http://localhost:4174/auth/google/callback"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.detail").value("Google login is not available right now."));
    }
}
