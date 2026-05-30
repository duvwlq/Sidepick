package com.failforward.backend.domain.reaction.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.reaction.dto.ReactionDtos.ReactionRequest;
import com.failforward.backend.domain.reaction.dto.ReactionDtos.ReactionSummaryResponse;
import com.failforward.backend.domain.reaction.entity.ReactionType;
import com.failforward.backend.domain.reaction.service.ReactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping("/api/experiences/{experienceId}/reactions")
    public ApiResponse<ReactionSummaryResponse> react(
            @PathVariable Long experienceId,
            @Valid @RequestBody ReactionRequest request
    ) {
        return ApiResponse.ok("Reaction saved.", reactionService.react(experienceId, request.reactionType()));
    }

    @DeleteMapping("/api/experiences/{experienceId}/reactions/{reactionType}")
    public ApiResponse<ReactionSummaryResponse> unreact(
            @PathVariable Long experienceId,
            @PathVariable ReactionType reactionType
    ) {
        return ApiResponse.ok("Reaction removed.", reactionService.unreact(experienceId, reactionType));
    }

    @GetMapping("/api/experiences/{experienceId}/reactions/me")
    public ApiResponse<ReactionSummaryResponse> getSummary(@PathVariable Long experienceId) {
        return ApiResponse.ok("Reaction summary loaded.", reactionService.getSummary(experienceId));
    }
}
