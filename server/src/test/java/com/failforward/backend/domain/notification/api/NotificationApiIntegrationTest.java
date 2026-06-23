package com.failforward.backend.domain.notification.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NotificationApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void likingExperienceCreatesNotificationAndCanBeMarkedRead() throws Exception {
        String ownerToken = registerAndLogin("notice_owner@sidepick.dev", "password123", "noticeOwner", "20s");
        String actorToken = registerAndLogin("notice_actor@sidepick.dev", "password123", "noticeActor", "20s");
        long experienceId = createExperience(ownerToken, "Notification target", "Notification target content");

        mockMvc.perform(post("/api/experiences/{experienceId}/reactions", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(actorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reactionType": "HEART"
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult listResult = mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].type").value("EXPERIENCE_LIKE"))
                .andExpect(jsonPath("$.data.items[0].targetType").value("EXPERIENCE"))
                .andExpect(jsonPath("$.data.items[0].targetId").value(experienceId))
                .andExpect(jsonPath("$.data.items[0].isRead").value(false))
                .andReturn();

        long notificationId = objectMapper.readTree(listResult.getResponse().getContentAsString())
                .path("data")
                .path("items")
                .get(0)
                .path("id")
                .asLong();

        mockMvc.perform(patch("/api/notifications/{notificationId}/read", notificationId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead").value(true));

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken))
                        .param("read", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].isRead").value(true));
    }

    @Test
    void selfLikeDoesNotCreateNotificationAndRepeatLikeDoesNotDuplicate() throws Exception {
        String ownerToken = registerAndLogin("notice_self@sidepick.dev", "password123", "noticeSelf", "20s");
        String actorToken = registerAndLogin("notice_repeat@sidepick.dev", "password123", "noticeRepeat", "20s");

        long selfExperienceId = createExperience(ownerToken, "Self target", "Self target content");
        long otherExperienceId = createExperience(ownerToken, "Repeat target", "Repeat target content");

        mockMvc.perform(post("/api/experiences/{experienceId}/reactions", selfExperienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reactionType": "HEART"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/experiences/{experienceId}/reactions", otherExperienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(actorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reactionType": "HEART"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/experiences/{experienceId}/reactions", otherExperienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(actorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reactionType": "HEART"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1));
    }

    @Test
    void bookmarkingExperienceCreatesBookmarkNotification() throws Exception {
        String ownerToken = registerAndLogin("notice_bookmark_owner@sidepick.dev", "password123", "noticeBookmarkOwner", "20s");
        String actorToken = registerAndLogin("notice_bookmark_actor@sidepick.dev", "password123", "noticeBookmarkActor", "20s");
        long experienceId = createExperience(ownerToken, "Bookmark target", "Bookmark target content");

        mockMvc.perform(post("/api/experiences/{experienceId}/bookmarks", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(actorToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].type").value("EXPERIENCE_BOOKMARK"))
                .andExpect(jsonPath("$.data.items[0].targetType").value("EXPERIENCE"))
                .andExpect(jsonPath("$.data.items[0].targetId").value(experienceId))
                .andExpect(jsonPath("$.data.items[0].isRead").value(false));
    }
}
