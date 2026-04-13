package com.failforward.backend.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

public abstract class ApiIntegrationTestSupport {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected String registerAndLogin(String email, String password, String nickname, String ageGroup) throws Exception {
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

    protected long createExperience(String token, String title, String content) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "%s",
                                  "content": "%s",
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
                                """.formatted(title, content)))
                .andExpect(status().isCreated())
                .andReturn();

        return readId(createResult);
    }

    protected long readId(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.path("data").path("id").asLong();
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }
}
