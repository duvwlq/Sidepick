package com.failforward.backend.domain.experience.importer;

import com.failforward.backend.domain.category.repository.BusinessCategoryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.experience-import.enabled", havingValue = "true")
public class ExperienceCsvImportRunner implements ApplicationRunner {

    private static final Pattern NUMBER_PATTERN = Pattern.compile("[^0-9.-]");
    private static final Pattern SPLIT_PATTERN = Pattern.compile("\\s*(\\||;|/|\\n|,)\\s*");
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter DASHED_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final BusinessCategoryRepository categoryRepository;
    private final ExperienceImportProperties properties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        Path csvPath = resolveCsvPath();
        List<CSVRecord> records = readCsv(csvPath);
        if (records.isEmpty()) {
            log.warn("Experience CSV import skipped because the file is empty: {}", csvPath);
            return;
        }
        log.info("Experience import category map: {}", properties.getCategoryMap());
        String importSource = csvPath.getFileName().toString();

        if (properties.getReplaceMode() == ExperienceImportProperties.ReplaceMode.DELETE_IMPORTED_THEN_IMPORT) {
            deleteImportedData();
        }

        long systemUserId = properties.getAuthorMode() == ExperienceImportProperties.AuthorMode.SYSTEM
                ? ensureSystemUser()
                : -1L;

        int importedCount = 0;
        for (int index = 0; index < records.size(); index++) {
            ImportedRow row = ImportedRow.from(records.get(index).toMap());
            long userId = properties.getAuthorMode() == ExperienceImportProperties.AuthorMode.SYSTEM
                    ? systemUserId
                    : ensurePseudoUser(index + 1);
            long experienceId = upsertExperience(row, userId, index, records.size(), importSource);
            if (properties.isImportAnalysis()) {
                upsertAnalysis(row, experienceId, index, records.size());
            }
            importedCount++;
        }

        log.info(
                "Experience CSV import completed. importedCount={}, csvPath={}, authorMode={}, titleMode={}, createdAtMode={}",
                importedCount,
                csvPath,
                properties.getAuthorMode(),
                properties.getTitleMode(),
                properties.getCreatedAtMode()
        );
    }

    private void deleteImportedData() {
        String pseudoEmailPattern = "imported+%@"
                + properties.getPseudoEmailDomain();

        int deletedExperiences = jdbcTemplate.update(
                """
                DELETE FROM failure_experiences
                WHERE JSON_EXTRACT(structured_data, '$.importRowId') IS NOT NULL
                   OR user_id IN (
                        SELECT id
                        FROM users
                        WHERE email = ?
                           OR email LIKE ?
                   )
                """,
                properties.getSystemEmail(),
                pseudoEmailPattern
        );

        int deletedUsers = jdbcTemplate.update(
                """
                DELETE FROM users
                WHERE (email = ? OR email LIKE ?)
                  AND NOT EXISTS (
                        SELECT 1
                        FROM failure_experiences
                        WHERE failure_experiences.user_id = users.id
                  )
                """,
                properties.getSystemEmail(),
                pseudoEmailPattern
        );

        log.info(
                "Existing imported experience data cleared before CSV import. deletedExperiences={}, deletedUsers={}",
                deletedExperiences,
                deletedUsers
        );
    }

    private Path resolveCsvPath() {
        String configuredPath = properties.getCsvPath();
        if (configuredPath == null || configuredPath.isBlank()) {
            throw new IllegalStateException("app.experience-import.csv-path must be configured when import is enabled.");
        }
        Path path = Path.of(configuredPath).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new IllegalStateException("Experience CSV file not found: " + path);
        }
        return path;
    }

    private List<CSVRecord> readCsv(Path csvPath) throws IOException {
        try (Reader fileReader = Files.newBufferedReader(csvPath, StandardCharsets.UTF_8);
             BufferedReader reader = new BufferedReader(fileReader);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreEmptyLines(true)
                     .setTrim(true)
                     .build()
                     .parse(stripBom(reader))) {
            return parser.getRecords();
        }
    }

    private Reader stripBom(BufferedReader reader) throws IOException {
        reader.mark(1);
        if (reader.read() != 0xFEFF) {
            reader.reset();
        }
        return reader;
    }

    private long ensureSystemUser() {
        Long existingId = findUserIdByEmail(properties.getSystemEmail());
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
                properties.getSystemEmail(),
                trimToLength(properties.getSystemNickname(), 20),
                properties.getDefaultAgeGroup()
        );

        Long createdId = findUserIdByEmail(properties.getSystemEmail());
        if (createdId == null) {
            throw new IllegalStateException("Failed to create the system import user.");
        }
        return createdId;
    }

    private long ensurePseudoUser(int sequence) {
        String email = "imported+" + String.format(Locale.ROOT, "%03d", sequence) + "@" + properties.getPseudoEmailDomain();
        Long existingId = findUserIdByEmail(email);
        if (existingId != null) {
            return existingId;
        }

        String nickname = "pick" + String.format(Locale.ROOT, "%03d", sequence);
        jdbcTemplate.update(
                """
                INSERT INTO users (
                    email, password, nickname, age_group, profile_image, auth_provider,
                    email_verified, profile_completed, is_active
                ) VALUES (?, NULL, ?, ?, NULL, 'LOCAL', TRUE, TRUE, TRUE)
                """,
                email,
                trimToLength(nickname, 20),
                properties.getDefaultAgeGroup()
        );

        Long createdId = findUserIdByEmail(email);
        if (createdId == null) {
            throw new IllegalStateException("Failed to create pseudo import user for email: " + email);
        }
        return createdId;
    }

    private Long findUserIdByEmail(String email) {
        try {
            return jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        } catch (EmptyResultDataAccessException ignored) {
            return null;
        }
    }

    private long upsertExperience(ImportedRow row, long userId, int index, int totalCount, String importSource) {
        long categoryId = resolveCategoryId(row.category(), row.categorySlug());
        LocalDateTime createdAt = resolveCreatedAt(row.id(), row.postDate(), index, totalCount);
        LocalDateTime updatedAt = createdAt;
        String businessType = trimToLength(firstNonBlank(row.category(), row.categorySlug(), "Other"), 50);
        String content = firstNonBlank(row.freeText(), row.summary(), "No content provided");
        List<String> failureReasons = parseList(row.failureReasons());
        List<String> difficulties = parseList(row.difficulties());
        String caseStatus = resolveCaseStatus(row.caseStatus());
        String failureReason = trimToLength(
                firstNonBlank(
                        firstItem(failureReasons),
                        row.failureCategory(),
                        firstItem(difficulties),
                        "SUCCESS".equals(caseStatus) ? "SUCCESS_STORY" : "Other"
                ),
                50
        );
        String title = trimToLength(resolveTitle(row, content, index), 100);
        String averageDailyHours = mapAverageDailyHours(row.dailyHours());
        Integer weeklyHours = mapWeeklyHours(row.dailyHours());
        Integer investmentAmount = parseInteger(row.investAmount());
        Integer durationMonths = parseInteger(row.duration());
        Integer monthlyRevenue = parseInteger(row.revenueAmount());
        Boolean concurrentWithMainJob = parseBoolean(row.hasMainJob());
        Boolean wouldRetry = "SUCCESS".equals(caseStatus) ? Boolean.TRUE : Boolean.FALSE;

        Map<String, Object> structuredData = new LinkedHashMap<>();
        structuredData.put("importSource", importSource);
        structuredData.put("importRowId", row.id());
        structuredData.put("externalCaseId", row.externalId());
        structuredData.put("rawCategory", row.category());
        structuredData.put("categorySlug", row.categorySlug());
        structuredData.put("rawDuration", row.duration());
        structuredData.put("rawDailyHours", row.dailyHours());
        structuredData.put("rawHasMainJob", row.hasMainJob());
        structuredData.put("keywords", parseList(row.keywords()));
        structuredData.put("failureCategory", row.failureCategory());
        structuredData.put("riskLevel", row.riskLevel());
        structuredData.put("source", row.source());
        structuredData.put("originalLink", row.link());
        structuredData.put("postDate", row.postDate());

        if (properties.isPreserveIds() && row.id() != null) {
            long experienceId = row.id();
            if (properties.isOverwriteExisting()) {
                jdbcTemplate.update(
                        """
                        INSERT INTO failure_experiences (
                            id, user_id, category_id, title, content, business_type,
                            investment_amount, duration_months, weekly_hours, average_daily_hours,
                            is_concurrent_with_main_job, monthly_revenue, failure_reason, failure_reasons,
                            difficulties, difficulty_etc, difficulty_extra, target_market, marketing_channels,
                            lessons_learned, would_retry, structured_data, case_status, view_count, like_count, is_public,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, TRUE, ?, ?)
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
                            difficulty_etc = VALUES(difficulty_etc),
                            difficulty_extra = VALUES(difficulty_extra),
                            target_market = VALUES(target_market),
                            marketing_channels = VALUES(marketing_channels),
                            lessons_learned = VALUES(lessons_learned),
                            would_retry = VALUES(would_retry),
                            structured_data = VALUES(structured_data),
                            case_status = VALUES(case_status),
                            is_public = VALUES(is_public),
                            updated_at = VALUES(updated_at)
                        """,
                        experienceId,
                        userId,
                        categoryId,
                        title,
                        content,
                        businessType,
                        investmentAmount,
                        durationMonths,
                        weeklyHours,
                        averageDailyHours,
                        concurrentWithMainJob,
                        monthlyRevenue,
                        failureReason,
                        toJson(failureReasons),
                        toJson(difficulties),
                        null,
                        null,
                        null,
                        "[]",
                        content,
                        wouldRetry,
                        toJson(structuredData),
                        caseStatus,
                        Timestamp.valueOf(createdAt),
                        Timestamp.valueOf(updatedAt)
                );
            } else {
                jdbcTemplate.update(
                        """
                        INSERT INTO failure_experiences (
                            id, user_id, category_id, title, content, business_type,
                            investment_amount, duration_months, weekly_hours, average_daily_hours,
                            is_concurrent_with_main_job, monthly_revenue, failure_reason, failure_reasons,
                            difficulties, difficulty_etc, difficulty_extra, target_market, marketing_channels,
                            lessons_learned, would_retry, structured_data, case_status, view_count, like_count, is_public,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, TRUE, ?, ?)
                        """,
                        experienceId,
                        userId,
                        categoryId,
                        title,
                        content,
                        businessType,
                        investmentAmount,
                        durationMonths,
                        weeklyHours,
                        averageDailyHours,
                        concurrentWithMainJob,
                        monthlyRevenue,
                        failureReason,
                        toJson(failureReasons),
                        toJson(difficulties),
                        null,
                        null,
                        null,
                        "[]",
                        content,
                        wouldRetry,
                        toJson(structuredData),
                        caseStatus,
                        Timestamp.valueOf(createdAt),
                        Timestamp.valueOf(updatedAt)
                );
            }
            return experienceId;
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO failure_experiences (
                        user_id, category_id, title, content, business_type,
                        investment_amount, duration_months, weekly_hours, average_daily_hours,
                        is_concurrent_with_main_job, monthly_revenue, failure_reason, failure_reasons,
                        difficulties, difficulty_etc, difficulty_extra, target_market, marketing_channels,
                        lessons_learned, would_retry, structured_data, case_status, view_count, like_count, is_public,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, TRUE, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, userId);
            statement.setLong(2, categoryId);
            statement.setString(3, title);
            statement.setString(4, content);
            statement.setString(5, businessType);
            statement.setObject(6, investmentAmount);
            statement.setObject(7, durationMonths);
            statement.setObject(8, weeklyHours);
            statement.setString(9, averageDailyHours);
            statement.setObject(10, concurrentWithMainJob);
            statement.setObject(11, monthlyRevenue);
            statement.setString(12, failureReason);
            statement.setString(13, toJson(failureReasons));
            statement.setString(14, toJson(difficulties));
            statement.setString(15, null);
            statement.setString(16, null);
            statement.setString(17, null);
            statement.setString(18, "[]");
            statement.setString(19, content);
            statement.setBoolean(20, wouldRetry);
            statement.setString(21, toJson(structuredData));
            statement.setString(22, caseStatus);
            statement.setTimestamp(23, Timestamp.valueOf(createdAt));
            statement.setTimestamp(24, Timestamp.valueOf(updatedAt));
            return statement;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        if (generatedKey == null) {
            throw new IllegalStateException("Failed to capture the generated experience id.");
        }
        return generatedKey.longValue();
    }

    private void upsertAnalysis(ImportedRow row, long experienceId, int index, int totalCount) {
        LocalDateTime processedAt = resolveCreatedAt(row.id(), row.postDate(), index, totalCount);
        List<String> keywords = parseList(row.keywords());
        String structuredSummary = firstNonBlank(row.summary(), row.freeText());
        String riskLevel = normalizeRiskLevel(row.riskLevel());
        BigDecimal riskScore = toRiskScore(riskLevel);
        String failureCategory = trimToLength(blankToNull(row.failureCategory()), 50);
        String summaryListJson = toJson(structuredSummary == null ? List.of() : List.of(structuredSummary));
        String failReasonTagsJson = toJson(keywords);
        String riskFactorAnalysisJson = "[]";

        if (properties.isOverwriteExisting()) {
            jdbcTemplate.update(
                    """
                    INSERT INTO ai_analysis (
                        experience_id, fail_reason_tags, summary_list, structured_summary,
                        failure_category, risk_level, risk_factor_analysis, risk_score, processed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        fail_reason_tags = VALUES(fail_reason_tags),
                        summary_list = VALUES(summary_list),
                        structured_summary = VALUES(structured_summary),
                        failure_category = VALUES(failure_category),
                        risk_level = VALUES(risk_level),
                        risk_factor_analysis = VALUES(risk_factor_analysis),
                        risk_score = VALUES(risk_score),
                        processed_at = VALUES(processed_at)
                    """,
                    experienceId,
                    failReasonTagsJson,
                    summaryListJson,
                    structuredSummary,
                    failureCategory,
                    riskLevel,
                    riskFactorAnalysisJson,
                    riskScore,
                    Timestamp.valueOf(processedAt)
            );
            return;
        }

        jdbcTemplate.update(
                """
                INSERT INTO ai_analysis (
                    experience_id, fail_reason_tags, summary_list, structured_summary,
                    failure_category, risk_level, risk_factor_analysis, risk_score, processed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                experienceId,
                failReasonTagsJson,
                summaryListJson,
                structuredSummary,
                failureCategory,
                riskLevel,
                riskFactorAnalysisJson,
                riskScore,
                Timestamp.valueOf(processedAt)
        );
    }

    private long resolveCategoryId(String rawCategory, String categorySlug) {
        Long slugMapped = mapCategorySlugToId(categorySlug);
        if (slugMapped != null) {
            return validateCategoryId(slugMapped);
        }

        if (rawCategory == null || rawCategory.isBlank()) {
            return validateCategoryId(properties.getDefaultCategoryId());
        }

        Long directMatch = properties.getCategoryMap().get(rawCategory.trim());
        if (directMatch != null) {
            return validateCategoryId(directMatch);
        }

        String normalized = normalizeCategoryKey(rawCategory);
        for (Map.Entry<String, Long> entry : properties.getCategoryMap().entrySet()) {
            if (normalizeCategoryKey(entry.getKey()).equals(normalized)) {
                return validateCategoryId(entry.getValue());
            }
        }

        if (normalized.matches("\\d+")) {
            return validateCategoryId(Long.parseLong(normalized));
        }
        log.warn(
                "Falling back to default category. rawCategory='{}', normalized='{}', availableKeys={}",
                rawCategory,
                normalized,
                properties.getCategoryMap().keySet()
        );
        return validateCategoryId(properties.getDefaultCategoryId());
    }

    private Long mapCategorySlugToId(String categorySlug) {
        if (categorySlug == null || categorySlug.isBlank()) {
            return null;
        }
        return switch (normalizeCategoryKey(categorySlug)) {
            case "onlinecommerce" -> 1L;
            case "contentsns" -> 2L;
            case "digitalproducts" -> 3L;
            case "platformlabor" -> 4L;
            case "talentfreelance" -> 5L;
            case "investment" -> 6L;
            case "offlinesidejob" -> 7L;
            case "beforestart", "taxbusiness", "workplussidejob", "marketing", "tools", "mentalcare", "legalcontract", "accounting", "insight", "etc", "기타" -> 8L;
            default -> null;
        };
    }

    private long validateCategoryId(long categoryId) {
        if (categoryRepository.existsById(categoryId)) {
            return categoryId;
        }
        throw new IllegalStateException("Mapped category id does not exist: " + categoryId);
    }

    private String resolveTitle(ImportedRow row, String content, int index) {
        return switch (properties.getTitleMode()) {
            case SUMMARY -> firstNonBlank(row.summary(), generateFallbackTitle(row, index));
            case CONTENT_PREFIX -> firstNonBlank(prefix(content, 40), generateFallbackTitle(row, index));
            case GENERATED -> generateFallbackTitle(row, index);
        };
    }

    private String generateFallbackTitle(ImportedRow row, int index) {
        String category = firstNonBlank(row.category(), "Other");
        return category + " failure case " + (index + 1);
    }

    private LocalDateTime resolveCreatedAt(Long rowId, String rawPostDate, int index, int totalCount) {
        LocalDateTime parsedPostDate = parsePostDate(rawPostDate);
        if (parsedPostDate != null) {
            return parsedPostDate;
        }
        LocalDateTime start = properties.getCreatedAtStart();
        LocalDateTime end = properties.getCreatedAtEnd();
        if (start == null || end == null || end.isBefore(start)) {
            return LocalDateTime.now();
        }

        return switch (properties.getCreatedAtMode()) {
            case NOW -> LocalDateTime.now();
            case FIXED_START -> start;
            case FIXED_END -> end;
            case SEQUENTIAL_DISTRIBUTED -> {
                if (totalCount <= 1) {
                    yield start;
                }
                Duration totalDuration = Duration.between(start, end);
                long offsetSeconds = totalDuration.getSeconds() * index / Math.max(totalCount - 1, 1);
                yield start.plusSeconds(offsetSeconds);
            }
            case RANDOM_DISTRIBUTED -> {
                long seed = Objects.hash(Optional.ofNullable(rowId).orElse((long) index), totalCount);
                Random random = new Random(seed);
                Duration totalDuration = Duration.between(start, end);
                long bound = Math.max(totalDuration.getSeconds(), 1L);
                yield start.plusSeconds(random.nextLong(bound));
            }
        };
    }

    private LocalDateTime parsePostDate(String rawPostDate) {
        if (rawPostDate == null || rawPostDate.isBlank()) {
            return null;
        }
        String trimmed = rawPostDate.trim();
        try {
            return LocalDate.parse(trimmed, BASIC_DATE).atStartOfDay();
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDate.parse(trimmed, DASHED_DATE).atStartOfDay();
        } catch (DateTimeParseException ignored) {
        }
        return null;
    }

    private String resolveCaseStatus(String rawCaseStatus) {
        String normalized = normalizeKey(firstNonBlank(rawCaseStatus, properties.getDefaultCaseStatus()));
        if (normalized.contains("success") || normalized.contains("성공")) {
            return "SUCCESS";
        }
        return "FAILURE";
    }

    private String mapAverageDailyHours(String rawDailyHours) {
        Double value = parseDouble(rawDailyHours);
        if (value == null) {
            return null;
        }
        if (value < 1.0d) {
            return "UNDER_1_HOUR";
        }
        if (value <= 3.0d) {
            return "ONE_TO_THREE_HOURS";
        }
        if (value <= 5.0d) {
            return "THREE_TO_FIVE_HOURS";
        }
        return "OVER_FIVE_HOURS";
    }

    private Integer mapWeeklyHours(String rawDailyHours) {
        Double value = parseDouble(rawDailyHours);
        if (value == null) {
            return null;
        }
        if (value < 1.0d) {
            return 3;
        }
        return Math.min((int) Math.round(value * 7.0d), 40);
    }

    private BigDecimal toRiskScore(String riskLevel) {
        if (riskLevel == null) {
            return null;
        }
        return switch (riskLevel) {
            case "HIGH" -> BigDecimal.valueOf(0.9d);
            case "MEDIUM" -> BigDecimal.valueOf(0.6d);
            case "LOW" -> BigDecimal.valueOf(0.3d);
            default -> null;
        };
    }

    private String normalizeRiskLevel(String rawRiskLevel) {
        String normalized = normalizeKey(firstNonBlank(rawRiskLevel, properties.getDefaultRiskLevel()));
        if (normalized.contains("high") || normalized.contains("\uC0C1")) {
            return "HIGH";
        }
        if (normalized.contains("low") || normalized.contains("\uD558")) {
            return "LOW";
        }
        return "MEDIUM";
    }

    private List<String> parseList(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        try {
            if (raw.trim().startsWith("[")) {
                List<String> values = objectMapper.readValue(raw, STRING_LIST_TYPE);
                return values.stream()
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(item -> !item.isBlank())
                        .distinct()
                        .toList();
            }
        } catch (Exception ignored) {
        }

        LinkedHashSet<String> values = Arrays.stream(SPLIT_PATTERN.split(raw.trim()))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);

        return values.stream().toList();
    }

    private Integer parseInteger(String raw) {
        Double value = parseDouble(raw);
        return value == null ? null : (int) Math.round(value);
    }

    private Double parseDouble(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String cleaned = NUMBER_PATTERN.matcher(raw).replaceAll("");
        if (cleaned.isBlank() || "-".equals(cleaned) || ".".equals(cleaned)) {
            return null;
        }
        try {
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Boolean parseBoolean(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String normalized = normalizeKey(raw);
        if (List.of(
                "true", "y", "yes", "1", "mainjob",
                "\uC7AC\uC9C1\uC911",
                "\uC788\uC74C",
                "\uC608"
        ).contains(normalized)) {
            return true;
        }
        if (List.of(
                "false", "n", "no", "0",
                "\uC5C6\uC74C",
                "\uC544\uB2C8\uC624"
        ).contains(normalized)) {
            return false;
        }
        return null;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to serialize import JSON payload.", exception);
        }
    }

    private String normalizeCategoryKey(String value) {
        String normalized = normalizeKey(value);
        return normalized.replaceAll("[\\s_\\-·./]+", "");
    }

    private String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String firstItem(List<String> values) {
        return values.isEmpty() ? null : values.get(0);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private String prefix(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength).trim();
    }

    private record ImportedRow(
            Long id,
            String externalId,
            String category,
            String categorySlug,
            String duration,
            String dailyHours,
            String investAmount,
            String revenueAmount,
            String hasMainJob,
            String failureReasons,
            String difficulties,
            String freeText,
            String summary,
            String keywords,
            String failureCategory,
            String riskLevel,
            String source,
            String link,
            String postDate,
            String caseStatus
    ) {
        private static ImportedRow from(Map<String, String> row) {
            Map<String, String> normalized = new LinkedHashMap<>();
            row.forEach((key, value) -> normalized.put(normalizeHeader(key), value));
            return new ImportedRow(
                    parseLong(normalized.get("id")),
                    firstValue(normalized, "case_id", "external_id", "id"),
                    firstValue(normalized, "category", "category_raw"),
                    firstValue(normalized, "category_slug"),
                    firstValue(normalized, "duration", "duration_months"),
                    firstValue(normalized, "daily_hours", "dailyhours"),
                    firstValue(normalized, "invest_amount", "investment_amount"),
                    firstValue(normalized, "revenue_amount", "monthly_revenue"),
                    firstValue(normalized, "has_main_job", "main_job"),
                    firstValue(normalized, "failure_reasons", "failure_reason"),
                    firstValue(normalized, "difficulties", "difficulty"),
                    firstValue(normalized, "free_text", "content", "body", "full_text"),
                    firstValue(normalized, "summary", "title", "description"),
                    firstValue(normalized, "keywords", "keyword"),
                    firstValue(normalized, "failure_category"),
                    firstValue(normalized, "risk_level"),
                    firstValue(normalized, "source"),
                    firstValue(normalized, "link", "url"),
                    firstValue(normalized, "postdate", "post_date"),
                    firstValue(normalized, "case_status")
            );
        }

        private static String normalizeHeader(String value) {
            return value == null ? "" : value.trim().toLowerCase(Locale.ROOT).replace("-", "_").replace(" ", "_");
        }

        private static String firstValue(Map<String, String> values, String... keys) {
            for (String key : keys) {
                String value = values.get(key);
                if (value != null) {
                    return value;
                }
            }
            return null;
        }

        private static Long parseLong(String raw) {
            if (raw == null || raw.isBlank()) {
                return null;
            }
            String cleaned = NUMBER_PATTERN.matcher(raw).replaceAll("");
            if (cleaned.isBlank()) {
                return null;
            }
            try {
                return Long.parseLong(cleaned);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
    }
}
