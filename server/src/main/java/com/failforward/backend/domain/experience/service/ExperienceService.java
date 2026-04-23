package com.failforward.backend.domain.experience.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.api.PageInfo;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.analysis.service.AIAnalysisService;
import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.service.CategoryService;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.user.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final CategoryService categoryService;
    private final ObjectMapper objectMapper;

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
                payload.averageDailyHours(),
                payload.isConcurrentWithMainJob(),
                payload.monthlyRevenue(),
                payload.failureReason(),
                payload.failureReasonsJson(),
                payload.difficultiesJson(),
                payload.targetMarket(),
                payload.marketingChannelsJson(),
                payload.lessonsLearned(),
                payload.wouldRetry(),
                payload.structuredDataJson()
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
                payload.averageDailyHours(),
                payload.isConcurrentWithMainJob(),
                payload.monthlyRevenue(),
                payload.failureReason(),
                payload.failureReasonsJson(),
                payload.difficultiesJson(),
                payload.targetMarket(),
                payload.marketingChannelsJson(),
                payload.lessonsLearned(),
                payload.wouldRetry(),
                payload.structuredDataJson()
        );

        FailureExperience saved = experienceRepository.save(experience);
        return ExperienceDtos.ExperienceResponse.from(saved, aiAnalysisService.reanalyzeAfterExperienceUpdate(saved).orElse(null));
    }

    @Transactional
    public void delete(Long experienceId) {
        FailureExperience experience = getExperienceEntity(experienceId);
        validateOwner(experience);
        validateVerifiedWriter(currentUserProvider.getCurrentUserEntity());
        experienceRepository.delete(experience);
    }

    public ExperienceDtos.ExperienceListPayload getList(int page, int size, String failureReason) {
        List<FailureExperience> filtered = experienceRepository.findAllByIsPublicTrueOrderByCreatedAtDesc().stream()
                .filter(experience -> failureReason == null || failureReason.isBlank()
                        || failureReason.equalsIgnoreCase(experience.getFailureReason()))
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : size;
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());

        List<ExperienceDtos.ExperienceResponse> experiences = filtered.subList(fromIndex, toIndex).stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        aiAnalysisService.findByExperience(experience).orElse(null)
                ))
                .toList();

        int totalPages = filtered.isEmpty() ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);
        return new ExperienceDtos.ExperienceListPayload(
                experiences,
                new PageInfo(safePage, safeSize, filtered.size(), totalPages, toIndex < filtered.size())
        );
    }

    @Transactional
    public ExperienceDtos.ExperienceResponse getDetail(Long experienceId) {
        FailureExperience experience = getExperienceEntity(experienceId);
        experience.increaseViewCount();
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

        List<String> commonPatterns = experiences.stream()
                .map(FailureExperience::getFailureReason)
                .filter(reason -> reason != null && !reason.isBlank())
                .distinct()
                .limit(3)
                .map(reason -> "Shared failure reason: " + reason)
                .toList();

        List<String> differences = experiences.stream()
                .map(FailureExperience::getBusinessType)
                .filter(type -> type != null && !type.isBlank())
                .distinct()
                .limit(3)
                .map(type -> "Different business type: " + type)
                .toList();

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

    private ExperiencePayload buildPayload(ExperienceDtos.ExperienceCreateRequest request) {
        return buildPayload(
                request.title(),
                request.content(),
                request.categoryId(),
                request.businessType(),
                request.investmentAmount(),
                request.durationMonths(),
                request.averageDailyHours(),
                request.isConcurrentWithMainJob(),
                request.monthlyRevenue(),
                request.failureReason(),
                request.failureReasons(),
                request.difficulties(),
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
                request.averageDailyHours(),
                request.isConcurrentWithMainJob(),
                request.monthlyRevenue(),
                request.failureReason(),
                request.failureReasons(),
                request.difficulties(),
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
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Integer monthlyRevenue,
            String failureReason,
            List<String> failureReasons,
            List<String> difficulties,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry
    ) {
        BusinessCategory category = categoryService.getCategory(categoryId);
        String resolvedBusinessType = hasText(businessType) ? businessType : category.getName();
        List<String> resolvedFailureReasons = failureReasons == null ? List.of() : failureReasons.stream()
                .filter(this::hasText)
                .toList();
        List<String> resolvedDifficulties = difficulties == null ? List.of() : difficulties.stream()
                .filter(this::hasText)
                .toList();
        String resolvedFailureReason = hasText(failureReason)
                ? failureReason
                : (resolvedFailureReasons.isEmpty() ? "UNSPECIFIED" : resolvedFailureReasons.get(0));
        String resolvedTitle = hasText(title) ? title : resolvedBusinessType + " failure experience";
        String resolvedLessons = hasText(lessonsLearned) ? lessonsLearned : content;

        Map<String, Object> structured = new HashMap<>();
        structured.put("categoryId", categoryId);
        structured.put("categoryName", category.getName());
        structured.put("durationMonths", durationMonths);
        structured.put("averageDailyHours", averageDailyHours);
        structured.put("isConcurrentWithMainJob", isConcurrentWithMainJob != null ? isConcurrentWithMainJob : Boolean.FALSE);
        structured.put("monthlyRevenue", monthlyRevenue);
        structured.put("failureReasons", resolvedFailureReasons);
        structured.put("difficulties", resolvedDifficulties);
        structured.put("targetMarket", targetMarket);
        structured.put("wouldRetry", wouldRetry != null ? wouldRetry : Boolean.FALSE);

        return new ExperiencePayload(
                category,
                resolvedTitle,
                content,
                resolvedBusinessType,
                investmentAmount,
                durationMonths,
                averageDailyHours,
                isConcurrentWithMainJob,
                monthlyRevenue,
                resolvedFailureReason,
                writeJson(resolvedFailureReasons),
                writeJson(resolvedDifficulties),
                targetMarket,
                marketingChannels == null ? List.of() : marketingChannels,
                resolvedLessons,
                wouldRetry != null ? wouldRetry : Boolean.FALSE,
                writeJson(marketingChannels == null ? List.of() : marketingChannels),
                writeJson(structured)
        );
    }

    private ExperienceDtos.SimilarityMatchResponse toSimilarity(FailureExperience target, FailureExperience candidate) {
        double score = 0.4;
        List<String> matching = new ArrayList<>();
        List<String> differences = new ArrayList<>();

        if (target.getBusinessType().equals(candidate.getBusinessType())) {
            score += 0.3;
            matching.add("Same business type");
        } else {
            differences.add("Business type differs");
        }

        if (target.getFailureReason().equals(candidate.getFailureReason())) {
            score += 0.2;
            matching.add("Same failure reason");
        } else {
            differences.add("Failure reason differs");
        }

        if (target.getInvestmentAmount() != null && candidate.getInvestmentAmount() != null) {
            int gap = Math.abs(target.getInvestmentAmount() - candidate.getInvestmentAmount());
            if (gap <= 500000) {
                score += 0.1;
                matching.add("Similar investment amount");
            } else {
                differences.add("Investment amount differs");
            }
        }

        return new ExperienceDtos.SimilarityMatchResponse(
                ExperienceDtos.ExperienceResponse.from(
                        candidate,
                        aiAnalysisService.findByExperience(candidate).orElse(null)
                ),
                Math.min(score, 0.99),
                matching,
                differences
        );
    }

    private void validateOwner(FailureExperience experience) {
        User currentUser = currentUserProvider.getCurrentUserEntity();
        if (!experience.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only modify your own experience.");
        }
    }

    private void validateVerifiedWriter(User user) {
        if (user.requiresEmailVerification()) {
            throw new AccessDeniedException("Email verification is required to write experiences.");
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new BadRequestException("Failed to serialize JSON payload.");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record ExperiencePayload(
            BusinessCategory category,
            String title,
            String content,
            String businessType,
            Integer investmentAmount,
            Integer durationMonths,
            String averageDailyHours,
            Boolean isConcurrentWithMainJob,
            Integer monthlyRevenue,
            String failureReason,
            String failureReasonsJson,
            String difficultiesJson,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry,
            String marketingChannelsJson,
            String structuredDataJson
    ) {
    }
}
