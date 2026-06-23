package com.failforward.backend.domain.agenta.service;

import com.failforward.backend.common.api.InvalidRequestException;
import com.failforward.backend.common.config.AgentAProperties;
import com.failforward.backend.common.config.AiServerProperties;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.agenta.dto.AgentADtos.AnalyzeDraftRequest;
import com.failforward.backend.domain.agenta.dto.AgentADtos.AnalyzeDraftResponse;
import com.failforward.backend.domain.agenta.dto.AgentADtos.Meta;
import com.failforward.backend.domain.agenta.dto.AgentADtos.QuestionCard;
import com.failforward.backend.domain.category.CategoryMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class AgentAService {

    private static final String STATUS_OK = "ok";
    private static final String STATUS_FALLBACK = "fallback";
    private static final String FALLBACK_MESSAGE =
            "질문 카드를 준비하지 못했어요. 그대로 저장하거나 잠시 후 다시 시도해 주세요.";
    private static final int QUESTION_TRIGGER_BODY_LENGTH = 180;
    private static final List<QuestionTemplate> QUESTION_TEMPLATES = List.of(
            new QuestionTemplate("goal", "이번 글에서 얻고 싶은 결과는 무엇인가요?", "text", null, true, "예: 실패 원인 분석, 다음 시도 방향 정리"),
            new QuestionTemplate("timeline", "이 경험을 얼마나 오래 시도했는지 알려주세요.", "select",
                    List.of("1개월 이내", "1~3개월", "3~6개월", "6개월 이상"), true, null),
            new QuestionTemplate("budget", "지금까지 총 들어간 비용은 어느 정도였나요?", "number", null, false,
                    "대략적인 금액만 적어도 괜찮습니다."),
            new QuestionTemplate("target_customer", "주요 고객이나 타깃은 누구였나요?", "text", null, true, null),
            new QuestionTemplate("obstacle", "가장 크게 막혔던 문제를 짧게 적어주세요.", "tag", null, true,
                    "핵심 문제를 2~3개 정도 적어주세요."),
            new QuestionTemplate("market", "시장 조사나 경쟁 분석은 어느 정도 했나요?", "select",
                    List.of("충분히 했다", "조금만 했다", "거의 안 했다"), false, null),
            new QuestionTemplate("channel", "시도했던 홍보 채널을 알려주세요.", "tag", null, false,
                    "SNS, 블로그, 지인 소개처럼 적어도 괜찮습니다."),
            new QuestionTemplate("result", "매출이나 반응은 어땠나요?", "text", null, false,
                    "수익, 문의, 클릭 같은 결과를 적어주세요.")
    );


    private final CurrentUserProvider currentUserProvider;
    private final AgentARateLimiter rateLimiter;
    private final AgentAProperties properties;
    private final RestTemplate aiRestTemplate;
    private final AiServerProperties aiServerProperties;

    public AgentAService(
            CurrentUserProvider currentUserProvider,
            AgentARateLimiter rateLimiter,
            AgentAProperties properties,
            @Qualifier("aiRestTemplate") RestTemplate aiRestTemplate,
            AiServerProperties aiServerProperties
    ) {
        this.currentUserProvider = currentUserProvider;
        this.rateLimiter = rateLimiter;
        this.properties = properties;
        this.aiRestTemplate = aiRestTemplate;
        this.aiServerProperties = aiServerProperties;
    }

    public AnalyzeDraftResponse analyzeDraft(AnalyzeDraftRequest request) {
        validateRequest(request);

        Long userId = currentUserProvider.getCurrentUser().id();
        rateLimiter.checkLimit(userId);

        long startedAt = System.currentTimeMillis();
        try {
            AnalyzeDraftResponse upstream = requestAiAgentA(request);
            if (upstream != null) {
                return upstream;
            }
        } catch (AssertionError | RestClientException exception) {
            // fall through to local fallback
        }

        try {
            String body = request.draft().body().trim();
            boolean needsQuestions = body.length() < QUESTION_TRIGGER_BODY_LENGTH;
            List<QuestionCard> questions = needsQuestions ? buildTemplateQuestions(body) : List.of();

            return new AnalyzeDraftResponse(
                    STATUS_OK,
                    needsQuestions,
                    questions,
                    new Meta(
                            estimateTokens(body.length()),
                            estimateOutputTokens(questions),
                            System.currentTimeMillis() - startedAt,
                            true,
                            null,
                            null,
                            null,
                            false
                    ),
                    needsQuestions ? null : "초안이 충분해 보여서 추가 질문 없이 바로 분석할 수 있어요."
            );
        } catch (RuntimeException exception) {
            return new AnalyzeDraftResponse(
                    STATUS_FALLBACK,
                    false,
                    List.of(),
                    new Meta(
                            0,
                            0,
                            Math.min(System.currentTimeMillis() - startedAt, properties.timeoutSec() * 1000L),
                            true,
                            null,
                            null,
                            null,
                            false
                    ),
                    FALLBACK_MESSAGE
            );
        }
    }

    private AnalyzeDraftResponse requestAiAgentA(AnalyzeDraftRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AnalyzeDraftRequest> entity = new HttpEntity<>(request, headers);
        return aiRestTemplate.postForObject(
                aiServerProperties.url() + "/agent-a/analyze-draft",
                entity,
                AnalyzeDraftResponse.class
        );
    }

    private void validateRequest(AnalyzeDraftRequest request) {
        if (request == null || request.draft() == null) {
            throw new InvalidRequestException("draft is required.");
        }
        if (request.draft().categorySlug() == null || request.draft().categorySlug().isBlank()) {
            throw new InvalidRequestException("draft.category_slug is required.");
        }
        if (CategoryMapper.toKorean(request.draft().categorySlug()).isEmpty()) {
            throw new InvalidRequestException("draft.category_slug is invalid.");
        }
        if (request.draft().body() == null || request.draft().body().isBlank()) {
            throw new InvalidRequestException("draft.body is required.");
        }
    }

    private List<QuestionCard> buildTemplateQuestions(String body) {
        String normalized = body.toLowerCase(Locale.ROOT);
        List<QuestionTemplate> ranked = new ArrayList<>();

        ranked.add(findTemplate("goal"));
        ranked.add(findTemplate("obstacle"));

        if (!containsAny(normalized, "개월", "month", "기간", "동안", "timeline")) {
            ranked.add(findTemplate("timeline"));
        }
        if (!containsAny(normalized, "돈", "비용", "예산", "지출", "budget")) {
            ranked.add(findTemplate("budget"));
        }
        if (!containsAny(normalized, "고객", "타깃", "대상", "buyer", "target")) {
            ranked.add(findTemplate("target_customer"));
        }
        if (!containsAny(normalized, "시장", "경쟁", "분석", "market")) {
            ranked.add(findTemplate("market"));
        }
        if (!containsAny(normalized, "홍보", "채널", "sns", "블로그")) {
            ranked.add(findTemplate("channel"));
        }
        if (!containsAny(normalized, "매출", "수익", "반응", "결과")) {
            ranked.add(findTemplate("result"));
        }

        for (QuestionTemplate template : QUESTION_TEMPLATES) {
            if (!ranked.contains(template)) {
                ranked.add(template);
            }
        }

        int questionCount = body.length() < 90 ? 5 : body.length() < 140 ? 4 : 3;
        return ranked.stream()
                .limit(questionCount)
                .map(QuestionTemplate::toQuestionCard)
                .toList();
    }

    private QuestionTemplate findTemplate(String slot) {
        return QUESTION_TEMPLATES.stream()
                .filter(template -> template.slot().equals(slot))
                .findFirst()
                .orElseThrow();
    }

    private boolean containsAny(String body, String... keywords) {
        for (String keyword : keywords) {
            if (body.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private int estimateTokens(int textLength) {
        return Math.max(1, (int) Math.ceil(textLength / 4.0));
    }

    private int estimateOutputTokens(List<QuestionCard> questions) {
        int totalCharacters = questions.stream()
                .mapToInt(question -> question.question().length() + (question.hint() == null ? 0 : question.hint().length()))
                .sum();
        return questions.isEmpty() ? 0 : Math.max(1, (int) Math.ceil(totalCharacters / 4.0));
    }

    private record QuestionTemplate(
            String slot,
            String question,
            String inputType,
            List<String> options,
            boolean required,
            String hint
    ) {
        private QuestionCard toQuestionCard() {
            return new QuestionCard(slot, question, inputType, options, required, hint);
        }
    }
}
