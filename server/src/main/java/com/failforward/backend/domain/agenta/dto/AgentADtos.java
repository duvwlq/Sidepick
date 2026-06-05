package com.failforward.backend.domain.agenta.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public final class AgentADtos {

    private AgentADtos() {
    }

    public record AnalyzeDraftRequest(
            DraftPayload draft
    ) {
    }

    public record DraftPayload(
            @JsonProperty("category_slug")
            String categorySlug,
            String body,
            String title,
            String tone,
            String audience
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AnalyzeDraftResponse(
            String status,
            @JsonProperty("needs_questions")
            boolean needsQuestions,
            List<QuestionCard> questions,
            Meta meta,
            String message
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record QuestionCard(
            String slot,
            String question,
            @JsonProperty("input_type")
            String inputType,
            List<String> options,
            boolean required,
            String hint
    ) {
    }

    public record Meta(
            @JsonProperty("input_tokens")
            int inputTokens,
            @JsonProperty("output_tokens")
            int outputTokens,
            @JsonProperty("elapsed_ms")
            long elapsedMs,
            @JsonProperty("used_template")
            boolean usedTemplate
    ) {
    }
}
