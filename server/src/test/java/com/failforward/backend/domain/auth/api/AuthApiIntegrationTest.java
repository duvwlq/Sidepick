package com.failforward.backend.domain.auth.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.crypto.bcrypt.BCrypt.checkpw;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void registerStoresBcryptPasswordAndReturnsTokens() throws Exception {
        String requestBody = """
                {
                  "email": "auth_test@sidepick.dev",
                  "password": "password123",
                  "nickname": "authuser",
                  "ageGroup": "20s"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.email").value("auth_test@sidepick.dev"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.accessTokenExpiresIn").value(3600));

        User savedUser = userRepository.findByEmail("auth_test@sidepick.dev").orElseThrow();
        assertThat(savedUser.getPassword()).isNotEqualTo("password123");
        assertThat(checkpw("password123", savedUser.getPassword())).isTrue();
    }

    @Test
    void loginWithWrongPasswordReturnsBadRequest() throws Exception {
        userRepository.save(User.create(
                "login_test@sidepick.dev",
                org.springframework.security.crypto.bcrypt.BCrypt.hashpw("password123",
                        org.springframework.security.crypto.bcrypt.BCrypt.gensalt()),
                "loginuser",
                "30s"
        ));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "login_test@sidepick.dev",
                                  "password": "wrongpass"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.data.detail").value("Email or password is invalid."));
    }

    @Test
    void loginReturnsJwtTokens() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "token_test@sidepick.dev",
                                  "password": "password123",
                                  "nickname": "tokenuser",
                                  "ageGroup": "20s"
                                }
                                """))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "token_test@sidepick.dev",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.path("data").path("accessToken").asText()).startsWith("eyJ");
        assertThat(json.path("data").path("refreshToken").asText()).startsWith("eyJ");
    }
}
