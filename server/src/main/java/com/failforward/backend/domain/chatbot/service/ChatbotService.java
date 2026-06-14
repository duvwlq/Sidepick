package com.failforward.backend.domain.chatbot.service;

import com.failforward.backend.common.config.AiServerProperties;
import com.failforward.backend.common.config.ChatbotProperties;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.AiChatbotRequest;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.AiChatbotResponse;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.ChatbotMessageRequest;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.ChatbotMessageResponse;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final String STATUS_SUCCESS = "success";
    private static final String STATUS_FALLBACK = "fallback";
    private static final String TYPE_RAG = "rag";
    private static final String TYPE_REACT = "react";
    private static final String TYPE_GUIDE_REDIRECT = "guide_redirect";
    private static final String FALLBACK_REPLY =
            "Only a simple guide is available right now. Please try again in a moment.";

    private final CurrentUserProvider currentUserProvider;
    private final ChatbotRateLimiter chatbotRateLimiter;
    private final ChatbotSafetyService chatbotSafetyService;
    private final ChatbotRequestQueue chatbotRequestQueue;
    private final ChatbotTokenBudget chatbotTokenBudget;
    @Qualifier("aiRestTemplate")
    private final RestTemplate aiRestTemplate;
    private final AiServerProperties aiServerProperties;
    private final ChatbotProperties chatbotProperties;

    public ChatbotMessageResponse sendMessage(ChatbotMessageRequest request) {
        Long userId = currentUserProvider.getCurrentUser().id();
        chatbotRateLimiter.checkLimit(userId);

        String normalizedMessage = chatbotSafetyService.validateAndNormalizeMessage(request);
        String routeHint = inferRouteHint(normalizedMessage);
        int queueSlot = chatbotRequestQueue.acquire();

        try {
            if (chatbotSafetyService.needsGuideRedirect(normalizedMessage, routeHint)) {
                return new ChatbotMessageResponse(
                        STATUS_SUCCESS,
                        "Please share more detail so I can route you to the right case or stats guide.",
                        TYPE_GUIDE_REDIRECT,
                        List.of(),
                        Map.of("fallback", false, "reason", "input_too_short"),
                        "input_too_short"
                );
            }

            chatbotTokenBudget.checkAndConsume(chatbotSafetyService.estimateTokens(normalizedMessage));
            AiChatbotResponse upstream = requestUpstream(
                    new ChatbotMessageRequest(request.sessionId(), normalizedMessage),
                    routeHint
            );
            String validationFailure = chatbotSafetyService.validateUpstream(upstream);
            if (validationFailure != null) {
                return fallback(validationFailure, routeHint);
            }

            chatbotTokenBudget.checkAndConsume(chatbotSafetyService.estimateTokens(upstream.reply()));
            return new ChatbotMessageResponse(
                    upstream.status() == null || upstream.status().isBlank() ? STATUS_SUCCESS : upstream.status(),
                    upstream.reply(),
                    upstream.type() == null || upstream.type().isBlank() ? routeHint : upstream.type(),
                    upstream.sources() == null ? List.of() : upstream.sources(),
                    upstream.explanation(),
                    upstream.reason()
            );
        } catch (RestClientException exception) {
            log.warn("chatbot_upstream_error routeHint={} detail={}", routeHint, exception.getMessage());
            return fallback("upstream_error", routeHint);
        } finally {
            chatbotRequestQueue.release(queueSlot);
        }
    }

    private AiChatbotResponse requestUpstream(ChatbotMessageRequest request, String routeHint) {
        String endpoint = aiServerProperties.url() + "/chatbot/message";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AiChatbotRequest> entity = new HttpEntity<>(AiChatbotRequest.from(request, routeHint), headers);
        return aiRestTemplate.postForObject(endpoint, entity, AiChatbotResponse.class);
    }

    private ChatbotMessageResponse fallback(String reason, String routeHint) {
        return new ChatbotMessageResponse(
                STATUS_FALLBACK,
                FALLBACK_REPLY,
                TYPE_GUIDE_REDIRECT.equals(routeHint) ? TYPE_RAG : routeHint,
                List.of(),
                Map.of("fallback", true),
                reason
        );
    }

    private String inferRouteHint(String message) {
        String normalized = message == null ? "" : message.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return TYPE_RAG;
        }
        if (containsAny(normalized,
                "compare", "stats", "similar", "analysis", "case",
                "비교", "통계", "유사", "분석", "사례")) {
            return TYPE_REACT;
        }
        if (containsAny(normalized,
                "guide", "help", "how", "what",
                "가이드", "도움", "어떻게", "무엇")) {
            return TYPE_GUIDE_REDIRECT;
        }
        return normalized.length() < chatbotProperties.minimumGuideMessageLength() ? TYPE_RAG : TYPE_REACT;
    }

    private boolean containsAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
