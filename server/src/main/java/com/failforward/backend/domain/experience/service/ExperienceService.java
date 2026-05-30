package com.failforward.backend.domain.experience.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.api.PageInfo;
import com.failforward.backend.common.privacy.SensitiveDataMaskingService;
import com.failforward.backend.common.security.AdminAccessPolicy;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.analysis.service.AIAnalysisService;
import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.service.CategoryService;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.view.service.UserExperienceViewService;
import jakarta.persistence.EntityManager;
import java.util.List;
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
        return ExperienceDtos.ExperienceResponse.from(saved, analysis);
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
        return ExperienceDtos.ExperienceResponse.from(saved, aiAnalysisService.reanalyzeAfterExperienceUpdate(saved).orElse(null));
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
            Integer investmentAmountMin,
            Integer investmentAmountMax
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
        return ExperienceDtos.ExperienceResponse.from(saved, aiAnalysisService.findByExperience(saved).orElse(null));
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
        return experienceRepository.findPublicSuccessByCategory(
                        target.getId(),
                        target.getCategory().getId(),
                        PageRequest.of(0, safeLimit)
                ).stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        aiAnalysisService.findByExperience(experience).orElse(null)
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
                        aiAnalysisService.findByExperience(experience).orElse(null)
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

    public FailureExperience getExperienceEntity(Long experienceId) {
        return experienceRepository.findWithUserAndCategoryById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));
    }

    private List<ExperienceDtos.ExperienceResponse> mapExperienceResponses(List<FailureExperience> experiences) {
        return experiences.stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        aiAnalysisService.findByExperience(experience).orElse(null)
                ))
                .toList();
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
                request.lessonsLearned(),
                request.wouldRetry()
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
                request.lessonsLearned(),
                request.wouldRetry()
        );
    }

    private ExperiencePayload buildPayload(
            String title,
            String content,
            Long categoryId,
            String businessType,
            Integer investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Integer monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String difficultyEtc,
            String difficultyExtra,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry
    ) {
        BusinessCategory category = categoryService.getCategory(categoryId);
        requestSupport.validateWriteRequest(
                content,
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
        String resolvedLessons = requestSupport.resolveLessons(lessonsLearned, content);
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
                wouldRetry
        );

        return new ExperiencePayload(
                category,
                resolvedTitle,
                maskingService.maskText(content),
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
                requestSupport.writeJson(structured)
        );
    }

    private ExperienceDtos.SimilarityMatchResponse toSimilarity(FailureExperience target, FailureExperience candidate) {
        ExperienceComparisonSupport.SimilarityDetails similarity = comparisonSupport.calculateSimilarity(target, candidate);

        return new ExperienceDtos.SimilarityMatchResponse(
                ExperienceDtos.ExperienceResponse.from(
                        candidate,
                        aiAnalysisService.findByExperience(candidate).orElse(null)
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
            Integer investmentAmountMin,
            Integer investmentAmountMax
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
            Integer investmentAmount,
            Integer durationMonths,
            Integer weeklyHours,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Integer monthlyRevenue,
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
