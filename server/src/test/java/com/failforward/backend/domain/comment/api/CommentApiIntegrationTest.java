package com.failforward.backend.domain.comment.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class CommentApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void createCommentWithoutAuthReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/experiences/{experienceId}/comments", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Anonymous comment",
                                  "parentId": null
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("UNAUTHORIZED"));
    }

    @Test
    void authenticatedUserCanCreateReplyUpdateAndDeleteComment() throws Exception {
        String token = registerAndLogin("comment_test@sidepick.dev", "password123", "commentUser", "20s");
        long experienceId = createExperience(token, "Comment target", "This experience is used to verify comment endpoints.");

        MvcResult createCommentResult = mockMvc.perform(post("/api/experiences/{experienceId}/comments", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Top level comment",
                                  "parentId": null
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.experienceId").value(experienceId))
                .andExpect(jsonPath("$.data.content").value("Top level comment"))
                .andReturn();

        long commentId = readId(createCommentResult);

        mockMvc.perform(post("/api/comments/{commentId}/replies", commentId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Reply comment",
                                  "parentId": null
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.parentId").value(commentId))
                .andExpect(jsonPath("$.data.content").value("Reply comment"));

        mockMvc.perform(patch("/api/comments/{commentId}", commentId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Updated top level comment",
                                  "parentId": null
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Updated top level comment"));

        mockMvc.perform(delete("/api/comments/{commentId}", commentId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}
