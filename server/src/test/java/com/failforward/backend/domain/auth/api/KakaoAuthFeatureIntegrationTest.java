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

@SpringBootTest(properties = "app.auth.kakao-enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class KakaoAuthFeatureIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void kakaoAuthDisabledReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/oauth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "dummy-code",
                                  "redirectUri": "http://localhost:4174/auth/kakao/callback"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.detail").value("Kakao login is not available right now."));
    }
}
