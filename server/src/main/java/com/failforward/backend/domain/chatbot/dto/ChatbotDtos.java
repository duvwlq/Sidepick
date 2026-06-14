package com.failforward.backend.domain.chatbot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public final class ChatbotDtos {

    private ChatbotDtos() {
    }

    public record ChatbotMessageRequest(
            @JsonProperty("session_id")
            @NotBlank
            String sessionId,
            @NotBlank
            String message
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ChatbotMessageResponse(
            String status,
            String reply,
            String type,
            List<String> sources,
            Map<String, Object> explanation,
            String reason
    ) {
    }

    public record AiChatbotRequest(
            @JsonProperty("session_id")
            String sessionId,
            String message,
            @JsonProperty("route_hint")
            String routeHint
    ) {
        public static AiChatbotRequest from(ChatbotMessageRequest request, String routeHint) {
            return new AiChatbotRequest(request.sessionId(), request.message(), routeHint);
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AiChatbotResponse(
            String reply,
            String type,
            List<String> sources,
            Map<String, Object> explanation,
            String status,
            String reason
    ) {
    }
}
