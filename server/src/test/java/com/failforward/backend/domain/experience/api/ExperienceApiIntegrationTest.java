package com.failforward.backend.domain.experience.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExperienceApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createExperienceWithoutAuthReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/experiences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Unauthorized",
                                  "content": "This request should fail because it has no bearer token.",
                                  "categoryId": 1
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("UNAUTHORIZED"));
    }

    @Test
    void authenticatedOwnerCanRunExperienceCrud() throws Exception {
        String token = registerAndLogin("owner@sidepick.dev", "password123", "ownerUser", "20s");

        MvcResult createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Owner experience",
                                  "content": "I launched too quickly and learned demand validation matters.",
                                  "categoryId": 1,
                                  "businessType": "Online store",
                                  "investmentAmount": 500000,
                                  "durationMonths": 2,
                                  "failureReason": "No product-market fit",
                                  "targetMarket": "Students",
                                  "marketingChannels": ["Instagram", "Blog"],
                                  "lessonsLearned": "Validate demand first.",
                                  "wouldRetry": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.author.email").value("owner@sidepick.dev"))
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(get("/api/experiences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experiences[0].id").value(experienceId));

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(experienceId))
                .andExpect(jsonPath("$.data.viewCount").value(1));

        mockMvc.perform(patch("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Owner experience updated",
                                  "content": "Updated content for owner verification.",
                                  "categoryId": 1,
                                  "businessType": "Online store",
                                  "investmentAmount": 650000,
                                  "durationMonths": 3,
                                  "failureReason": "Weak validation",
                                  "targetMarket": "Students",
                                  "marketingChannels": ["Instagram"],
                                  "lessonsLearned": "Only owner can update.",
                                  "wouldRetry": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Owner experience updated"))
                .andExpect(jsonPath("$.data.failureReason").value("Weak validation"));

        mockMvc.perform(delete("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data.code").value("NOT_FOUND"));
    }

    @Test
    void nonOwnerCannotUpdateOrDeleteExperience() throws Exception {
        String ownerToken = registerAndLogin("owner2@sidepick.dev", "password123", "ownerUser2", "20s");
        String otherToken = registerAndLogin("other@sidepick.dev", "password123", "otherUser", "30s");

        MvcResult createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Protected experience",
                                  "content": "Only the owner should modify this experience.",
                                  "categoryId": 1
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(patch("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Should fail",
                                  "content": "This update must be rejected.",
                                  "categoryId": 1
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.code").value("FORBIDDEN"));

        mockMvc.perform(delete("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.code").value("FORBIDDEN"));
    }

    private String registerAndLogin(String email, String password, String nickname, String ageGroup) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s",
                                  "nickname": "%s",
                                  "ageGroup": "%s"
                                }
                                """.formatted(email, password, nickname, ageGroup)))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = json.path("data").path("accessToken").asText();
        assertThat(token).isNotBlank();
        return token;
    }

    private long readId(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.path("data").path("id").asLong();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
