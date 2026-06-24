package com.failforward.backend.domain.chatbot.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.config.ChatbotProperties;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.AiChatbotResponse;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.ChatbotMessageRequest;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatbotSafetyService {

    private static final List<String> BANNED_INPUT_PHRASES = List.of(
            "guaranteed profit",
            "100% success",
            "bypass safety",
            "ignore policy",
            "jailbreak"
    );
    private static final List<String> BANNED_OUTPUT_PHRASES = List.of(
            "guaranteed",
            "100%",
            "must succeed",
            "definitely works"
    );

    private final ChatbotProperties properties;
    private final FailureExperienceRepository experienceRepository;

    public String validateAndNormalizeMessage(ChatbotMessageRequest request) {
        String normalized = request.message() == null ? "" : request.message().trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("message is required.");
        }
        if (normalized.length() > properties.maxMessageLength()) {
            throw new BadRequestException("message is too long.");
        }
        if (containsBannedPhrase(normalized, BANNED_INPUT_PHRASES)) {
            throw new BadRequestException("message contains blocked content.");
        }
        return normalized;
    }

    public boolean needsGuideRedirect(String message, String routeHint) {
        return message.length() < properties.minimumGuideMessageLength()
                && "rag".equals(routeHint)
                && !hasExplicitQuestionIntent(message);
    }

    public boolean hasExplicitQuestionIntent(String message) {
        String normalized = message == null ? "" : message.toLowerCase(Locale.ROOT);
        if (normalized.contains("?") || normalized.contains("？")) {
            return true;
        }
        return containsBannedPhrase(normalized, List.of(
                "how", "what", "start", "begin", "recommend", "possible", "should i", "can i",
                "어떻게", "뭐부터", "무엇", "추천", "가능", "시작", "병행", "현실적", "찾고 싶"
        ));
    }

    public String validateUpstream(AiChatbotResponse response) {
        if (response == null || response.reply() == null || response.reply().isBlank()) {
            return "empty_response";
        }
        if (containsBannedPhrase(response.reply(), BANNED_OUTPUT_PHRASES)) {
            return "blocked_output";
        }
        if (response.sources() == null) {
            return null;
        }

        for (String source : response.sources()) {
            if (source == null || source.isBlank()) {
                return "invalid_source";
            }
            Long caseId = extractCaseId(source);
            if (caseId != null && !experienceRepository.existsById(caseId)) {
                return "invalid_source";
            }
        }
        return null;
    }

    public int estimateTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }

    private boolean containsBannedPhrase(String value, List<String> phrases) {
        String normalized = value.toLowerCase(Locale.ROOT);
        return phrases.stream().anyMatch(normalized::contains);
    }

    private Long extractCaseId(String source) {
        if (source.chars().allMatch(Character::isDigit)) {
            return Long.parseLong(source);
        }
        if (source.startsWith("case_")) {
            String suffix = source.substring("case_".length());
            if (!suffix.isBlank() && suffix.chars().allMatch(Character::isDigit)) {
                return Long.parseLong(suffix);
            }
        }
        return null;
    }
}
