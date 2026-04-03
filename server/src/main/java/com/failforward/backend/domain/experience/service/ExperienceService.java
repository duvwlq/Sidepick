package com.failforward.backend.domain.experience.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.api.PageInfo;
import com.failforward.backend.domain.analysis.repository.AiAnalysisRepository;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private final FailureExperienceRepository experienceRepository;
    private final AiAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExperienceDtos.ExperienceResponse create(ExperienceDtos.ExperienceCreateRequest request) {
        User author = getCurrentUser();
        FailureExperience saved = experienceRepository.save(buildExperience(author, request));
        return ExperienceDtos.ExperienceResponse.from(saved, null);
    }

    public ExperienceDtos.ExperienceResponse update(Long experienceId, ExperienceDtos.ExperienceUpdateRequest request) {
        FailureExperience experience = getExperienceEntity(experienceId);
        ExperiencePayload payload = buildPayload(request.categoryId(), request.businessType(), request.investmentAmount(),
                request.durationMonths(), request.failureReason(), request.targetMarket(), request.marketingChannels(),
                request.lessonsLearned(), request.wouldRetry());

        experience.update(
                payload.title(),
                payload.content(),
                request.businessType(),
                request.investmentAmount(),
                request.durationMonths(),
                request.failureReason(),
                request.targetMarket(),
                payload.marketingChannels(),
                request.lessonsLearned(),
                request.wouldRetry(),
                payload.structuredData()
        );

        FailureExperience saved = experienceRepository.save(experience);
        return ExperienceDtos.ExperienceResponse.from(saved, analysisRepository.findByExperience(saved).orElse(null));
    }

    public void delete(Long experienceId) {
        experienceRepository.delete(getExperienceEntity(experienceId));
    }

    public ExperienceDtos.ExperienceListPayload getList(int page, int size, String failureReason) {
        List<FailureExperience> filtered = experienceRepository.findAll().stream()
                .filter(experience -> failureReason == null || failureReason.equals(experience.getFailureReason()))
                .toList();

        int safeSize = size <= 0 ? 20 : size;
        int fromIndex = Math.min(page * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());

        List<ExperienceDtos.ExperienceResponse> experiences = filtered.subList(fromIndex, toIndex).stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        analysisRepository.findByExperience(experience).orElse(null)
                ))
                .toList();

        int totalPages = filtered.isEmpty() ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);
        return new ExperienceDtos.ExperienceListPayload(
                experiences,
                new PageInfo(page, safeSize, filtered.size(), totalPages, toIndex < filtered.size())
        );
    }

    public ExperienceDtos.ExperienceResponse getDetail(Long experienceId) {
        FailureExperience experience = getExperienceEntity(experienceId);
        experience.increaseViewCount();
        FailureExperience saved = experienceRepository.save(experience);
        return ExperienceDtos.ExperienceResponse.from(saved, analysisRepository.findByExperience(saved).orElse(null));
    }

    public List<ExperienceDtos.SimilarityMatchResponse> getSimilar(Long experienceId, int limit) {
        FailureExperience target = getExperienceEntity(experienceId);
        return experienceRepository.findAll().stream()
                .filter(candidate -> !candidate.getId().equals(experienceId))
                .map(candidate -> toSimilarity(target, candidate))
                .sorted((left, right) -> Double.compare(right.similarityScore(), left.similarityScore()))
                .limit(limit)
                .toList();
    }

    public ExperienceDtos.CompareResponse compare(List<Long> experienceIds) {
        if (experienceIds == null || experienceIds.size() < 2) {
            throw new BadRequestException("비교할 실패 경험 ID를 2개 이상 전달해야 합니다.");
        }

        List<FailureExperience> experiences = experienceIds.stream()
                .distinct()
                .map(this::getExperienceEntity)
                .toList();

        List<ExperienceDtos.ExperienceResponse> payload = experiences.stream()
                .map(experience -> ExperienceDtos.ExperienceResponse.from(
                        experience,
                        analysisRepository.findByExperience(experience).orElse(null)
                ))
                .toList();

        List<String> commonPatterns = experiences.stream()
                .map(FailureExperience::getFailureReason)
                .distinct()
                .limit(3)
                .map(reason -> "공통 실패 원인 후보: " + reason)
                .toList();

        List<String> differences = experiences.stream()
                .map(FailureExperience::getBusinessType)
                .distinct()
                .limit(3)
                .map(type -> "사업 유형 차이: " + type)
                .toList();

        return new ExperienceDtos.CompareResponse(
                payload,
                commonPatterns,
                differences,
                List.of("마케팅 전략 사전 점검", "시장 검증 이후 재도전")
        );
    }

    public FailureExperience getExperienceEntity(Long experienceId) {
        return experienceRepository.findById(experienceId)
                .orElseThrow(() -> new NotFoundException("실패 경험을 찾을 수 없습니다."));
    }

    private FailureExperience buildExperience(User author, ExperienceDtos.ExperienceCreateRequest request) {
        ExperiencePayload payload = buildPayload(
                request.categoryId(),
                request.businessType(),
                request.investmentAmount(),
                request.durationMonths(),
                request.failureReason(),
                request.targetMarket(),
                request.marketingChannels(),
                request.lessonsLearned(),
                request.wouldRetry()
        );

        return FailureExperience.create(
                author,
                payload.title(),
                payload.content(),
                request.businessType(),
                request.investmentAmount(),
                request.durationMonths(),
                request.failureReason(),
                request.targetMarket(),
                payload.marketingChannels(),
                request.lessonsLearned(),
                request.wouldRetry(),
                payload.structuredData()
        );
    }

    private ExperiencePayload buildPayload(
            Long categoryId,
            String businessType,
            Integer investmentAmount,
            Integer durationMonths,
            String failureReason,
            String targetMarket,
            List<String> marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry
    ) {
        Map<String, Object> structured = new HashMap<>();
        structured.put("categoryId", categoryId);
        structured.put("targetMarket", targetMarket);
        structured.put("wouldRetry", wouldRetry);

        String title = businessType + " 실패 경험";
        String content = lessonsLearned != null && !lessonsLearned.isBlank()
                ? lessonsLearned
                : failureReason + " 관련 실패 경험";

        return new ExperiencePayload(
                title,
                content,
                writeJson(marketingChannels),
                writeJson(structured)
        );
    }

    private ExperienceDtos.SimilarityMatchResponse toSimilarity(FailureExperience target, FailureExperience candidate) {
        double score = 0.4;
        List<String> matching = new ArrayList<>();
        List<String> differences = new ArrayList<>();

        if (target.getBusinessType().equals(candidate.getBusinessType())) {
            score += 0.3;
            matching.add("동일한 업종 (" + candidate.getBusinessType() + ")");
        } else {
            differences.add("업종 차이");
        }

        if (target.getFailureReason().equals(candidate.getFailureReason())) {
            score += 0.2;
            matching.add("유사한 실패 원인 (" + candidate.getFailureReason() + ")");
        } else {
            differences.add("실패 원인 차이");
        }

        if (target.getInvestmentAmount() != null && candidate.getInvestmentAmount() != null) {
            int gap = Math.abs(target.getInvestmentAmount() - candidate.getInvestmentAmount());
            if (gap <= 500000) {
                score += 0.1;
                matching.add("유사한 투자 규모");
            } else {
                differences.add("투자 규모 차이");
            }
        }

        return new ExperienceDtos.SimilarityMatchResponse(
                ExperienceDtos.ExperienceResponse.from(
                        candidate,
                        analysisRepository.findByExperience(candidate).orElse(null)
                ),
                Math.min(score, 0.99),
                matching,
                differences
        );
    }

    private User getCurrentUser() {
        return userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new BadRequestException("회원가입한 사용자가 없어 실패 경험을 생성할 수 없습니다."));
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new BadRequestException("JSON 데이터 직렬화에 실패했습니다.");
        }
    }

    private record ExperiencePayload(
            String title,
            String content,
            String marketingChannels,
            String structuredData
    ) {
    }
}
