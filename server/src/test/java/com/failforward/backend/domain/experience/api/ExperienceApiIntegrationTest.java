package com.failforward.backend.domain.experience.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExperienceApiIntegrationTest extends ApiIntegrationTestSupport {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void createExperienceWithoutAuthReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/experiences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Unauthorized",
                                  "content": "This request should fail because it has no bearer token.",
                                  "categoryId": 1,
                                  "failureReason": "No auth",
                                  "failureReasons": ["No auth"]
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void unverifiedUserCannotCreateExperience() throws Exception {
        User unverifiedUser = User.create(
                "unverified@sidepick.dev",
                BCrypt.hashpw("password123", BCrypt.gensalt()),
                "unverifiedUser",
                "20s"
        );
        userRepository.save(unverifiedUser);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "unverified@sidepick.dev",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data")
                .path("accessToken")
                .asText();

        mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Blocked experience",
                                  "content": "This should fail until the email is verified.",
                                  "categoryId": 1,
                                  "failureReason": "Verification required",
                                  "failureReasons": ["Verification required"]
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
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
                                  "averageDailyHours": "1_TO_3_HOURS",
                                  "isConcurrentWithMainJob": true,
                                  "monthlyRevenue": 150000,
                                  "failureReason": "No product-market fit",
                                  "failureReasons": ["No product-market fit", "Weak execution"],
                                  "difficulties": ["Customer acquisition", "Time management"],
                                  "targetMarket": "Students",
                                  "marketingChannels": ["Instagram", "Blog"],
                                  "lessonsLearned": "Validate demand first.",
                                  "wouldRetry": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.author.email").value("owner@sidepick.dev"))
                .andExpect(jsonPath("$.data.averageDailyHours").value("1_TO_3_HOURS"))
                .andExpect(jsonPath("$.data.isConcurrentWithMainJob").value(true))
                .andExpect(jsonPath("$.data.monthlyRevenue").value(150000))
                .andExpect(jsonPath("$.data.failureReasons[0]").value("No product-market fit"))
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
                                  "averageDailyHours": "UNDER_1_HOUR",
                                  "isConcurrentWithMainJob": false,
                                  "monthlyRevenue": 100000,
                                  "failureReason": "Weak validation",
                                  "failureReasons": ["Weak validation"],
                                  "difficulties": ["Information gap"],
                                  "targetMarket": "Students",
                                  "marketingChannels": ["Instagram"],
                                  "lessonsLearned": "Only owner can update.",
                                  "wouldRetry": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Owner experience updated"))
                .andExpect(jsonPath("$.data.failureReason").value("Weak validation"))
                .andExpect(jsonPath("$.data.averageDailyHours").value("UNDER_1_HOUR"))
                .andExpect(jsonPath("$.data.isConcurrentWithMainJob").value(false));

        mockMvc.perform(delete("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("EXPERIENCE_NOT_FOUND"));
    }

    @Test
    void listSupportsSearchAndStructuredFilters() throws Exception {
        String token = registerAndLogin("filter@sidepick.dev", "password123", "filterUser", "20s");

        createExperienceWithPayload(token, """
                {
                  "title": "Shopping mall failure",
                  "content": "Ad spend was high and demand validation was weak.",
                  "categoryId": 1,
                  "businessType": "Online store",
                  "investmentAmount": 300000,
                  "durationMonths": 2,
                  "failureReason": "Weak demand validation",
                  "failureReasons": ["Weak demand validation"],
                  "targetMarket": "Students"
                }
                """);

        createExperienceWithPayload(token, """
                {
                  "title": "Content side project failure",
                  "content": "The project ran long and revenue did not scale.",
                  "categoryId": 2,
                  "businessType": "Content creation",
                  "investmentAmount": 1500000,
                  "durationMonths": 8,
                  "failureReason": "Revenue stagnation",
                  "failureReasons": ["Revenue stagnation"],
                  "targetMarket": "Office workers"
                }
                """);

        mockMvc.perform(get("/api/experiences")
                        .param("q", "mall")
                        .param("categoryId", "1")
                        .param("durationMonthsMax", "3")
                        .param("investmentAmountMax", "500000")
                        .param("sort", "latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.experiences.length()").value(1))
                .andExpect(jsonPath("$.data.experiences[0].title").value("Shopping mall failure"));

        mockMvc.perform(get("/api/experiences")
                        .param("failureReason", "Revenue stagnation")
                        .param("durationMonthsMin", "6")
                        .param("investmentAmountMin", "1000000")
                        .param("sort", "popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.experiences.length()").value(1))
                .andExpect(jsonPath("$.data.experiences[0].title").value("Content side project failure"));
    }

    @Test
    void listRejectsInvalidFilterRanges() throws Exception {
        mockMvc.perform(get("/api/experiences")
                        .param("durationMonthsMin", "10")
                        .param("durationMonthsMax", "3"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/experiences")
                        .param("investmentAmountMin", "1000000")
                        .param("investmentAmountMax", "100"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/experiences")
                        .param("durationMonthsMin", "-1"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/experiences")
                        .param("investmentAmountMin", "-1"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void detailExposesRelatedSuccessCases() throws Exception {
        String token = registerAndLogin("success-link@sidepick.dev", "password123", "successLinkUser", "20s");
        long sourceExperienceId = createExperience(token, "Failure source", "Failure source content");
        long successExperienceId = createExperience(token, "Success target", "Success target content");

        jdbcTemplate.update("UPDATE failure_experiences SET case_status = 'SUCCESS' WHERE id = ?", successExperienceId);

        mockMvc.perform(get("/api/experiences/{experienceId}/success-cases", sourceExperienceId)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(successExperienceId))
                .andExpect(jsonPath("$.data[0].caseStatus").value("SUCCESS"));
    }

    @Test
    void invalidExperiencePayloadReturnsBadRequest() throws Exception {
        String token = registerAndLogin("invalid@sidepick.dev", "password123", "invalidUser", "20s");

        mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Invalid",
                                  "content": "",
                                  "categoryId": 1,
                                  "investmentAmount": -10,
                                  "failureReasons": []
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void detailIncreasesViewCountOnEachRequest() throws Exception {
        String token = registerAndLogin("viewcount@sidepick.dev", "password123", "viewUser", "20s");

        MvcResult createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "View count target",
                                  "content": "Checking that detail view count increments once per request.",
                                  "categoryId": 1,
                                  "failureReason": "View count",
                                  "failureReasons": ["View count"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viewCount").value(1));

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viewCount").value(2));
    }

    @Test
    void createAndUpdateMaskSensitiveValuesBeforePersisting() throws Exception {
        String token = registerAndLogin("masking@sidepick.dev", "password123", "maskingUser", "20s");

        MvcResult createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Mask target",
                                  "content": "Call me at 010-1234-5678 or email testuser@example.com with 990101-1234567.",
                                  "categoryId": 1,
                                  "businessType": "Online store",
                                  "failureReason": "Personal info leaked via 01012345678",
                                  "failureReasons": ["Contact testuser@example.com"],
                                  "targetMarket": "990101-1234567",
                                  "marketingChannels": ["010 1234 5678", "owner@example.com"],
                                  "lessonsLearned": "Do not publish 010-1234-5678"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content").value(org.hamcrest.Matchers.containsString("010-****-5678")))
                .andExpect(jsonPath("$.data.content").value(org.hamcrest.Matchers.containsString("t**@example.com")))
                .andExpect(jsonPath("$.data.content").value(org.hamcrest.Matchers.containsString("990101-*******")))
                .andExpect(jsonPath("$.data.failureReason").value("Personal info leaked via 010-****-5678"))
                .andExpect(jsonPath("$.data.targetMarket").value("990101-*******"))
                .andExpect(jsonPath("$.data.marketingChannels[0]").value("010-****-5678"))
                .andExpect(jsonPath("$.data.marketingChannels[1]").value("o**@example.com"))
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(patch("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Mask target updated",
                                  "content": "Updated mail second@example.com and phone 010-9999-0000.",
                                  "categoryId": 1,
                                  "businessType": "Online store",
                                  "failureReason": "Updated 010-9999-0000",
                                  "failureReasons": ["Updated second@example.com"],
                                  "targetMarket": "010-9999-0000",
                                  "marketingChannels": ["second@example.com"],
                                  "lessonsLearned": "Hide second@example.com"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value(org.hamcrest.Matchers.containsString("s**@example.com")))
                .andExpect(jsonPath("$.data.content").value(org.hamcrest.Matchers.containsString("010-****-0000")))
                .andExpect(jsonPath("$.data.failureReason").value("Updated 010-****-0000"))
                .andExpect(jsonPath("$.data.targetMarket").value("010-****-0000"))
                .andExpect(jsonPath("$.data.marketingChannels[0]").value("s**@example.com"));
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
                                  "categoryId": 1,
                                  "failureReason": "Ownership",
                                  "failureReasons": ["Ownership"]
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
                                  "categoryId": 1,
                                  "failureReason": "Ownership",
                                  "failureReasons": ["Ownership"]
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));

        mockMvc.perform(put("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Should fail via put",
                                  "content": "This update must be rejected.",
                                  "categoryId": 1,
                                  "failureReason": "Ownership",
                                  "failureReasons": ["Ownership"]
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));

        mockMvc.perform(delete("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    void ownerCanUpdateExperienceWithPut() throws Exception {
        String token = registerAndLogin("put-owner@sidepick.dev", "password123", "putOwner", "20s");
        long experienceId = createExperience(token, "PUT target", "Original content");

        mockMvc.perform(put("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "PUT updated title",
                                  "content": "Updated via put endpoint.",
                                  "categoryId": 1,
                                  "businessType": "Online store",
                                  "investmentAmount": 120000,
                                  "durationMonths": 2,
                                  "averageDailyHours": "1_TO_3_HOURS",
                                  "isConcurrentWithMainJob": true,
                                  "monthlyRevenue": 10000,
                                  "failureReason": "Need put support",
                                  "failureReasons": ["Need put support"],
                                  "difficulties": ["Time management"],
                                  "targetMarket": "Workers",
                                  "marketingChannels": ["Blog"],
                                  "lessonsLearned": "PUT should work.",
                                  "wouldRetry": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("PUT updated title"))
                .andExpect(jsonPath("$.data.failureReason").value("Need put support"));
    }

    @Test
    void adminCanDeleteAnyExperience() throws Exception {
        String ownerToken = registerAndLogin("owner3@sidepick.dev", "password123", "ownerUser3", "20s");
        String adminToken = registerAndLogin("admin@sidepick.dev", "password123", "adminUser", "30s");

        MvcResult createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Admin removable experience",
                                  "content": "An admin should be able to delete this post.",
                                  "categoryId": 1,
                                  "failureReason": "Moderation",
                                  "failureReasons": ["Moderation"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long experienceId = readId(createResult);

        mockMvc.perform(delete("/api/experiences/{experienceId}", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/experiences/{experienceId}", experienceId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("EXPERIENCE_NOT_FOUND"));
    }

    private long createExperienceWithPayload(String token, String payload) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/experiences")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        return readId(createResult);
    }
}
