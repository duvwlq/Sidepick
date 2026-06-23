package com.failforward.backend.domain.experience.service;

import com.failforward.backend.domain.experience.dto.ExperienceDtos.AiSupplementAnswer;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.AiSupplementRequest;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
class ExperienceAiSupplementComposer {

    String composeContent(String content, AiSupplementRequest supplement) {
        String baseContent = normalizeParagraph(content);
        if (supplement == null || supplement.answers() == null || supplement.answers().isEmpty()) {
            return baseContent;
        }

        List<String> supplementSentences = supplement.answers().stream()
                .map(this::toNarrativeSentence)
                .filter(sentence -> !sentence.isBlank())
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(LinkedHashSet::new),
                        ArrayList::new
                ));

        String supplementParagraph = buildSupplementParagraph(supplementSentences);
        if (supplementParagraph.isBlank()) {
            return baseContent;
        }

        StringBuilder builder = new StringBuilder(baseContent);
        if (!baseContent.isBlank()) {
            builder.append("\n\n");
        }
        builder.append(supplementParagraph);
        return builder.toString().trim();
    }

    List<Map<String, String>> toStructuredAnswers(AiSupplementRequest supplement) {
        if (supplement == null || supplement.answers() == null) {
            return List.of();
        }

        List<Map<String, String>> items = new ArrayList<>();
        for (AiSupplementAnswer answer : supplement.answers()) {
            if (answer == null || answer.answer() == null || answer.answer().isBlank()) {
                continue;
            }
            Map<String, String> item = new java.util.LinkedHashMap<>();
            item.put("slot", safe(answer.slot()));
            item.put("question", safe(answer.question()));
            item.put("answer", answer.answer().trim());
            items.add(item);
        }
        return items;
    }

    private String buildSupplementParagraph(List<String> supplementSentences) {
        if (supplementSentences.isEmpty()) {
            return "";
        }

        return "\uC870\uAE08 \uB354 \uAD6C\uCCB4\uC801\uC73C\uB85C \uC801\uC5B4\uBCF4\uBA74, "
                + String.join(" ", supplementSentences);
    }

    private String toNarrativeSentence(AiSupplementAnswer item) {
        if (item == null || item.answer() == null || item.answer().isBlank()) {
            return "";
        }

        String slot = safe(item.slot()).trim();
        String answer = normalizeAnswer(item.answer());

        return switch (slot) {
            case "goal" -> finishSentence("\uCC98\uC74C\uC5D0\uB294 " + answer + "\uD574\uBCF4\uC790\uB294 \uC0DD\uAC01\uC73C\uB85C \uC2DC\uC791\uD588\uC2B5\uB2C8\uB2E4");
            case "timeline", "duration" -> finishSentence("\uC2E4\uC81C\uB85C\uB294 " + answer + " \uC815\uB3C4 \uACC4\uC18D \uBD99\uC7A1\uACE0 \uC6B4\uC601\uD588\uC2B5\uB2C8\uB2E4");
            case "budget", "investment" -> finishSentence("\uCD08\uAE30\uC5D0 \uBA3C\uC800 \uB123\uC740 \uBE44\uC6A9\uC740 " + answer + " \uC815\uB3C4\uC600\uC2B5\uB2C8\uB2E4");
            case "target_customer", "target" -> finishSentence("\uC8FC\uB85C \uC5FC\uB450\uC5D0 \uB454 \uB300\uC0C1\uC740 " + answer + "\uC600\uC2B5\uB2C8\uB2E4");
            case "obstacle", "difficulty" -> finishSentence("\uB9C9\uC0C1 \uD574\uBCF4\uB2C8 \uAC00\uC7A5 \uBC84\uAC70\uC6E0\uB358 \uAC74 " + answer + "\uC774\uC5C8\uC2B5\uB2C8\uB2E4");
            case "market" -> finishSentence("\uC2DC\uC7A5 \uAC80\uC99D\uC740 " + answer + " \uC218\uC900\uC5D0\uC11C \uBCF4\uACE0 \uC788\uB294 \uC0C1\uD0DC\uC600\uC2B5\uB2C8\uB2E4");
            case "channel" -> finishSentence("\uC720\uC785\uC740 " + answer + " \uCABD\uC5D0 \uB9CE\uC774 \uAE30\uB300\uACE0 \uC788\uC5C8\uC2B5\uB2C8\uB2E4");
            case "result" -> finishSentence("\uADF8 \uACFC\uC815\uC5D0\uC11C \uD655\uC778\uD55C \uBC18\uC751\uC774\uB098 \uC131\uACFC\uB85C\uB294 " + answer + " \uAC19\uC740 \uBCC0\uD654\uAC00 \uC788\uC5C8\uC2B5\uB2C8\uB2E4");
            case "reason" -> finishSentence("\uBB38\uC81C\uAC00 \uBC18\uBCF5\uB41C \uAC00\uC7A5 \uD070 \uC774\uC720\uB85C\uB294 " + answer + " \uAC19\uC740 \uBD80\uBD84\uC774 \uCEF8\uC2B5\uB2C8\uB2E4");
            case "mainJob" -> finishSentence("\uBCF8\uC5C5\uACFC\uB294 " + answer);
            default -> finishSentence(answer);
        };
    }

    private String finishSentence(String value) {
        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return "";
        }
        if (trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?")) {
            return trimmed;
        }
        return trimmed + ".";
    }

    private String normalizeAnswer(String value) {
        String trimmed = safe(value).trim();
        while (!trimmed.isBlank()
                && (trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?"))) {
            trimmed = trimmed.substring(0, trimmed.length() - 1).trim();
        }
        return trimmed;
    }

    private String normalizeParagraph(String value) {
        return value == null ? "" : value.trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
