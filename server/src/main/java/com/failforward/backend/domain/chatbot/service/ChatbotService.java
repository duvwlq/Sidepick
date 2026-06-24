package com.failforward.backend.domain.chatbot.service;

import com.failforward.backend.common.config.AiServerProperties;
import com.failforward.backend.common.config.ChatbotProperties;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.AnalysisReportResponse;
import com.failforward.backend.domain.analysis.service.AIAnalysisService;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.AiChatbotRequest;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.AiChatbotResponse;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.ChatbotMessageRequest;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.ChatbotMessageResponse;
import java.util.LinkedHashMap;
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
            "지금은 답변을 바로 정리하지 못하고 있어요. 잠시 후 다시 시도해 주세요.";
    private static final String GUIDE_REDIRECT_REPLY =
            "원하시는 방향은 이해했어요. 가능하면 현재 상황, 쓸 수 있는 시간, 예산, 관심 분야를 두세 문장만 더 적어주시면 더 정확하게 안내해드릴게요.";

    private final CurrentUserProvider currentUserProvider;
    private final ChatbotRateLimiter chatbotRateLimiter;
    private final ChatbotSafetyService chatbotSafetyService;
    private final ChatbotRequestQueue chatbotRequestQueue;
    private final ChatbotTokenBudget chatbotTokenBudget;
    @Qualifier("aiRestTemplate")
    private final RestTemplate aiRestTemplate;
    private final AiServerProperties aiServerProperties;
    private final ChatbotProperties chatbotProperties;
    private final AIAnalysisService aiAnalysisService;

    public ChatbotMessageResponse sendMessage(ChatbotMessageRequest request) {
        Long userId = currentUserProvider.getCurrentUser().id();
        chatbotRateLimiter.checkLimit(userId);

        String normalizedMessage = chatbotSafetyService.validateAndNormalizeMessage(request);
        String routeHint = inferRouteHint(normalizedMessage);
        Map<String, Object> analysisContext = buildAnalysisContext(request.experienceId());
        int queueSlot = chatbotRequestQueue.acquire();

        try {
            if (chatbotSafetyService.needsGuideRedirect(normalizedMessage, routeHint)) {
                return new ChatbotMessageResponse(
                        STATUS_SUCCESS,
                        GUIDE_REDIRECT_REPLY,
                        TYPE_GUIDE_REDIRECT,
                        List.of(),
                        Map.of("fallback", false, "reason", "input_too_short"),
                        "input_too_short"
                );
            }

            chatbotTokenBudget.checkAndConsume(chatbotSafetyService.estimateTokens(normalizedMessage));
            AiChatbotResponse upstream = requestUpstream(
                    new ChatbotMessageRequest(request.sessionId(), request.experienceId(), normalizedMessage),
                    routeHint,
                    analysisContext
            );
            String validationFailure = chatbotSafetyService.validateUpstream(upstream);
            if (validationFailure != null) {
                return fallback(validationFailure, routeHint, analysisContext);
            }

            chatbotTokenBudget.checkAndConsume(chatbotSafetyService.estimateTokens(upstream.reply()));
            Map<String, Object> explanation = new LinkedHashMap<>();
            if (upstream.explanation() != null) {
                explanation.putAll(upstream.explanation());
            }
            if (!analysisContext.isEmpty()) {
                explanation.put("analysisContextUsed", true);
                explanation.put("analysisContext", analysisContext);
            }
            return new ChatbotMessageResponse(
                    upstream.status() == null || upstream.status().isBlank() ? STATUS_SUCCESS : upstream.status(),
                    upstream.reply(),
                    upstream.type() == null || upstream.type().isBlank() ? routeHint : upstream.type(),
                    upstream.sources() == null ? List.of() : upstream.sources(),
                    explanation.isEmpty() ? null : explanation,
                    upstream.reason()
            );
        } catch (RestClientException exception) {
            log.warn("chatbot_upstream_error routeHint={} detail={}", routeHint, exception.getMessage());
            return fallback("upstream_error", routeHint, analysisContext);
        } finally {
            chatbotRequestQueue.release(queueSlot);
        }
    }

    private AiChatbotResponse requestUpstream(
            ChatbotMessageRequest request,
            String routeHint,
            Map<String, Object> analysisContext
    ) {
        String endpoint = chatbotEndpoint();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AiChatbotRequest> entity =
                new HttpEntity<>(AiChatbotRequest.from(request, routeHint, analysisContext), headers);
        return aiRestTemplate.postForObject(endpoint, entity, AiChatbotResponse.class);
    }

    private String chatbotEndpoint() {
        String baseUrl = aiServerProperties.url();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        if (baseUrl.endsWith("/api")) {
            return baseUrl + "/chatbot/message";
        }
        return baseUrl + "/api/chatbot/message";
    }

    private ChatbotMessageResponse fallback(String reason, String routeHint, Map<String, Object> analysisContext) {
        String reply = FALLBACK_REPLY;
        if (!analysisContext.isEmpty()) {
            Object summary = analysisContext.get("summary");
            if (summary instanceof String text && !text.isBlank()) {
                reply = "현재는 간단한 안내만 가능하지만 등록된 분석 기준으로 보면 " + text;
            }
        }
        Map<String, Object> explanation = new LinkedHashMap<>();
        explanation.put("fallback", true);
        if (!analysisContext.isEmpty()) {
            explanation.put("analysisContextUsed", true);
            explanation.put("analysisContext", analysisContext);
        }
        return new ChatbotMessageResponse(
                STATUS_FALLBACK,
                reply,
                TYPE_GUIDE_REDIRECT.equals(routeHint) ? TYPE_RAG : routeHint,
                List.of(),
                explanation,
                reason
        );
    }

    private Map<String, Object> buildAnalysisContext(Long experienceId) {
        if (experienceId == null) {
            return Map.of();
        }
        try {
            AnalysisReportResponse report = aiAnalysisService.getReport(experienceId);
            if (!"READY".equalsIgnoreCase(report.reportStatus())) {
                return Map.of();
            }
            Map<String, Object> context = new LinkedHashMap<>();
            context.put("summary", report.summary());
            context.put("failureCategory", report.failureCategory());
            context.put("keywords", report.keywords() == null ? List.of() : report.keywords().stream().limit(4).toList());
            context.put("advice", report.advice() == null ? List.of() : report.advice().stream().limit(2).toList());
            context.put("matchedPatterns", report.explanation() == null || report.explanation().matchedPatterns() == null
                    ? List.of()
                    : report.explanation().matchedPatterns().stream().limit(3).toList());
            context.put("similarCases", report.similarCases() == null
                    ? List.of()
                    : report.similarCases().stream()
                            .map(item -> item.title() == null ? item.caseId() : item.title())
                            .limit(2)
                            .toList());
            return context;
        } catch (Exception exception) {
            log.debug("chatbot_analysis_context_unavailable experienceId={} detail={}", experienceId, exception.getMessage());
            return Map.of();
        }
    }

    private String inferRouteHint(String message) {
        String normalized = message == null ? "" : message.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return TYPE_RAG;
        }
        if (containsGuideIntent(normalized) || chatbotSafetyService.hasExplicitQuestionIntent(normalized)) {
            return TYPE_RAG;
        }
        if (containsAny(normalized,
                "compare", "stats", "similar", "analysis", "case",
                "비교", "통계", "유사", "분석", "사례")) {
            return TYPE_REACT;
        }
        return normalized.length() < chatbotProperties.minimumGuideMessageLength() ? TYPE_RAG : TYPE_REACT;
    }

    private boolean containsGuideIntent(String message) {
        return containsAny(message,
                "guide", "help", "how", "what", "start", "begin", "first", "recommend", "possible",
                "가이드", "도움", "어떻게", "무엇", "뭐부터", "어디서부터", "시작", "처음", "초기",
                "추천", "가능", "할까요", "찾고 싶", "있을까요", "현실적");
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
