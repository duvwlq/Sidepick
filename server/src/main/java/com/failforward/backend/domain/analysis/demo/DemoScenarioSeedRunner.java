package com.failforward.backend.domain.analysis.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@Transactional
@ConditionalOnProperty(name = "app.demo-seed.enabled", havingValue = "true")
public class DemoScenarioSeedRunner implements ApplicationRunner, Ordered {

    private static final long DEMO_USER_EXPERIENCE_1_ID = 1001L;
    private static final long DEMO_USER_EXPERIENCE_2_ID = 1002L;
    private static final String DEMO_USER_EMAIL = "demo-seed@sidepick.local";
    private static final String DEMO_USER_NICKNAME = "sidepick-demo";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final DemoSeedProperties properties;

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        long userId = ensureDemoUser();

        seedScenario(
                userId,
                new DemoScenario(
                        DEMO_USER_EXPERIENCE_1_ID,
                        1L,
                        "스마트스토어 초기 판매 실패 사례",
                        "스마트스토어를 시작했지만 유입과 수익 구조를 충분히 검증하지 못해 판매가 거의 발생하지 않았습니다. 광고비만 소진되고 재구매로 이어지지 않아 운영을 중단했습니다.",
                        "스마트스토어",
                        1500000L,
                        4,
                        18,
                        "ONE_TO_THREE_HOURS",
                        true,
                        50000L,
                        "수익 구조 이해",
                        List.of("수익 구조 이해", "시장 조사 부족"),
                        List.of("수익화 연결", "경쟁 심화"),
                        "online_sales__revenue_structure",
                        List.of(18L, 19L, 100L),
                        List.of(91, 87, 84),
                        List.of("스마트스토어", "수익구조", "초기검증부족"),
                        "수익구조이해부족",
                        "HIGH",
                        List.of("고객 검증 부족", "유입 전략 부족"),
                        "스마트스토어 운영 초기, 수익 구조와 고객 유입 구조를 검증하지 못해 손실이 누적된 사례입니다.",
                        List.of(
                                "1단계: 상품보다 먼저 고객이 실제로 반복 구매할 이유를 한 문장으로 정리하세요.",
                                "2단계: 광고 집행 전 상세페이지와 가격 가설을 소규모 트래픽으로 검증하세요.",
                                "3단계: 첫 달에는 매출보다 재구매와 문의 전환 데이터를 기준으로 운영 판단을 하세요."
                        ),
                        BigDecimal.valueOf(0.9d)
                )
        );

        seedScenario(
                userId,
                new DemoScenario(
                        DEMO_USER_EXPERIENCE_2_ID,
                        4L,
                        "배달대행 피크타임 운영 실패 사례",
                        "본업 이후 배달대행을 병행했지만 경쟁이 심한 시간대에만 진입해 체력 부담이 컸고, 수익이 기대보다 낮아 오래 지속하지 못했습니다.",
                        "배달대행",
                        300000L,
                        6,
                        24,
                        "THREE_TO_FIVE_HOURS",
                        true,
                        180000L,
                        "경쟁 심화",
                        List.of("경쟁 심화", "시간 부족"),
                        List.of("시간 관리", "경쟁 심화"),
                        "platform_work__competition",
                        List.of(7L, 10L, 12L),
                        List.of(90, 86, 82),
                        List.of("배달대행", "피크타임", "경쟁심화"),
                        "경쟁심화",
                        "MEDIUM",
                        List.of("진입 시간대 경쟁 심화", "체력 대비 수익성 부족"),
                        "배달대행 부업을 피크타임 중심으로 운영했지만 경쟁과 체력 부담이 겹치며 지속 가능성을 확보하지 못한 사례입니다.",
                        List.of(
                                "1단계: 진입 시간대를 넓혀 경쟁이 덜한 구간의 실수익을 먼저 비교하세요.",
                                "2단계: 이동 거리와 대기 시간을 함께 기록해 체력 대비 수익성을 수치로 보세요.",
                                "3단계: 한 달 단위 목표 수익과 중단 기준을 미리 정해 과투입을 막으세요."
                        ),
                        BigDecimal.valueOf(0.6d)
                )
        );

        log.info("Demo scenario seed applied. enabled={}", properties.isEnabled());
    }

    private long ensureDemoUser() {
        Long existingId = findUserIdByEmail(DEMO_USER_EMAIL);
        if (existingId != null) {
            return existingId;
        }

        jdbcTemplate.update(
                """
                INSERT INTO users (
                    email, password, nickname, age_group, profile_image, auth_provider,
                    email_verified, profile_completed, is_active
                ) VALUES (?, NULL, ?, ?, NULL, 'LOCAL', TRUE, TRUE, TRUE)
                """,
                DEMO_USER_EMAIL,
                DEMO_USER_NICKNAME,
                "30s"
        );

        Long createdId = findUserIdByEmail(DEMO_USER_EMAIL);
        if (createdId == null) {
            throw new IllegalStateException("Failed to create demo seed user.");
        }
        return createdId;
    }

    private void seedScenario(long userId, DemoScenario scenario) {
        upsertExperience(userId, scenario);
        long analysisId = upsertAnalysis(scenario);
        replaceMatchedCases(analysisId, scenario);
    }

    private void upsertExperience(long userId, DemoScenario scenario) {
        Map<String, Object> structuredData = new LinkedHashMap<>();
        structuredData.put("demoSeed", true);
        structuredData.put("demoScenario", scenario.id() == DEMO_USER_EXPERIENCE_1_ID ? "scenario1" : "scenario2");
        structuredData.put("demoSuccessGuideKey", scenario.successGuideKey());
        structuredData.put("demoSimilarCaseIds", scenario.similarCaseIds());

        jdbcTemplate.update(
                """
                INSERT INTO failure_experiences (
                    id, user_id, category_id, title, content, business_type,
                    investment_amount, duration_months, weekly_hours, average_daily_hours,
                    is_concurrent_with_main_job, monthly_revenue, failure_reason, failure_reasons,
                    difficulties, difficulty_etc, difficulty_extra, target_market, marketing_channels,
                    lessons_learned, would_retry, structured_data, view_count, like_count, is_public,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, 0, 0, TRUE, ?, ?)
                ON DUPLICATE KEY UPDATE
                    user_id = VALUES(user_id),
                    category_id = VALUES(category_id),
                    title = VALUES(title),
                    content = VALUES(content),
                    business_type = VALUES(business_type),
                    investment_amount = VALUES(investment_amount),
                    duration_months = VALUES(duration_months),
                    weekly_hours = VALUES(weekly_hours),
                    average_daily_hours = VALUES(average_daily_hours),
                    is_concurrent_with_main_job = VALUES(is_concurrent_with_main_job),
                    monthly_revenue = VALUES(monthly_revenue),
                    failure_reason = VALUES(failure_reason),
                    failure_reasons = VALUES(failure_reasons),
                    difficulties = VALUES(difficulties),
                    marketing_channels = VALUES(marketing_channels),
                    lessons_learned = VALUES(lessons_learned),
                    would_retry = VALUES(would_retry),
                    structured_data = VALUES(structured_data),
                    updated_at = VALUES(updated_at)
                """,
                scenario.id(),
                userId,
                scenario.categoryId(),
                scenario.title(),
                scenario.content(),
                scenario.businessType(),
                scenario.investmentAmount(),
                scenario.durationMonths(),
                scenario.weeklyHours(),
                scenario.averageDailyHours(),
                scenario.concurrentWithMainJob(),
                scenario.monthlyRevenue(),
                scenario.failureReason(),
                toJson(scenario.failureReasons()),
                toJson(scenario.difficulties()),
                "[]",
                scenario.summary(),
                false,
                toJson(structuredData),
                Timestamp.valueOf(LocalDateTime.of(2026, 5, 7, 9, 0)),
                Timestamp.valueOf(LocalDateTime.of(2026, 5, 7, 9, 0))
        );
    }

    private long upsertAnalysis(DemoScenario scenario) {
        Long existingId = jdbcTemplate.query(
                "SELECT id FROM ai_analysis WHERE experience_id = ?",
                rs -> rs.next() ? rs.getLong(1) : null,
                scenario.id()
        );

        if (existingId != null) {
            jdbcTemplate.update(
                    """
                    UPDATE ai_analysis
                    SET fail_reason_tags = ?,
                        summary_list = ?,
                        structured_summary = ?,
                        failure_category = ?,
                        risk_level = ?,
                        risk_factor_analysis = ?,
                        risk_score = ?,
                        processed_at = ?
                    WHERE id = ?
                    """,
                    toJson(scenario.keywords()),
                    toJson(scenario.advice()),
                    scenario.summary(),
                    scenario.failureCategory(),
                    scenario.riskLevel(),
                    toJson(scenario.riskFactors()),
                    scenario.riskScore(),
                    Timestamp.valueOf(LocalDateTime.of(2026, 5, 7, 10, 0)),
                    existingId
            );
            return existingId;
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO ai_analysis (
                        experience_id, fail_reason_tags, summary_list, structured_summary,
                        failure_category, risk_level, risk_factor_analysis, risk_score, processed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, scenario.id());
            statement.setString(2, toJson(scenario.keywords()));
            statement.setString(3, toJson(scenario.advice()));
            statement.setString(4, scenario.summary());
            statement.setString(5, scenario.failureCategory());
            statement.setString(6, scenario.riskLevel());
            statement.setString(7, toJson(scenario.riskFactors()));
            statement.setBigDecimal(8, scenario.riskScore());
            statement.setTimestamp(9, Timestamp.valueOf(LocalDateTime.of(2026, 5, 7, 10, 0)));
            return statement;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        if (generatedKey == null) {
            throw new IllegalStateException("Failed to create demo analysis row.");
        }
        return generatedKey.longValue();
    }

    private void replaceMatchedCases(long analysisId, DemoScenario scenario) {
        jdbcTemplate.update("DELETE FROM matched_cases WHERE analysis_id = ?", analysisId);

        for (int index = 0; index < scenario.similarCaseIds().size(); index++) {
            long similarCaseId = scenario.similarCaseIds().get(index);
            SimilarCaseSeed source = loadSimilarCase(similarCaseId);

            jdbcTemplate.update(
                    """
                    INSERT INTO matched_cases (
                        analysis_id, case_id, case_title, case_summary, key_lesson, match_rate
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    analysisId,
                    String.valueOf(similarCaseId),
                    source.title(),
                    source.summary(),
                    source.keyLesson(),
                    scenario.matchRates().get(index)
            );
        }
    }

    private SimilarCaseSeed loadSimilarCase(long experienceId) {
        return jdbcTemplate.query(
                """
                SELECT
                    e.title,
                    COALESCE(a.structured_summary, e.content) AS summary,
                    COALESCE(e.lessons_learned, e.content) AS key_lesson
                FROM failure_experiences e
                LEFT JOIN ai_analysis a ON a.experience_id = e.id
                WHERE e.id = ?
                """,
                rs -> {
                    if (!rs.next()) {
                        throw new IllegalStateException("Demo similar case not found: " + experienceId);
                    }
                    return new SimilarCaseSeed(
                            rs.getString("title"),
                            rs.getString("summary"),
                            rs.getString("key_lesson")
                    );
                },
                experienceId
        );
    }

    private Long findUserIdByEmail(String email) {
        try {
            return jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        } catch (EmptyResultDataAccessException ignored) {
            return null;
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to serialize demo seed JSON.", exception);
        }
    }

    private record DemoScenario(
            long id,
            long categoryId,
            String title,
            String content,
            String businessType,
            Long investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean concurrentWithMainJob,
            Long monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String successGuideKey,
            List<Long> similarCaseIds,
            List<Integer> matchRates,
            List<String> keywords,
            String failureCategory,
            String riskLevel,
            List<String> riskFactors,
            String summary,
            List<String> advice,
            BigDecimal riskScore
    ) {
    }

    private record SimilarCaseSeed(
            String title,
            String summary,
            String keyLesson
    ) {
    }
}
