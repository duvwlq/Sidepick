package com.failforward.backend.domain.bookmark.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookmarkApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void bookmarkStatusTracksCreateReadAndDeleteWithoutDuplicateCounts() throws Exception {
        String ownerToken = registerAndLogin("bookmark_owner@sidepick.dev", "password123", "bookmarkOwner", "20s");
        String bookmarkerToken = registerAndLogin("bookmark_user@sidepick.dev", "password123", "bookmarkUser", "20s");
        long experienceId = createExperience(ownerToken, "Bookmark target", "Bookmark target content");

        mockMvc.perform(get("/api/experiences/{experienceId}/bookmarks/me", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(bookmarkerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(false))
                .andExpect(jsonPath("$.data.bookmarkCount").value(0));

        mockMvc.perform(post("/api/experiences/{experienceId}/bookmarks", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(bookmarkerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(true))
                .andExpect(jsonPath("$.data.bookmarkCount").value(1));

        mockMvc.perform(post("/api/experiences/{experienceId}/bookmarks", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(bookmarkerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(true))
                .andExpect(jsonPath("$.data.bookmarkCount").value(1));

        mockMvc.perform(get("/api/experiences/{experienceId}/bookmarks/me", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(bookmarkerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(true))
                .andExpect(jsonPath("$.data.bookmarkCount").value(1));

        mockMvc.perform(delete("/api/experiences/{experienceId}/bookmarks", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(bookmarkerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(false))
                .andExpect(jsonPath("$.data.bookmarkCount").value(0));

        mockMvc.perform(get("/api/experiences/{experienceId}/bookmarks/me", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(bookmarkerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(false))
                .andExpect(jsonPath("$.data.bookmarkCount").value(0));
    }
}
