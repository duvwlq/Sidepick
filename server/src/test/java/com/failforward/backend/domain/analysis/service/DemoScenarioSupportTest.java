package com.failforward.backend.domain.analysis.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.entity.BusinessCategoryType;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.user.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DemoScenarioSupportTest {

    private DemoScenarioSupport support;

    @BeforeEach
    void setUp() {
        support = new DemoScenarioSupport(new ObjectMapper());
    }

    @Test
    void matchesOnlineSalesScenarioFromDirectInput() {
        FailureExperience experience = buildExperience(
                1L,
                "온라인 판매·이커머스",
                """
                회사 다니면서 부수입을 좀 만들어보고 싶어서 스마트스토어를 시작했습니다.
                액세서리를 도매로 떼와서 팔았는데, 한 달 정산해보니까 카드 수수료, 플랫폼 수수료, 배송비 빼고 나면 남는 게 거의 없더라고요.
                더 싸게 떼올 데를 못 찾아서 점점 지쳐서 그만뒀습니다.
                """,
                List.of("수익 구조 이해", "경쟁 심화")
        );

        DemoScenarioSupport.DemoScenario scenario = support.match(experience).orElseThrow();

        assertThat(scenario.code()).isEqualTo("scenario1");
        assertThat(scenario.successGuideKey()).isEqualTo("online_sales__revenue_structure");
        assertThat(scenario.similarCaseIds()).containsExactly(18L, 19L, 100L);
    }

    @Test
    void matchesPlatformWorkScenarioFromDirectInput() {
        FailureExperience experience = buildExperience(
                4L,
                "플랫폼 노동",
                """
                본업 외 추가 수입을 위해 퇴근 후 배달대행 플랫폼을 시작했어요.
                같은 지역에 라이더가 점점 많아지면서 한 건당 단가가 떨어지고 콜도 잘 안 잡히더라고요.
                기름값 빼고 나면 시간당 5천원도 안 될 때가 많았습니다.
                """,
                List.of("경쟁 심화", "시간 관리", "수익화 연결")
        );

        DemoScenarioSupport.DemoScenario scenario = support.match(experience).orElseThrow();

        assertThat(scenario.code()).isEqualTo("scenario2");
        assertThat(scenario.successGuideKey()).isEqualTo("platform_work__competition");
        assertThat(scenario.similarCaseIds()).containsExactly(7L, 10L, 12L);
    }

    @Test
    void returnsEmptyWhenInputDoesNotMatchDemoScenario() {
        FailureExperience experience = buildExperience(
                2L,
                "콘텐츠·SNS",
                "블로그를 시작했는데 꾸준히 글을 못 써서 방문자가 안 늘었습니다.",
                List.of("시간 관리")
        );

        assertThat(support.match(experience)).isEmpty();
    }

    @Test
    void mergesStructuredDataWithScenarioMetadata() {
        FailureExperience experience = buildExperience(
                1L,
                "온라인 판매·이커머스",
                "스마트스토어에서 수수료와 배송비 때문에 실수익이 거의 남지 않았습니다.",
                List.of("수익 구조 이해", "경쟁 심화")
        );

        DemoScenarioSupport.DemoScenario scenario = support.match(experience).orElseThrow();
        String structuredData = support.mergeStructuredData(experience, scenario);
        Map<String, Object> parsed = ExperienceDtos.parseObject(structuredData);

        assertThat(parsed.get("demoScenario")).isEqualTo("scenario1");
        assertThat(parsed.get("demoSuccessGuideKey")).isEqualTo("online_sales__revenue_structure");
        assertThat(parsed.get("demoSimilarCaseIds")).isEqualTo(List.of(18, 19, 100));
    }

    private FailureExperience buildExperience(
            Long categoryId,
            String categoryName,
            String content,
            List<String> difficulties
    ) {
        return FailureExperience.create(
                User.create("demo@sidepick.local", "password", "demo", "30s"),
                BusinessCategory.create(
                        categoryId,
                        categoryName,
                        "",
                        "icon",
                        "#000000",
                        BusinessCategoryType.business_field
                ),
                "demo-title",
                content,
                "demo-business",
                1000000,
                6,
                20,
                "THREE_TO_FIVE_HOURS",
                true,
                300000,
                "failure",
                "[]",
                toJson(difficulties),
                null,
                null,
                null,
                "[]",
                null,
                false,
                "{\"source\":\"test\"}",
                "FAILURE"
        );
    }

    private String toJson(List<String> value) {
        try {
            return new ObjectMapper().writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
