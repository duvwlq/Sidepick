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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class AgentAService {

    private static final String STATUS_OK = "ok";
    private static final String STATUS_FALLBACK = "fallback";
    private static final String FALLBACK_MESSAGE =
            "질문 카드를 생성하지 못했어요. 그대로 저장하거나 다시 시도해 주세요.";
    private static final int QUESTION_TRIGGER_QUALITY_SCORE = 70;
    private static final List<QuestionTemplate> QUESTION_TEMPLATES = List.of(
            new QuestionTemplate("goal", "이번 글에서 얻고 싶은 결과는 무엇인가요?", "text", null, true, "예: 실패 원인 분석, 다음 시도 방향 정리"),
            new QuestionTemplate("timeline", "얼마 동안 시도했는지 알려주세요.", "select",
                    List.of("1개월 미만", "1~3개월", "3~6개월", "6개월 이상"), true, null),
            new QuestionTemplate("budget", "투입한 비용은 어느 정도였나요?", "number", null, false,
                    "대략적인 총액만 적어도 충분합니다."),
            new QuestionTemplate("target_customer", "주요 고객이나 타깃은 누구였나요?", "text", null, true, null),
            new QuestionTemplate("obstacle", "가장 크게 막혔던 지점을 적어주세요.", "tag", null, true,
                    "여러 개라면 핵심 2~3개만 적어주세요."),
            new QuestionTemplate("market", "시장 조사나 경쟁 검토는 어느 정도 했나요?", "select",
                    List.of("충분히 했다", "간단히 했다", "아직 못했다"), false, null),
            new QuestionTemplate("channel", "사용한 유입 채널을 알려주세요.", "tag", null, false,
                    "SNS, 블로그, 지인 소개처럼 적어도 됩니다."),
            new QuestionTemplate("result", "결과나 반응은 어땠나요?", "text", null, false,
                    "매출, 문의, 반응 수치 중 아는 것만 적어주세요.")
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
            DraftQualityEvaluation evaluation = evaluateDraft(body);
            List<QuestionCard> questions = evaluation.needsQuestions()
                    ? buildTemplateQuestions(body, evaluation)
                    : List.of();

            return new AnalyzeDraftResponse(
                    STATUS_OK,
                    evaluation.needsQuestions(),
                    questions,
                    evaluation.qualityScore(),
                    evaluation.missingSlots(),
                    evaluation.triggerReason(),
                    evaluation.reasonMessage(),
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
                    null,
                    List.of(),
                    null,
                    null,
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

    private DraftQualityEvaluation evaluateDraft(String body) {
        String normalized = body.toLowerCase(Locale.ROOT);
        Set<String> presentSlots = detectPresentSlots(normalized);

        List<String> coreSlots = List.of("goal", "obstacle", "result");
        List<String> supportSlots = List.of("timeline", "budget", "target_customer", "market", "channel");
        List<String> missingSlots = new ArrayList<>();

        for (String slot : coreSlots) {
            if (!presentSlots.contains(slot)) {
                missingSlots.add(slot);
            }
        }
        for (String slot : supportSlots) {
            if (!presentSlots.contains(slot)) {
                missingSlots.add(slot);
            }
        }

        int coreCovered = coreSlots.size() - (int) coreSlots.stream().filter(missingSlots::contains).count();
        int supportCovered = supportSlots.size() - (int) supportSlots.stream().filter(missingSlots::contains).count();
        int bodyScore = body.length() >= 220 ? 15 : body.length() >= 120 ? 10 : body.length() >= 60 ? 5 : 0;
        int qualityScore = Math.min(100, (coreCovered * 20) + (supportCovered * 5) + bodyScore);

        int missingCoreCount = coreSlots.size() - coreCovered;
        int missingSupportCount = supportSlots.size() - supportCovered;
        boolean needsQuestions = missingCoreCount > 0 || qualityScore < QUESTION_TRIGGER_QUALITY_SCORE;

        String triggerReason = "NONE";
        String reasonMessage = null;
        if (missingCoreCount > 0) {
            triggerReason = "MISSING_CORE_FIELDS";
            reasonMessage = "분석에 필요한 핵심 정보가 부족해 몇 가지만 더 여쭤볼게요.";
        } else if (qualityScore < 55) {
            triggerReason = "LOW_ANALYSIS_CONFIDENCE";
            reasonMessage = "초안 맥락이 아직 부족해 분석 정확도를 높일 질문을 준비했어요.";
        } else if (needsQuestions) {
            triggerReason = "INSUFFICIENT_CONTEXT";
            reasonMessage = "분석 품질을 높이기 위해 몇 가지 배경 정보를 더 확인할게요.";
        }

        int questionCount;
        if (missingCoreCount >= 2 || qualityScore < 45) {
            questionCount = 5;
        } else if (missingCoreCount == 1 || missingSupportCount >= 3 || qualityScore < 60) {
            questionCount = 4;
        } else {
            questionCount = 3;
        }

        return new DraftQualityEvaluation(
                needsQuestions,
                qualityScore,
                missingSlots,
                triggerReason,
                reasonMessage,
                questionCount
        );
    }

    private Set<String> detectPresentSlots(String normalized) {
        Set<String> presentSlots = new LinkedHashSet<>();

        if (containsAny(normalized,
                "목표", "원한", "얻고", "이유", "시작한 이유", "해보려고", "하려고", "내보려고", "수익", "늘리",
                "goal", "want")) {
            presentSlots.add("goal");
        }
        if (containsAny(normalized,
                "개월", "기간", "얼마", "한달", "두달", "세달", "timeline", "month", "week")) {
            presentSlots.add("timeline");
        }
        if (containsAny(normalized,
                "원", "만원", "비용", "투자", "광고비", "budget", "cost", "spent")) {
            presentSlots.add("budget");
        }
        if (containsAny(normalized,
                "고객", "타깃", "타겟", "직장인", "학생", "buyer", "target", "audience")) {
            presentSlots.add("target_customer");
        }
        if (containsAny(normalized,
                "어려", "문제", "막혔", "실패", "걱정", "막막", "안 돼", "안되",
                "obstacle", "problem", "issue", "stuck")) {
            presentSlots.add("obstacle");
        }
        if (containsAny(normalized,
                "시장", "조사", "경쟁", "경쟁사", "market", "research", "competitor")) {
            presentSlots.add("market");
        }
        if (containsAny(normalized,
                "광고", "마케팅", "채널", "sns", "블로그", "인스타", "인스타그램", "유튜브",
                "channel", "instagram", "youtube")) {
            presentSlots.add("channel");
        }
        if (containsAny(normalized,
                "매출", "결과", "성과", "반응", "문의", "주문", "수익", "없었", "안 나",
                "result", "outcome", "revenue")) {
            presentSlots.add("result");
        }

        return presentSlots;
    }

    private List<QuestionCard> buildTemplateQuestions(String body, DraftQualityEvaluation evaluation) {
        String normalized = body.toLowerCase(Locale.ROOT);
        List<QuestionTemplate> ranked = new ArrayList<>();

        for (String slot : evaluation.missingSlots()) {
            ranked.add(findTemplate(slot));
        }

        if (!containsAny(normalized, "개월", "month", "기간", "오래", "한달", "두달", "세달", "timeline")) {
            ranked.add(findTemplate("timeline"));
        }
        if (!containsAny(normalized, "원", "만원", "투자", "비용", "광고비", "budget")) {
            ranked.add(findTemplate("budget"));
        }
        if (!containsAny(normalized, "고객", "타깃", "타겟", "직장인", "학생", "buyer", "target")) {
            ranked.add(findTemplate("target_customer"));
        }
        if (!containsAny(normalized, "시장", "경쟁", "경쟁사", "조사", "market")) {
            ranked.add(findTemplate("market"));
        }
        if (!containsAny(normalized, "광고", "마케팅", "채널", "sns", "블로그", "인스타", "인스타그램", "유튜브")) {
            ranked.add(findTemplate("channel"));
        }
        if (!containsAny(normalized, "매출", "결과", "성과", "반응", "문의", "주문", "수익")) {
            ranked.add(findTemplate("result"));
        }

        ranked = new ArrayList<>(ranked.stream().distinct().toList());

        for (QuestionTemplate template : QUESTION_TEMPLATES) {
            if (!ranked.contains(template)) {
                ranked.add(template);
            }
        }

        return ranked.stream()
                .limit(evaluation.recommendedQuestionCount())
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

    private record DraftQualityEvaluation(
            boolean needsQuestions,
            int qualityScore,
            List<String> missingSlots,
            String triggerReason,
            String reasonMessage,
            int recommendedQuestionCount
    ) {
    }
}
