package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.common.api.AiServerException;
import com.failforward.backend.common.api.AiServerTimeoutException;
import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.config.AiServerProperties;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisRequest;
import com.failforward.backend.domain.analysis.dto.AiServerDtos.AiAnalysisResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.MatchedCaseResponse;
import com.failforward.backend.domain.analysis.dto.AnalysisDtos.PatternAnalysisResponse;
import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.entity.MatchedCase;
import com.failforward.backend.domain.analysis.repository.AiAnalysisRepository;
import com.failforward.backend.domain.analysis.repository.MatchedCaseRepository;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
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
        log.info("AI request started for experienceId={}", experience.getId());
        AiAnalysisResponse response = requestAnalysis(experience);

        AiAnalysis analysis = existingAnalysis;
        if (analysis == null) {
            analysis = AiAnalysis.create(
                    experience,
                    writeJson(response.extractedPatterns()),
                    writeJson(response.successFactors()),
                    response.structuredSummary(),
                    writeJson(response.riskFactors()),
                    response.confidenceScore()
            );
        } else {
            analysis.updateFromAiResult(
                    writeJson(response.extractedPatterns()),
                    writeJson(response.successFactors()),
                    response.structuredSummary(),
                    writeJson(response.riskFactors()),
                    response.confidenceScore()
            );
            matchedCaseRepository.deleteByAnalysis(analysis);
        }
        analysis = aiAnalysisRepository.save(analysis);

        matchedCaseRepository.save(MatchedCase.create(
                analysis,
                "CASE-" + experience.getId(),
                experience.getBusinessType() + " similar case",
                experience.getLessonsLearned(),
                response.structuredSummary(),
                90
        ));

        log.info("AI response stored successfully for experienceId={}, analysisId={}",
                experience.getId(), analysis.getId());
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
            log.info("AI response received successfully for experienceId={}", experience.getId());
            return response;
        } catch (ResourceAccessException exception) {
            log.error("AI request timeout or connection failure for experienceId={}", experience.getId(), exception);
            throw new AiServerTimeoutException("AI server timeout.", exception);
        } catch (RestClientException exception) {
            log.error("AI request failed for experienceId={}", experience.getId(), exception);
            throw new AiServerException("AI server request failed.", exception);
        } catch (Exception exception) {
            log.error("AI response parsing failed for experienceId={}", experience.getId(), exception);
            throw new AiServerException("AI response parsing failed.", exception);
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
}
