package com.failforward.backend.domain.experience.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.api.PageInfo;
import com.failforward.backend.common.config.ShareProperties;
import com.failforward.backend.common.privacy.SensitiveDataMaskingService;
import com.failforward.backend.common.security.AdminAccessPolicy;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.service.AIAnalysisService;
import com.failforward.backend.domain.bookmark.repository.ExperienceBookmarkRepository;
import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.service.CategoryService;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.view.service.UserExperienceViewService;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExperienceService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final List<SuccessDraft> SUCCESS_DRAFTS = loadSuccessDrafts();

    private final FailureExperienceRepository experienceRepository;
    private final AIAnalysisService aiAnalysisService;
    private final CurrentUserProvider currentUserProvider;
    private final AdminAccessPolicy adminAccessPolicy;
    private final CategoryService categoryService;
    private final ExperienceRequestSupport requestSupport;
    private final ExperienceComparisonSupport comparisonSupport;
    private final SensitiveDataMaskingService maskingService;
    private final UserExperienceViewService userExperienceViewService;
    private final EntityManager entityManager;
    private final ExperienceBookmarkRepository bookmarkRepository;
    private final ShareProperties shareProperties;
    private final ExperienceShareImageService experienceShareImageService;
    private final ExperienceImageStorageService experienceImageStorageService;
    private final ExperienceAiSupplementComposer experienceAiSupplementComposer;

    @Transactional
    public ExperienceDtos.ExperienceResponse create(ExperienceDtos.ExperienceCreateRequest request) {
        User author = currentUserProvider.getCurrentUserEntity();
        validateVerifiedWriter(author);
        ExperiencePayload payload = buildPayload(request);
        log.info("Experience creation started for userId={}", author.getId());

        FailureExperience saved = experienceRepository.save(FailureExperience.create(
                author,
                payload.category(),
                payload.title(),
                payload.content(),
                payload.businessType(),
                payload.investmentAmount(),
                payload.durationMonths(),
                payload.weeklyHours(),
                payload.averageDailyHours(),
                payload.isConcurrentWithMainJob(),
                payload.monthlyRevenue(),
                payload.failureReason(),
                payload.failureReasonsJson(),
                payload.difficultiesJson(),
                payload.difficultyEtc(),
                payload.difficultyExtra(),
                payload.targetMarket(),
                payload.marketingChannelsJson(),
                payload.lessonsLearned(),
                payload.wouldRetry(),
                payload.structuredDataJson(),
                "FAILURE"
        ));

        var analysis = aiAnalysisService.analyzeAfterExperienceCreate(saved).orElse(null);
        log.info("Experience created successfully with id={}", saved.getId());
        return ExperienceDtos.ExperienceResponse.from(saved, analysis, resolveBookmarkCount(saved.getId()));
    }

    @Transactional
    public ExperienceDtos.ExperienceResponse update(Long experienceId, ExperienceDtos.ExperienceUpdateRequest request) {
        FailureExperience experience = getExperienceEntity(experienceId);
        validateOwner(experience);
        validateVerifiedWriter(currentUserProvider.getCurrentUserEntity());

        ExperiencePayload payload = buildPayload(request);
        experience.update(
                payload.category(),
                payload.title(),
                payload.content(),
                payload.businessType(),
                payload.investmentAmount(),
                payload.durationMonths(),
                payload.weeklyHours(),
                payload.averageDailyHours(),
                payload.isConcurrentWithMainJob(),
                payload.monthlyRevenue(),
                payload.failureReason(),
                payload.failureReasonsJson(),
                payload.difficultiesJson(),
                payload.difficultyEtc(),
                payload.difficultyExtra(),
                payload.targetMarket(),
                payload.marketingChannelsJson(),
                payload.lessonsLearned(),
                payload.wouldRetry(),
                payload.structuredDataJson(),
                "FAILURE"
        );

        FailureExperience saved = experienceRepository.save(experience);
        return ExperienceDtos.ExperienceResponse.from(
                saved,
                aiAnalysisService.reanalyzeAfterExperienceUpdate(saved).orElse(null),
                resolveBookmarkCount(saved.getId())
        );
    }

    @Transactional
    public void delete(Long experienceId) {
        FailureExperience experience = getExperienceEntity(experienceId);
        validateOwnerOrAdmin(experience);
        validateVerifiedWriter(currentUserProvider.getCurrentUserEntity());
        experienceRepository.delete(experience);
    }

    public ExperienceDtos.ExperienceListPayload getList(
            int page,
            int size,
            String failureReason,
            String q,
            String sort,
            Long categoryId,
            Integer durationMonthsMin,
            Integer durationMonthsMax,
            Long investmentAmountMin,
            Long investmentAmountMax
    ) {
        validateSearchCriteria(durationMonthsMin, durationMonthsMax, investmentAmountMin, investmentAmountMax);
        String normalizedSort = normalizeSort(sort);
        String normalizedQuery = normalizeFilter(q);
        String normalizedFailureReason = normalizeFilter(failureReason);
        List<FailureExperience> filtered = "popular".equals(normalizedSort)
                ? experienceRepository.searchPublicPopular(
                normalizedQuery,
                categoryId,
                normalizedFailureReason,
                durationMonthsMin,
                durationMonthsMax,
                investmentAmountMin,
                investmentAmountMax
        )
                : experienceRepository.searchPublicLatest(
                normalizedQuery,
                categoryId,
                normalizedFailureReason,
                durationMonthsMin,
                durationMonthsMax,
                investmentAmountMin,
                investmentAmountMax
        );

        PaginationWindow pagination = buildPagination(page, size, filtered.size());
        List<ExperienceDtos.ExperienceResponse> experiences = mapExperienceResponses(
                filtered.subList(pagination.fromIndex(), pagination.toIndex())
        );
        return new ExperienceDtos.ExperienceListPayload(
                experiences,
                new PageInfo(
                        pagination.page(),
                        pagination.size(),
                        filtered.size(),
                        pagination.totalPages(),
                        pagination.hasNext()
                )
        );
    }

    @Transactional
    public ExperienceDtos.ExperienceResponse getDetail(Long experienceId) {
        FailureExperience experience = getExperienceEntity(experienceId);
        experience.increaseViewCount();
        userExperienceViewService.recordView(experience);
        FailureExperience saved = experienceRepository.save(experience);
        return ExperienceDtos.ExperienceResponse.from(
                saved,
                aiAnalysisService.findByExperience(saved).orElse(null),
                resolveBookmarkCount(saved.getId())
        );
    }

    public List<ExperienceDtos.SimilarityMatchResponse> getSimilar(Long experienceId, int limit) {
        FailureExperience target = getExperienceEntity(experienceId);
        return experienceRepository.findAllByIsPublicTrueOrderByCreatedAtDesc().stream()
                .filter(candidate -> !candidate.getId().equals(experienceId))
                .map(candidate -> toSimilarity(target, candidate))
                .sorted((left, right) -> Double.compare(right.similarityScore(), left.similarityScore()))
                .limit(Math.max(limit, 1))
                .toList();
    }

    public List<ExperienceDtos.ExperienceResponse> getRelatedSuccessCases(Long experienceId, int limit) {
        FailureExperience target = getExperienceEntity(experienceId);
        int safeLimit = Math.max(limit, 1);
        entityManager.clear();
        AiAnalysis targetAnalysis = aiAnalysisService.findByExperience(target).orElse(null);
        return experienceRepository.findPublicSuccessByCategory(
                        target.getId(),
                        target.getCategory().getId(),
                        PageRequest.of(0, Math.max(safeLimit * 3, 12))
                ).stream()
                .sorted(
                        java.util.Comparator
                                .comparingInt((FailureExperience experience) -> scoreRelatedSuccessCase(target, targetAnalysis, experience))
                                .reversed()
                                .thenComparing(
                                        FailureExperience::getCreatedAt,
                                        java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())
                                )
                )
                .limit(safeLimit)
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        aiAnalysisService.findByExperience(experience).orElse(null),
                        resolveBookmarkCount(experience.getId()),
                        buildSuccessRecommendationReason(target, targetAnalysis, experience)
                ))
                .toList();
    }

    public ExperienceDtos.CompareResponse compare(List<Long> experienceIds) {
        if (experienceIds == null || experienceIds.size() < 2) {
            throw new BadRequestException("At least two experience IDs are required.");
        }

        List<FailureExperience> experiences = experienceIds.stream()
                .distinct()
                .map(this::getExperienceEntity)
                .toList();

        List<ExperienceDtos.ExperienceResponse> payload = experiences.stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        aiAnalysisService.findByExperience(experience).orElse(null),
                        resolveBookmarkCount(experience.getId())
                ))
                .toList();

        List<String> commonPatterns = comparisonSupport.buildCommonPatterns(experiences);

        List<String> differences = comparisonSupport.buildDifferences(experiences);

        return new ExperienceDtos.CompareResponse(
                payload,
                commonPatterns,
                differences,
                List.of(
                        "Validate customer demand before spending more budget.",
                        "Reduce scope and test faster with a smaller release."
                )
        );
    }

    public ExperienceDtos.ExperienceShareResponse getShare(Long experienceId) {
        FailureExperience experience = getExperienceEntity(experienceId);
        List<String> imageUrls = ExperienceDtos.extractImageUrls(experience);
        String shareUrl = buildSharePageUrl(experienceId);
        String downloadImageUrl = buildShareImageUrl(experienceId);
        String webUrl = buildWebDetailUrl(experienceId);

        return new ExperienceDtos.ExperienceShareResponse(
                experience.getId(),
                sanitizeShareTitle(experience),
                buildShareDescription(experience),
                shareUrl,
                imageUrls.isEmpty() ? null : imageUrls.get(0),
                downloadImageUrl,
                webUrl,
                experience.getCaseStatus(),
                experience.getCategory().getName()
        );
    }

    public ExperienceDtos.ExperienceSharePageResponse getSharePage(Long experienceId) {
        ExperienceDtos.ExperienceShareResponse share = getShare(experienceId);
        return new ExperienceDtos.ExperienceSharePageResponse(
                share.experienceId(),
                share.title(),
                share.description(),
                share.shareUrl(),
                share.downloadImageUrl(),
                share.webUrl(),
                share.categoryName()
        );
    }

    public byte[] createShareImage(Long experienceId) {
        FailureExperience experience = getExperienceEntity(experienceId);
        return experienceShareImageService.renderPng(
                experience,
                sanitizeShareTitle(experience),
                buildShareDescription(experience)
        );
    }

    @Transactional
    public ExperienceDtos.ExperienceImageUploadResponse uploadExperienceImages(
            List<org.springframework.web.multipart.MultipartFile> files,
            String publicBaseUrl
    ) {
        currentUserProvider.getCurrentUserEntity();
        return new ExperienceDtos.ExperienceImageUploadResponse(
                experienceImageStorageService.storeAll(files, publicBaseUrl)
        );
    }

    public FailureExperience getExperienceEntity(Long experienceId) {
        return experienceRepository.findWithUserAndCategoryById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));
    }

    private List<ExperienceDtos.ExperienceResponse> mapExperienceResponses(List<FailureExperience> experiences) {
        return experiences.stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        aiAnalysisService.findByExperience(experience).orElse(null),
                        resolveBookmarkCount(experience.getId())
                ))
                .toList();
    }

    public List<ExperienceDtos.ExperienceResponse> getSuccessCases(Long categoryId, int limit) {
        int safeLimit = Math.max(limit, 1);
        entityManager.clear();
        List<FailureExperience> experiences = categoryId == null
                ? experienceRepository.findPublicSuccessCasesLatest(PageRequest.of(0, safeLimit))
                : experienceRepository.findPublicSuccessCasesLatestByCategory(categoryId, PageRequest.of(0, safeLimit));

        return experiences.stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        aiAnalysisService.findByExperience(experience).orElse(null),
                        resolveBookmarkCount(experience.getId())
                ))
                .toList();
    }

    public ExperienceDtos.ExperienceResponse getSuccessCaseDetail(Long successCaseId) {
        FailureExperience experience = getExperienceEntity(successCaseId);
        if (!"SUCCESS".equalsIgnoreCase(experience.getCaseStatus())) {
            throw new NotFoundException("Success case not found.");
        }

        return ExperienceDtos.ExperienceResponse.from(
                experience,
                aiAnalysisService.findByExperience(experience).orElse(null),
                resolveBookmarkCount(experience.getId())
        );
    }

    private int resolveBookmarkCount(Long experienceId) {
        return bookmarkRepository.countByExperienceId(experienceId);
    }

    private String buildSuccessRecommendationReason(
            FailureExperience target,
            AiAnalysis targetAnalysis,
            FailureExperience candidate
    ) {
        List<String> reasons = new ArrayList<>();
        if (sameValue(target.getFailureReason(), candidate.getFailureReason())) {
            reasons.add("실패 원인이 유사합니다");
        }
        if (sameValue(target.getBusinessType(), candidate.getBusinessType())) {
            reasons.add("같은 부업 유형에서 성공 전환한 사례입니다");
        }

        AiAnalysis candidateAnalysis = aiAnalysisService.findByExperience(candidate).orElse(null);
        List<String> matchedKeywords = targetAnalysis == null || candidateAnalysis == null
                ? List.of()
                : sharedKeywords(
                        parseLooseJsonList(targetAnalysis.getFailReasonTags()),
                        parseLooseJsonList(candidateAnalysis.getFailReasonTags()),
                        2
                );
        if (!matchedKeywords.isEmpty()) {
            reasons.add(String.join(", ", matchedKeywords) + " 이슈가 함께 나타납니다");
        }
        if (targetAnalysis != null && candidateAnalysis != null
                && sameValue(targetAnalysis.getFailureCategory(), candidateAnalysis.getFailureCategory())) {
            reasons.add("AI 분석상 같은 실패 유형에 가까운 사례입니다");
        }

        findMatchingSuccessDraft(target, targetAnalysis)
                .flatMap(draft -> draft.successFactors() == null || draft.successFactors().isEmpty()
                        ? Optional.empty()
                        : Optional.ofNullable(draft.successFactors().get(0)))
                .map(SuccessFactorDraft::title)
                .map(String::trim)
                .filter(title -> !title.isBlank())
                .ifPresent(title -> reasons.add("'" + title + "' 요소가 성공 자산에서 반복됩니다"));

        if (reasons.isEmpty()) {
            return "같은 카테고리의 성공 사례 중에서 입력한 실패 맥락과 가장 가까운 사례를 우선 추천했습니다.";
        }

        String prefix = candidate.getTitle() == null || candidate.getTitle().isBlank()
                ? "이 성공 사례는 "
                : "'" + candidate.getTitle().trim() + "' 사례는 ";
        return prefix + String.join(", ", reasons) + ".";
    }

    private int scoreRelatedSuccessCase(
            FailureExperience target,
            AiAnalysis targetAnalysis,
            FailureExperience candidate
    ) {
        int score = 0;

        if (sameValue(target.getBusinessType(), candidate.getBusinessType())) {
            score += 10;
        }
        if (sameValue(target.getFailureReason(), candidate.getFailureReason())) {
            score += 18;
        }
        if (candidate.getLessonsLearned() != null && !candidate.getLessonsLearned().isBlank()) {
            score += 8;
        }

        AiAnalysis candidateAnalysis = aiAnalysisService.findByExperience(candidate).orElse(null);
        if (targetAnalysis != null && candidateAnalysis != null) {
            if (sameValue(targetAnalysis.getFailureCategory(), candidateAnalysis.getFailureCategory())) {
                score += 24;
            }
            if (sameValue(targetAnalysis.getRiskLevel(), candidateAnalysis.getRiskLevel())) {
                score += 8;
            }
            score += Math.min(overlapCount(parseLooseJsonList(targetAnalysis.getFailReasonTags()), parseLooseJsonList(candidateAnalysis.getFailReasonTags())) * 12, 36);
            score += Math.min(overlapCount(parseLooseJsonList(targetAnalysis.getSummaryList()), parseLooseJsonList(candidateAnalysis.getSummaryList())) * 6, 18);
        }

        java.util.List<String> targetKeywords = targetAnalysis == null
                ? java.util.List.of()
                : parseLooseJsonList(targetAnalysis.getFailReasonTags());
        if (containsAnyKeyword(candidate.getLessonsLearned(), targetKeywords)) {
            score += 10;
        }
        if (containsAnyKeyword(candidate.getContent(), targetKeywords)) {
            score += 6;
        }

        return score;
    }

    private int overlapCount(java.util.List<String> left, java.util.List<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0;
        }
        java.util.Set<String> normalized = new java.util.HashSet<>();
        for (String item : left) {
            String value = normalizeToken(item);
            if (value != null) {
                normalized.add(value);
            }
        }

        int count = 0;
        for (String item : right) {
            String value = normalizeToken(item);
            if (value != null && normalized.contains(value)) {
                count++;
            }
        }
        return count;
    }

    private boolean containsAnyKeyword(String text, java.util.List<String> keywords) {
        if (text == null || text.isBlank() || keywords.isEmpty()) {
            return false;
        }
        String normalizedText = text.trim().toLowerCase();
        for (String keyword : keywords) {
            String value = normalizeToken(keyword);
            if (value != null && normalizedText.contains(value)) {
                return true;
            }
        }
        return false;
    }

    private java.util.List<String> parseLooseJsonList(String value) {
        if (value == null || value.isBlank()) {
            return java.util.List.of();
        }
        String normalized = value.replace("[", "").replace("]", "").replace("\"", "");
        if (normalized.isBlank()) {
            return java.util.List.of();
        }
        return java.util.Arrays.stream(normalized.split(","))
                .map(this::normalizeToken)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
    }

    private boolean sameValue(String left, String right) {
        String normalizedLeft = normalizeToken(left);
        String normalizedRight = normalizeToken(right);
        return normalizedLeft != null && normalizedLeft.equals(normalizedRight);
    }

    private String normalizeToken(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase();
        return normalized.isBlank() ? null : normalized;
    }

    private List<String> sharedKeywords(List<String> left, List<String> right, int limit) {
        if (left.isEmpty() || right.isEmpty()) {
            return List.of();
        }
        java.util.Set<String> rightSet = new java.util.LinkedHashSet<>(right);
        List<String> result = new ArrayList<>();
        for (String item : left) {
            if (item != null && rightSet.contains(item) && !result.contains(item)) {
                result.add(item);
                if (result.size() >= limit) {
                    break;
                }
            }
        }
        return result;
    }

    private Optional<SuccessDraft> findMatchingSuccessDraft(FailureExperience target, AiAnalysis targetAnalysis) {
        if (SUCCESS_DRAFTS.isEmpty()) {
            return Optional.empty();
        }
        String categoryName = target.getCategory() == null ? null : target.getCategory().getName();
        List<String> targetKeywords = targetAnalysis == null
                ? List.of()
                : parseLooseJsonList(targetAnalysis.getFailReasonTags());

        return SUCCESS_DRAFTS.stream()
                .filter(draft -> categoryMatches(categoryName, draft.categoryInferred()))
                .sorted(java.util.Comparator.comparingInt((SuccessDraft draft) -> draftMatchScore(draft, targetKeywords)).reversed())
                .findFirst();
    }

    private int draftMatchScore(SuccessDraft draft, List<String> targetKeywords) {
        int score = 0;
        if (draft.successFactors() != null) {
            for (SuccessFactorDraft factor : draft.successFactors()) {
                if (factor == null) {
                    continue;
                }
                if (containsAnyKeyword(factor.title(), targetKeywords) || containsAnyKeyword(factor.description(), targetKeywords)) {
                    score += 10;
                }
            }
        }
        if (draft.differenceFromFailures() != null && containsAnyKeyword(draft.differenceFromFailures(), targetKeywords)) {
            score += 8;
        }
        return score;
    }

    private boolean categoryMatches(String categoryName, String categoryInferred) {
        String left = normalizeCategoryKey(categoryName);
        String right = normalizeCategoryKey(categoryInferred);
        return left != null && left.equals(right);
    }

    private String normalizeCategoryKey(String value) {
        String normalized = normalizeToken(value);
        if (normalized == null) {
            return null;
        }
        return switch (normalized) {
            case "콘텐츠", "콘텐츠 제작", "콘텐츠/sns", "content-sns" -> "content-sns";
            case "디지털 상품", "digital-products" -> "digital-products";
            case "플랫폼 노동", "platform-labor" -> "platform-labor";
            case "재능 판매", "재능/프리랜서", "talent-freelance" -> "talent-freelance";
            case "온라인 판매", "온라인 커머스", "online-commerce" -> "online-commerce";
            case "오프라인 부업", "offline-sidejob" -> "offline-sidejob";
            case "투자", "investment" -> "investment";
            default -> normalized;
        };
    }

    private static List<SuccessDraft> loadSuccessDrafts() {
        try {
            Path path = Path.of("D:\\Codex_Folder\\Sidepick\\ai\\data\\success_analysis_drafts.json");
            if (!Files.exists(path)) {
                return List.of();
            }
            SuccessDraftEnvelope envelope = OBJECT_MAPPER.readValue(Files.readString(path), SuccessDraftEnvelope.class);
            if (envelope == null || envelope.drafts() == null) {
                return List.of();
            }
            return envelope.drafts();
        } catch (Exception exception) {
            log.warn("success_drafts_load_failed detail={}", exception.getMessage());
            return List.of();
        }
    }

    private record SuccessDraftEnvelope(
            List<SuccessDraft> drafts
    ) {
    }

    private record SuccessDraft(
            @JsonProperty("category_inferred")
            String categoryInferred,
            @JsonProperty("success_factors")
            List<SuccessFactorDraft> successFactors,
            @JsonProperty("difference_from_failures")
            String differenceFromFailures
    ) {
    }

    private record SuccessFactorDraft(
            String title,
            String description
    ) {
    }

    private String sanitizeShareTitle(FailureExperience experience) {
        String title = experience.getTitle() == null ? "" : experience.getTitle().trim();
        if (!title.isBlank()) {
            return title;
        }
        return experience.getCategory().getName() + " 실패 사례";
    }

    private String buildShareDescription(FailureExperience experience) {
        String content = experience.getContent() == null ? "" : experience.getContent();
        String noMarkdownImages = content.replaceAll("!\\[[^\\]]*]\\(([^)]+)\\)", " ");
        String noHtmlImages = noMarkdownImages.replaceAll("<img[^>]+>", " ");
        String normalized = noHtmlImages.replaceAll("\\s+", " ").trim();
        if (normalized.isBlank()) {
            normalized = "실패 경험과 다음 시도를 위한 핵심 포인트를 확인해보세요.";
        }
        if (normalized.length() <= 120) {
            return normalized;
        }
        return normalized.substring(0, 117) + "...";
    }

    private String buildSharePageUrl(Long experienceId) {
        String baseUrl = trimTrailingSlash(shareProperties.publicBaseUrl(), "http://localhost:8081");
        return baseUrl + "/api/experiences/" + experienceId + "/share-page";
    }

    private String buildShareImageUrl(Long experienceId) {
        String baseUrl = trimTrailingSlash(shareProperties.publicBaseUrl(), "http://localhost:8081");
        return baseUrl + "/api/experiences/" + experienceId + "/share-image";
    }

    private String buildWebDetailUrl(Long experienceId) {
        String baseUrl = trimTrailingSlash(shareProperties.webBaseUrl());
        return baseUrl + "/experiences/" + experienceId;
    }

    private String trimTrailingSlash(String value) {
        return trimTrailingSlash(value, "http://localhost:5173");
    }

    private String trimTrailingSlash(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }

    private PaginationWindow buildPagination(int page, int size, int totalElements) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : size;
        int fromIndex = Math.min(safePage * safeSize, totalElements);
        int toIndex = Math.min(fromIndex + safeSize, totalElements);
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / safeSize);
        boolean hasNext = toIndex < totalElements;
        return new PaginationWindow(safePage, safeSize, fromIndex, toIndex, totalPages, hasNext);
    }

    private ExperiencePayload buildPayload(ExperienceDtos.ExperienceCreateRequest request) {
        return buildPayload(
                request.title(),
                request.content(),
                request.categoryId(),
                request.businessType(),
                request.investmentAmount(),
                request.durationMonths(),
                request.weeklyHours(),
                request.averageDailyHours(),
                request.isConcurrentWithMainJob(),
                request.monthlyRevenue(),
                request.failureReason(),
                request.failureReasons(),
                request.difficulties(),
                request.difficultyEtc(),
                request.difficultyExtra(),
                request.targetMarket(),
                request.marketingChannels(),
                request.imageUrls(),
                request.lessonsLearned(),
                request.wouldRetry(),
                request.aiSupplement()
        );
    }

    private ExperiencePayload buildPayload(ExperienceDtos.ExperienceUpdateRequest request) {
        return buildPayload(
                request.title(),
                request.content(),
                request.categoryId(),
                request.businessType(),
                request.investmentAmount(),
                request.durationMonths(),
                request.weeklyHours(),
                request.averageDailyHours(),
                request.isConcurrentWithMainJob(),
                request.monthlyRevenue(),
                request.failureReason(),
                request.failureReasons(),
                request.difficulties(),
                request.difficultyEtc(),
                request.difficultyExtra(),
                request.targetMarket(),
                request.marketingChannels(),
                request.imageUrls(),
                request.lessonsLearned(),
                request.wouldRetry(),
                request.aiSupplement()
        );
    }

    private ExperiencePayload buildPayload(
            String title,
            String content,
            Long categoryId,
            String businessType,
            Long investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Long monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String difficultyEtc,
            String difficultyExtra,
            String targetMarket,
            List<String> marketingChannels,
            List<String> imageUrls,
            String lessonsLearned,
            Boolean wouldRetry,
            ExperienceDtos.AiSupplementRequest aiSupplement
    ) {
        BusinessCategory category = categoryService.getCategory(categoryId);
        String composedContent = experienceAiSupplementComposer.composeContent(content, aiSupplement);
        requestSupport.validateWriteRequest(
                composedContent,
                investmentAmount,
                durationMonths,
                monthlyRevenue,
                failureReason,
                failureReasons
        );
        String resolvedBusinessType = requestSupport.resolveBusinessType(businessType, category.getName());
        Integer resolvedDurationMonths = requestSupport.resolveDurationMonths(durationMonths);
        Integer resolvedWeeklyHours = requestSupport.resolveWeeklyHours(weeklyHours);
        List<String> resolvedFailureReasons = requestSupport.normalizeTextList(failureReasons);
        List<String> resolvedDifficulties = requestSupport.normalizeTextList(difficulties);
        String resolvedDifficultyEtc = requestSupport.normalizeOptionalText(difficultyEtc);
        String resolvedDifficultyExtra = requestSupport.normalizeOptionalText(difficultyExtra);
        String resolvedFailureReason = requestSupport.resolveFailureReason(failureReason, resolvedFailureReasons);
        String resolvedTitle = requestSupport.resolveTitle(title, resolvedBusinessType);
        String resolvedLessons = aiSupplement != null
                ? maskingService.maskText(composedContent)
                : requestSupport.resolveLessons(lessonsLearned, composedContent);
        var structured = requestSupport.buildStructuredData(
                categoryId,
                category.getName(),
                resolvedDurationMonths,
                resolvedWeeklyHours,
                averageDailyHours,
                isConcurrentWithMainJob,
                monthlyRevenue,
                resolvedFailureReasons,
                resolvedDifficulties,
                resolvedDifficultyEtc,
                resolvedDifficultyExtra,
                targetMarket,
                wouldRetry,
                imageUrls == null ? List.of() : imageUrls.stream().filter(requestSupport::hasText).toList()
        );
        Map<String, Object> mutableStructured = new LinkedHashMap<>(structured);
        if (aiSupplement != null) {
            mutableStructured.put("originalContent", aiSupplement.originalContent());
            mutableStructured.put("composedFromAiSupplement", true);
            mutableStructured.put("aiSupplementAnswers", experienceAiSupplementComposer.toStructuredAnswers(aiSupplement));
        }
        Map<String, Object> maskedStructured = maskingService.maskObjectMap(mutableStructured);

        return new ExperiencePayload(
                category,
                resolvedTitle,
                maskingService.maskText(composedContent),
                maskingService.maskText(resolvedBusinessType),
                investmentAmount,
                resolvedDurationMonths,
                resolvedWeeklyHours,
                maskingService.maskText(averageDailyHours),
                isConcurrentWithMainJob,
                monthlyRevenue,
                resolvedFailureReason,
                requestSupport.writeJson(resolvedFailureReasons),
                requestSupport.writeJson(resolvedDifficulties),
                resolvedDifficultyEtc,
                resolvedDifficultyExtra,
                maskingService.maskText(targetMarket),
                marketingChannels == null ? List.of() : marketingChannels.stream().map(maskingService::maskText).toList(),
                resolvedLessons,
                wouldRetry != null ? wouldRetry : Boolean.FALSE,
                requestSupport.writeJson(marketingChannels == null ? List.of() : marketingChannels.stream().map(maskingService::maskText).toList()),
                requestSupport.writeJson(maskedStructured)
        );
    }

    private ExperienceDtos.SimilarityMatchResponse toSimilarity(FailureExperience target, FailureExperience candidate) {
        ExperienceComparisonSupport.SimilarityDetails similarity = comparisonSupport.calculateSimilarity(target, candidate);

        return new ExperienceDtos.SimilarityMatchResponse(
                ExperienceDtos.ExperienceResponse.from(
                        candidate,
                        aiAnalysisService.findByExperience(candidate).orElse(null),
                        resolveBookmarkCount(candidate.getId())
                ),
                similarity.score(),
                similarity.matching(),
                similarity.differences()
        );
    }

    private void validateOwner(FailureExperience experience) {
        User currentUser = currentUserProvider.getCurrentUserEntity();
        if (!experience.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only modify your own experience.");
        }
    }

    private void validateOwnerOrAdmin(FailureExperience experience) {
        User currentUser = currentUserProvider.getCurrentUserEntity();
        if (experience.getUser().getId().equals(currentUser.getId())) {
            return;
        }
        if (adminAccessPolicy.isAdmin(currentUser)) {
            return;
        }
        throw new AccessDeniedException("You can only delete your own experience unless you are an admin.");
    }

    private void validateVerifiedWriter(User user) {
        if (user.requiresEmailVerification()) {
            throw new AccessDeniedException("Email verification is required to write experiences.");
        }
    }

    private String normalizeQuery(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeSort(String value) {
        return value == null ? "latest" : value.trim().toLowerCase();
    }

    private String normalizeFilter(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateSearchCriteria(
            Integer durationMonthsMin,
            Integer durationMonthsMax,
            Long investmentAmountMin,
            Long investmentAmountMax
    ) {
        if (durationMonthsMin != null && durationMonthsMin < 0) {
            throw new BadRequestException("Minimum duration must be zero or greater.");
        }
        if (durationMonthsMax != null && durationMonthsMax < 0) {
            throw new BadRequestException("Maximum duration must be zero or greater.");
        }
        if (investmentAmountMin != null && investmentAmountMin < 0) {
            throw new BadRequestException("Minimum investment amount must be zero or greater.");
        }
        if (investmentAmountMax != null && investmentAmountMax < 0) {
            throw new BadRequestException("Maximum investment amount must be zero or greater.");
        }
        if (durationMonthsMin != null && durationMonthsMax != null && durationMonthsMin > durationMonthsMax) {
            throw new BadRequestException("Minimum duration cannot exceed maximum duration.");
        }
        if (investmentAmountMin != null && investmentAmountMax != null && investmentAmountMin > investmentAmountMax) {
            throw new BadRequestException("Minimum investment amount cannot exceed maximum investment amount.");
        }
    }

    private record ExperiencePayload(
            BusinessCategory category,
            String title,
            String content,
            String businessType,
            Long investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Long monthlyRevenue,
            String failureReason,
            String failureReasonsJson,
            String difficultiesJson,
            String difficultyEtc,
            String difficultyExtra,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry,
            String marketingChannelsJson,
            String structuredDataJson
    ) {
    }

    private record PaginationWindow(
            int page,
            int size,
            int fromIndex,
            int toIndex,
            int totalPages,
            boolean hasNext
    ) {
    }
}
