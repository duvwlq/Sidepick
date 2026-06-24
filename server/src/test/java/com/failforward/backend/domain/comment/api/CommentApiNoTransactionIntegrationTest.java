package com.failforward.backend.domain.comment.api;

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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommentApiNoTransactionIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void updateCommentWorksOutsideTestTransaction() throws Exception {
        String token = registerAndLogin("comment_no_tx@sidepick.dev", "password123", "commentNoTx", "20s");
        long experienceId = createExperience(token, "Comment no transaction target", "This experience verifies patch without test transaction.");

        MvcResult createCommentResult = mockMvc.perform(post("/api/experiences/{experienceId}/comments", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Comment before update",
                                  "parentId": null
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long commentId = readId(createCommentResult);

        mockMvc.perform(patch("/api/comments/{commentId}", commentId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Comment after update",
                                  "parentId": null
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(commentId))
                .andExpect(jsonPath("$.data.content").value("Comment after update"))
                .andExpect(jsonPath("$.data.author.nickname").value("commentNoTx"))
                .andExpect(jsonPath("$.data.author.email").doesNotExist())
                .andExpect(jsonPath("$.data.author.fullName").doesNotExist())
                .andExpect(jsonPath("$.data.author.birthDate").doesNotExist());
    }
}
