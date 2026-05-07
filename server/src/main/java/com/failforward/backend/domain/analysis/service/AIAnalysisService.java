package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.common.api.AiServerException;
import com.failforward.backend.common.api.AiServerParseException;
import com.failforward.backend.common.api.AiServerTimeoutException;
import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.config.AiServerProperties;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisRequest;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.AnalysisReportResponse;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.analysis.repository.AiAnalysisRepository;
import com.failforward.backend.domain.analysis.repository.MatchedCaseRepository;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AIAnalysisService {

    private final FailureExperienceRepository experienceRepository;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final MatchedCaseRepository matchedCaseRepository;
    @Qualifier("aiRestTemplate")
    private final RestTemplate aiRestTemplate;
    private final AiServerProperties aiServerProperties;
    private final ObjectMapper objectMapper;

    public Optional<AiAnalysis> findByExperience(FailureExperience experience) {
        return aiAnalysisRepository.findByExperience(experience);
    }

    public PatternAnalysisResponse getAnalysis(Long experienceId) {
        FailureExperience experience = getExperience(experienceId);
        AiAnalysis analysis = aiAnalysisRepository.findByExperience(experience)
                .orElseThrow(() -> new NotFoundException("Analysis result not found."));
        return PatternAnalysisResponse.from(analysis);
    }

    public AnalysisReportResponse getReport(Long experienceId) {
        FailureExperience experience = getExperience(experienceId);
        Optional<AiAnalysis> analysis = aiAnalysisRepository.findByExperience(experience);
        if (analysis.isEmpty()) {
            return AnalysisReportResponse.notReady(experience);
        }

        List<MatchedCase> similarCases = matchedCaseRepository.findByAnalysis(analysis.get());
        return AnalysisReportResponse.from(experience, analysis.get(), similarCases);
    }

    @Transactional
    public PatternAnalysisResponse createAnalysis(Long experienceId) {
        FailureExperience experience = getExperience(experienceId);
        AiAnalysis analysis = aiAnalysisRepository.findByExperience(experience)
                .orElseGet(() -> requestAndPersistAnalysis(experience));
        return PatternAnalysisResponse.from(analysis);
    }

    public List<MatchedCaseResponse> getMatchedCases(Long analysisId) {
        AiAnalysis analysis = aiAnalysisRepository.findById(analysisId)
                .orElseThrow(() -> new NotFoundException("Analysis result not found."));
        return matchedCaseRepository.findByAnalysis(analysis).stream()
                .map(MatchedCaseResponse::from)
                .toList();
    }

    @Transactional
    public Optional<AiAnalysis> analyzeAfterExperienceCreate(FailureExperience experience) {
        Optional<AiAnalysis> existing = aiAnalysisRepository.findByExperience(experience);
        if (existing.isPresent()) {
            return existing;
        }
        try {
            return Optional.of(requestAndPersistAnalysis(experience));
        } catch (AiServerException exception) {
            log.warn("AI analysis skipped for experienceId={} because AI server call failed: {}",
                    experience.getId(), exception.getMessage());
            return Optional.empty();
        }
    }

    @Transactional
    public Optional<AiAnalysis> reanalyzeAfterExperienceUpdate(FailureExperience experience) {
        Optional<AiAnalysis> existing = aiAnalysisRepository.findByExperience(experience);
        try {
            return Optional.of(requestAndPersistAnalysis(experience, existing.orElse(null)));
        } catch (AiServerException exception) {
            log.warn("AI re-analysis skipped for experienceId={} because AI server call failed: {}",
                    experience.getId(), exception.getMessage());
            return existing;
        }
    }

    private AiAnalysis requestAndPersistAnalysis(FailureExperience experience) {
        return requestAndPersistAnalysis(experience, null);
    }

    private AiAnalysis requestAndPersistAnalysis(FailureExperience experience, AiAnalysis existingAnalysis) {
        log.info("ai_analysis_request_started {}", buildAiLogFields(experience.getId(), null, null, null));
        AiAnalysisResponse response = requestAnalysis(experience);
        String emptyRiskFactors = writeJson(List.of());

        AiAnalysis analysis = existingAnalysis;
        if (analysis == null) {
            analysis = AiAnalysis.create(
                    experience,
                    writeJson(response.keywords()),
                    buildAdviceJson(response),
                    response.summary(),
                    response.failureCategory(),
                    response.riskLevel(),
                    emptyRiskFactors,
                    toRiskScore(response.riskLevel())
            );
        } else {
            analysis.updateFromAiResult(
                    writeJson(response.keywords()),
                    buildAdviceJson(response),
                    response.summary(),
                    response.failureCategory(),
                    response.riskLevel(),
                    emptyRiskFactors,
                    toRiskScore(response.riskLevel())
            );
            matchedCaseRepository.deleteByAnalysis(analysis);
        }
        analysis = aiAnalysisRepository.save(analysis);

        matchedCaseRepository.save(MatchedCase.create(
                analysis,
                "CASE-" + experience.getId(),
                experience.getBusinessType() + " similar case",
                experience.getLessonsLearned(),
                response.summary(),
                defaultMatchRate(response.riskLevel())
        ));

        log.info("ai_analysis_response_stored {}",
                buildAiLogFields(experience.getId(), analysis.getId(), null, null));
        return analysis;
    }

    private AiAnalysisResponse requestAnalysis(FailureExperience experience) {
        String endpoint = aiServerProperties.url() + "/analyze";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AiAnalysisRequest> request = new HttpEntity<>(AiAnalysisRequest.from(experience), headers);

        try {
            AiAnalysisResponse response = aiRestTemplate.postForObject(endpoint, request, AiAnalysisResponse.class);
            if (response == null) {
                throw new AiServerException("AI server returned an empty response.");
            }
            log.info("ai_analysis_response_received {}", buildAiLogFields(experience.getId(), null, null, null));
            return response;
        } catch (ResourceAccessException exception) {
            log.warn("ai_analysis_request_timeout {}", buildAiLogFields(experience.getId(), null, null,
                    exception.getMessage()), exception);
            throw new AiServerTimeoutException("AI server timeout.", exception);
        } catch (RestClientException exception) {
            log.warn("ai_analysis_request_failed {}", buildAiLogFields(experience.getId(), null, null,
                    exception.getMessage()), exception);
            throw new AiServerException("AI server request failed.", exception);
        } catch (Exception exception) {
            log.error("ai_analysis_response_parse_failed {}", buildAiLogFields(experience.getId(), null, null,
                    exception.getMessage()), exception);
            throw new AiServerParseException("AI response parsing failed.", exception);
        }
    }

    private FailureExperience getExperience(Long experienceId) {
        return experienceRepository.findWithUserAndCategoryById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));
    }

    private String writeJson(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (Exception exception) {
            throw new AiServerException("Failed to serialize AI analysis payload.", exception);
        }
    }

    private String buildAdviceJson(AiAnalysisResponse response) {
        if (response == null) {
            return "[]";
        }

        List<String> advice = List.of(
                response.summary() == null ? "" : response.summary().trim()
        ).stream()
                .filter(item -> !item.isBlank())
                .toList();

        return writeJson(advice);
    }

    private java.math.BigDecimal toRiskScore(String riskLevel) {
        if (riskLevel == null) {
            return null;
        }
        return switch (riskLevel.toLowerCase()) {
            case "high" -> java.math.BigDecimal.valueOf(0.9);
            case "medium" -> java.math.BigDecimal.valueOf(0.6);
            case "low" -> java.math.BigDecimal.valueOf(0.3);
            default -> null;
        };
    }

    private int defaultMatchRate(String riskLevel) {
        if (riskLevel == null) {
            return 70;
        }
        return switch (riskLevel.toLowerCase()) {
            case "high" -> 80;
            case "medium" -> 70;
            case "low" -> 60;
            default -> 70;
        };
    }

    private Map<String, Object> buildAiLogFields(
            Long experienceId,
            Long analysisId,
            Integer externalApiStatus,
            String detail
    ) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("requestPath", "/api/experiences/" + experienceId + "/analysis");
        fields.put("method", "POST");
        fields.put("userId", null);
        fields.put("experienceId", experienceId);
        fields.put("status", null);
        fields.put("errorCode", null);
        fields.put("externalApiStatus", externalApiStatus);
        fields.put("elapsedTimeMs", null);
        fields.put("traceId", org.slf4j.MDC.get("traceId"));
        fields.put("timestamp", OffsetDateTime.now().toString());
        fields.put("analysisId", analysisId);
        fields.put("detail", detail);
        return fields;
    }
}
