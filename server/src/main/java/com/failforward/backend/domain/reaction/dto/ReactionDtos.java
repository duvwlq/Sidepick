package com.failforward.backend.domain.reaction.dto;

import com.failforward.backend.domain.reaction.entity.ReactionType;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class ReactionDtos {

    private ReactionDtos() {
    }

    public record ReactionRequest(
            @NotNull ReactionType reactionType
    ) {
    }

    public record ReactionSummaryResponse(
            Long experienceId,
            long heartCount,
            long tearCount,
            List<ReactionType> myReactions
    ) {
    }
}
