package com.failforward.backend.domain.user.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void getMeWithoutAuthReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void getMyHomeFeedWithoutAuthReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me/home-feed"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void getMeWithAuthReturnsCurrentUserProfile() throws Exception {
        String token = registerAndLogin("me_test@sidepick.dev", "password123", "meUser", "20s");

        mockMvc.perform(get("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.email").value("me_test@sidepick.dev"))
                .andExpect(jsonPath("$.data.user.nickname").value("meUser"))
                .andExpect(jsonPath("$.data.user.fullName").value("Test User"))
                .andExpect(jsonPath("$.data.user.ageGroup").value("20s"))
                .andExpect(jsonPath("$.data.user.authProvider").value("LOCAL"))
                .andExpect(jsonPath("$.data.user.emailVerified").value(true))
                .andExpect(jsonPath("$.data.user.profileCompleted").value(true));
    }

    @Test
    void updateMeUpdatesNicknameAndAgeGroup() throws Exception {
        String token = registerAndLogin("update_me@sidepick.dev", "password123", "beforeUser", "20s");

        mockMvc.perform(patch("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nickname": "afterUser",
                                  "fullName": "After User",
                                  "birthDate": "1991-02-03",
                                  "gender": "FEMALE",
                                  "region": "경기",
                                  "signupPurposes": ["실전에 참고할 사례가 필요해요"],
                                  "experienceStatus": "PLANNING",
                                  "ageGroup": "30s",
                                  "profileImage": null
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.nickname").value("afterUser"))
                .andExpect(jsonPath("$.data.user.fullName").value("After User"))
                .andExpect(jsonPath("$.data.user.ageGroup").value("30s"))
                .andExpect(jsonPath("$.data.user.profileCompleted").value(true));
    }

    @Test
    void updateAccountSettingsUpdatesNicknameAndExperienceStatus() throws Exception {
        String token = registerAndLogin("settings_me@sidepick.dev", "password123", "settingsUser", "20s");

        mockMvc.perform(patch("/api/users/me/account-settings")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nickname": "settingsUser2",
                                  "experienceStatus": "NO_EXPERIENCE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.nickname").value("settingsUser2"))
                .andExpect(jsonPath("$.data.user.experienceStatus").value("NO_EXPERIENCE"));
    }

    @Test
    void uploadProfileImageStoresPublicUrlAndReturnsUpdatedUser() throws Exception {
        String token = registerAndLogin("image_me@sidepick.dev", "password123", "imageUser", "20s");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                "png-bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/users/me/profile-image")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imageUrl").value(org.hamcrest.Matchers.containsString("/uploads/profile/")))
                .andExpect(jsonPath("$.data.user.profileImage").value(org.hamcrest.Matchers.containsString("/uploads/profile/")));
    }

    @Test
    void uploadProfileImageRejectsNonImageFile() throws Exception {
        String token = registerAndLogin("image_invalid@sidepick.dev", "password123", "imageInvalid", "20s");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "notes.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "not-an-image".getBytes()
        );

        mockMvc.perform(multipart("/api/users/me/profile-image")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void changePasswordAllowsLoginWithNewPassword() throws Exception {
        String token = registerAndLogin("password_me@sidepick.dev", "password123", "passwordUser", "20s");

        mockMvc.perform(patch("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "currentPassword": "password123",
                                  "newPassword": "newpass123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "password_me@sidepick.dev",
                                  "password": "newpass123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    void getMyAnalysisReportsReturnsItemsForCurrentUser() throws Exception {
        String token = registerAndLogin("analysis_me@sidepick.dev", "password123", "analysisUser", "20s");
        createExperience(token, "분석용 사례", "분석용 본문입니다.");

        mockMvc.perform(get("/api/users/me/analysis-history")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].experienceId").isNumber())
                .andExpect(jsonPath("$.data[0].title").value("분석용 사례"))
                .andExpect(jsonPath("$.data[0].reportStatus").isNotEmpty());
    }
    @Test
    void getMyBookmarksReturnsSavedExperiences() throws Exception {
        String ownerToken = registerAndLogin("bookmark_owner@sidepick.dev", "password123", "bookmarkOwner", "20s");
        String viewerToken = registerAndLogin("bookmark_viewer@sidepick.dev", "password123", "bookmarkViewer", "20s");
        long experienceId = createExperience(ownerToken, "Bookmark target", "Bookmark target content");

        mockMvc.perform(post("/api/experiences/{experienceId}/bookmarks", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(true))
                .andExpect(jsonPath("$.data.bookmarkCount").value(1));

        mockMvc.perform(get("/api/users/me/bookmarks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(experienceId))
                .andExpect(jsonPath("$.data[0].title").value("Bookmark target"));

        mockMvc.perform(delete("/api/experiences/{experienceId}/bookmarks", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(false))
                .andExpect(jsonPath("$.data.bookmarkCount").value(0));
    }

    @Test
    void getMyRecentViewsReturnsViewedExperiencesInLatestOrder() throws Exception {
        String ownerToken = registerAndLogin("view_owner@sidepick.dev", "password123", "viewOwner", "20s");
        String viewerToken = registerAndLogin("view_viewer@sidepick.dev", "password123", "viewViewer", "20s");
        long firstExperienceId = createExperience(ownerToken, "First viewed", "First viewed content");
        long secondExperienceId = createExperience(ownerToken, "Second viewed", "Second viewed content");

        mockMvc.perform(get("/api/experiences/{experienceId}", firstExperienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/experiences/{experienceId}", secondExperienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/me/recent-views")
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(secondExperienceId))
                .andExpect(jsonPath("$.data[0].title").value("Second viewed"))
                .andExpect(jsonPath("$.data[1].id").value(firstExperienceId))
                .andExpect(jsonPath("$.data[1].title").value("First viewed"));
    }

    @Test
    void getMyHomeFeedReturnsActivityBasedRecommendations() throws Exception {
        String ownerToken = registerAndLogin("home_owner@sidepick.dev", "password123", "homeOwner", "20s");
        String viewerToken = registerAndLogin("home_viewer@sidepick.dev", "password123", "homeViewer", "20s");
        long firstExperienceId = createExperience(ownerToken, "Commerce target", "Commerce content");
        long secondExperienceId = createExperience(ownerToken, "Second commerce target", "Commerce content 2");

        mockMvc.perform(post("/api/experiences/{experienceId}/bookmarks", firstExperienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/experiences/{experienceId}", secondExperienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/me/home-feed")
                        .header(HttpHeaders.AUTHORIZATION, bearer(viewerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.strategy").value("activity-based"))
                .andExpect(jsonPath("$.data.preferredCategoryIds.length()").value(1))
                .andExpect(jsonPath("$.data.experiences.length()").isNotEmpty());
    }
}
