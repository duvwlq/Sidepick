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
        MvcResult verificationRequestResult = mockMvc.perform(post("/api/auth/email-verifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "auth_test@sidepick.dev"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String verificationCode = objectMapper.readTree(verificationRequestResult.getResponse().getContentAsString())
                .path("data")
                .path("verificationCode")
                .asText();

        mockMvc.perform(post("/api/auth/email-verifications/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "auth_test@sidepick.dev",
                                  "code": "%s"
                                }
                                """.formatted(verificationCode)))
                .andExpect(status().isOk());

        String requestBody = """
                {
                  "email": "auth_test@sidepick.dev",
                  "password": "password123",
                  "fullName": "Auth User",
                  "birthDate": "1998-03-15",
                  "gender": "FEMALE",
                  "region": "서울",
                  "signupPurposes": ["실패 이유를 찾아보고 싶어요"],
                  "nickname": "authuser",
                  "experienceStatus": "HAS_EXPERIENCE",
                  "ageGroup": "20s"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.email").value("auth_test@sidepick.dev"))
                .andExpect(jsonPath("$.data.user.fullName").value("Auth User"))
                .andExpect(jsonPath("$.data.user.emailVerified").value(true))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.accessTokenExpiresIn").value(3600))
                .andExpect(jsonPath("$.data.emailVerificationRequired").value(false));

        User savedUser = userRepository.findByEmail("auth_test@sidepick.dev").orElseThrow();
        assertThat(savedUser.getPassword()).isNotEqualTo("password123");
        assertThat(checkpw("password123", savedUser.getPassword())).isTrue();
        assertThat(savedUser.getEmailVerified()).isTrue();
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
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void loginReturnsJwtTokens() throws Exception {
        MvcResult verificationRequestResult = mockMvc.perform(post("/api/auth/email-verifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "token_test@sidepick.dev"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String verificationCode = objectMapper.readTree(verificationRequestResult.getResponse().getContentAsString())
                .path("data")
                .path("verificationCode")
                .asText();

        mockMvc.perform(post("/api/auth/email-verifications/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "token_test@sidepick.dev",
                                  "code": "%s"
                                }
                                """.formatted(verificationCode)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "token_test@sidepick.dev",
                                  "password": "password123",
                                  "fullName": "Token User",
                                  "birthDate": "1995-04-20",
                                  "gender": "MALE",
                                  "region": "경기",
                                  "signupPurposes": ["부업 시작 전에 공부해보고 싶어요"],
                                  "nickname": "tokenuser",
                                  "experienceStatus": "PLANNING",
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
                .andExpect(jsonPath("$.data.emailVerificationRequired").value(false))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.path("data").path("accessToken").asText()).startsWith("eyJ");
        assertThat(json.path("data").path("refreshToken").asText()).startsWith("eyJ");
    }

    @Test
    void emailVerificationFlowMarksUserVerified() throws Exception {
        MvcResult requestResult = mockMvc.perform(post("/api/auth/email-verifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "verify_test@sidepick.dev"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        String code = objectMapper.readTree(requestResult.getResponse().getContentAsString())
                .path("data")
                .path("verificationCode")
                .asText();

        mockMvc.perform(post("/api/auth/email-verifications/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "verify_test@sidepick.dev",
                                  "code": "%s"
                                }
                                """.formatted(code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("VERIFIED"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "verify_test@sidepick.dev",
                                  "password": "password123",
                                  "fullName": "Verify User",
                                  "birthDate": "1994-05-30",
                                  "gender": "MALE",
                                  "region": "부산",
                                  "signupPurposes": ["내 경험을 기록하고 공유하고 싶어요"],
                                  "nickname": "verifyuser",
                                  "experienceStatus": "HAS_EXPERIENCE",
                                  "ageGroup": "20s"
                                }
                                """))
                .andExpect(status().isCreated());

        User verifiedUser = userRepository.findByEmail("verify_test@sidepick.dev").orElseThrow();
        assertThat(verifiedUser.getEmailVerified()).isTrue();
    }
}
