package com.failforward.backend.domain.experience.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.failforward.backend.domain.experience.dto.ExperienceDtos.AiSupplementAnswer;
import com.failforward.backend.domain.experience.dto.ExperienceDtos.AiSupplementRequest;
import java.util.List;
import org.junit.jupiter.api.Test;

class ExperienceAiSupplementComposerTest {

    private final ExperienceAiSupplementComposer composer = new ExperienceAiSupplementComposer();

    @Test
    void composeContentUsesCurrentAgentASlots() {
        AiSupplementRequest supplement = new AiSupplementRequest(
                "기본 본문입니다.",
                List.of(
                        new AiSupplementAnswer("timeline", "기간", "약 3개월"),
                        new AiSupplementAnswer("budget", "비용", "50만 원"),
                        new AiSupplementAnswer("obstacle", "어려움", "질문 의도가 애매한 경우가 많았던 점"),
                        new AiSupplementAnswer("result", "성과", "상담 전환율이 이전보다 높아진 것")
                )
        );

        String composed = composer.composeContent("기본 본문입니다.", supplement);

        assertThat(composed)
                .contains("기본 본문입니다.")
                .contains("조금 더 구체적으로 적어보면,")
                .contains("실제로는 약 3개월 정도 계속 붙잡고 운영했습니다.")
                .contains("초기에 먼저 넣은 비용은 50만 원 정도였습니다.")
                .contains("막상 해보니 가장 버거웠던 건 질문 의도가 애매한 경우가 많았던 점이었습니다.")
                .contains("그 과정에서 확인한 반응이나 성과로는 상담 전환율이 이전보다 높아진 것 같은 변화가 있었습니다.");
    }

    @Test
    void composeContentAlsoSupportsLegacySlots() {
        AiSupplementRequest supplement = new AiSupplementRequest(
                "원래 적어둔 본문입니다.",
                List.of(
                        new AiSupplementAnswer("duration", "진행 기간", "약 2개월"),
                        new AiSupplementAnswer("investment", "투자 비용", "30만 원"),
                        new AiSupplementAnswer("difficulty", "가장 어려운 점", "운영 중 예외 상황이 자주 생긴 점"),
                        new AiSupplementAnswer("reason", "실패 이유", "초기 가정이 지나치게 단순했던 점"),
                        new AiSupplementAnswer("target", "대상 고객", "20대 초반의 첫 구매자"),
                        new AiSupplementAnswer("mainJob", "본업 병행", "퇴근 후와 주말 위주로 병행한 상태")
                )
        );

        String composed = composer.composeContent("원래 적어둔 본문입니다.", supplement);

        assertThat(composed)
                .contains("실제로는 약 2개월 정도 계속 붙잡고 운영했습니다.")
                .contains("초기에 먼저 넣은 비용은 30만 원 정도였습니다.")
                .contains("막상 해보니 가장 버거웠던 건 운영 중 예외 상황이 자주 생긴 점이었습니다.")
                .contains("문제가 반복된 가장 큰 이유로는 초기 가정이 지나치게 단순했던 점 같은 부분이 컸습니다.")
                .contains("주로 염두에 둔 대상은 20대 초반의 첫 구매자였습니다.")
                .contains("본업과는 퇴근 후와 주말 위주로 병행한 상태.");
    }
}
