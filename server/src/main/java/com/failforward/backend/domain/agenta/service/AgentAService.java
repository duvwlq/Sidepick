package com.failforward.backend.domain.agenta.service;

import com.failforward.backend.common.api.InvalidRequestException;
import com.failforward.backend.common.config.AgentAProperties;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.agenta.dto.AgentADtos.AnalyzeDraftRequest;
import com.failforward.backend.domain.agenta.dto.AgentADtos.AnalyzeDraftResponse;
import com.failforward.backend.domain.agenta.dto.AgentADtos.Meta;
import com.failforward.backend.domain.agenta.dto.AgentADtos.QuestionCard;
import com.failforward.backend.domain.category.CategoryMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AgentAService {

    private static final String STATUS_OK = "ok";
    private static final String STATUS_FALLBACK = "fallback";
    private static final String FALLBACK_MESSAGE =
            "질문 카드를 생성하지 못했어요. 그대로 저장하시거나 다시 시도해주세요.";
    private static final int QUESTION_TRIGGER_BODY_LENGTH = 180;
    private static final List<QuestionTemplate> QUESTION_TEMPLATES = List.of(
            new QuestionTemplate("goal", "이번 글에서 얻고 싶은 결과는?", "text", null, true, "예: 실패 원인 분석, 방향 점검"),
            new QuestionTemplate("timeline", "얼마 동안 시도했는지 알려주세요.", "select",
                    List.of("1개월 미만", "1~3개월", "3~6개월", "6개월 이상"), true, null),
            new QuestionTemplate("budget", "투입한 비용은 어느 정도였나요?", "number", null, false,
                    "대략적인 총액만 적어도 충분합니다."),
            new QuestionTemplate("target_customer", "주요 고객이나 타깃은 누구였나요?", "text", null, true, null),
            new QuestionTemplate("obstacle", "가장 크게 막혔던 지점을 적어주세요.", "tag", null, true,
                    "여러 개라면 핵심 2~3개만 적어주세요."),
            new QuestionTemplate("market", "시장 조사나 경쟁 검토는 했나요?", "select",
                    List.of("충분히 했다", "간단히 했다", "아직 못했다"), false, null),
            new QuestionTemplate("channel", "활용한 유입 채널을 알려주세요.", "tag", null, false,
                    "SNS, 블로그, 지인 소개처럼 적어도 됩니다."),
            new QuestionTemplate("result", "임시 결과나 반응은 어땠나요?", "text", null, false,
                    "매출, 문의, 반응 수치 중 아는 정도만 적어주세요.")
    );

    private final CurrentUserProvider currentUserProvider;
    private final AgentARateLimiter rateLimiter;
    private final AgentAProperties properties;

    public AgentAService(
            CurrentUserProvider currentUserProvider,
            AgentARateLimiter rateLimiter,
            AgentAProperties properties
    ) {
        this.currentUserProvider = currentUserProvider;
        this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    public AnalyzeDraftResponse analyzeDraft(AnalyzeDraftRequest request) {
        validateRequest(request);

        Long userId = currentUserProvider.getCurrentUser().id();
        rateLimiter.checkLimit(userId);

        long startedAt = System.currentTimeMillis();
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
                            true
                    ),
                    null
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
                            true
                    ),
                    FALLBACK_MESSAGE
            );
        }
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

        if (!containsAny(normalized, "개월", "month", "기간", "오래", "timeline")) {
            ranked.add(findTemplate("timeline"));
        }
        if (!containsAny(normalized, "원", "만원", "투자", "비용", "budget")) {
            ranked.add(findTemplate("budget"));
        }
        if (!containsAny(normalized, "고객", "타깃", "타겟", "buyer", "target")) {
            ranked.add(findTemplate("target_customer"));
        }
        if (!containsAny(normalized, "시장", "경쟁", "조사", "market")) {
            ranked.add(findTemplate("market"));
        }
        if (!containsAny(normalized, "광고", "마케팅", "채널", "sns", "블로그")) {
            ranked.add(findTemplate("channel"));
        }
        if (!containsAny(normalized, "매출", "결과", "성과", "반응", "문의")) {
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
