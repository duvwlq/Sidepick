package com.failforward.backend.domain.reaction.api;

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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReactionApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void reactAndUnreactUpdatesSummaryWithoutDuplicatingCounts() throws Exception {
        String ownerToken = registerAndLogin("reaction_owner@sidepick.dev", "password123", "reactionOwner", "20s");
        String reactorToken = registerAndLogin("reaction_user@sidepick.dev", "password123", "reactionUser", "20s");
        long experienceId = createExperience(ownerToken, "Reaction target", "Reaction target content");

        mockMvc.perform(post("/api/experiences/{experienceId}/reactions", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(reactorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reactionType": "HEART"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.heartCount").value(1))
                .andExpect(jsonPath("$.data.tearCount").value(0))
                .andExpect(jsonPath("$.data.myReactions[0]").value("HEART"));

        mockMvc.perform(post("/api/experiences/{experienceId}/reactions", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(reactorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reactionType": "HEART"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.heartCount").value(1));

        mockMvc.perform(post("/api/experiences/{experienceId}/reactions", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(reactorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reactionType": "TEAR"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.heartCount").value(1))
                .andExpect(jsonPath("$.data.tearCount").value(1));

        mockMvc.perform(get("/api/experiences/{experienceId}/reactions/me", experienceId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(reactorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.heartCount").value(1))
                .andExpect(jsonPath("$.data.tearCount").value(1));

        mockMvc.perform(delete("/api/experiences/{experienceId}/reactions/{reactionType}", experienceId, "HEART")
                        .header(HttpHeaders.AUTHORIZATION, bearer(reactorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.heartCount").value(0))
                .andExpect(jsonPath("$.data.tearCount").value(1));
    }
}
