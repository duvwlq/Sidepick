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
import java.util.ArrayList;
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
    private final AIAnalysisSupport analysisSupport;
    private final DemoScenarioSupport demoScenarioSupport;

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
        Optional<AiAnalysis> demoAnalysis = persistDemoScenarioAnalysisIfMatched(experience, null);
        if (demoAnalysis.isPresent()) {
            return demoAnalysis;
        }
        try {
            return Optional.of(requestAndPersistAnalysis(experience));
        } catch (Exception exception) {
            log.warn("AI analysis skipped for experienceId={} because AI server call failed: {}",
                    experience.getId(), exception.getMessage());
            return Optional.empty();
        }
    }

    @Transactional
    public Optional<AiAnalysis> reanalyzeAfterExperienceUpdate(FailureExperience experience) {
        Optional<AiAnalysis> existing = aiAnalysisRepository.findByExperience(experience);
        Optional<AiAnalysis> demoAnalysis = persistDemoScenarioAnalysisIfMatched(experience, existing.orElse(null));
        if (demoAnalysis.isPresent()) {
            return demoAnalysis;
        }
        try {
            return Optional.of(requestAndPersistAnalysis(experience, existing.orElse(null)));
        } catch (Exception exception) {
            log.warn("AI re-analysis skipped for experienceId={} because AI server call failed: {}",
                    experience.getId(), exception.getMessage());
            return existing;
        }
    }

    private AiAnalysis requestAndPersistAnalysis(FailureExperience experience) {
        return requestAndPersistAnalysis(experience, null);
    }

    private AiAnalysis requestAndPersistAnalysis(FailureExperience experience, AiAnalysis existingAnalysis) {
        log.info("ai_analysis_request_started {}", analysisSupport.buildAiLogFields(experience.getId(), null, null, null));
        AiAnalysisResponse response = requestAnalysis(experience);
        String emptyRiskFactors = analysisSupport.writeJson(List.of());

        AiAnalysis analysis = existingAnalysis;
        if (analysis == null) {
            analysis = AiAnalysis.create(
                    experience,
                    analysisSupport.writeJson(response.keywords()),
                    analysisSupport.buildAdviceJson(experience, response),
                    response.summary(),
                    analysisSupport.truncate(response.failureCategory(), 50),
                    analysisSupport.normalizeRiskLevel(response.riskLevel()),
                    emptyRiskFactors,
                    analysisSupport.toRiskScore(response.riskLevel())
            );
        } else {
            analysis.updateFromAiResult(
                    analysisSupport.writeJson(response.keywords()),
                    analysisSupport.buildAdviceJson(experience, response),
                    response.summary(),
                    analysisSupport.truncate(response.failureCategory(), 50),
                    analysisSupport.normalizeRiskLevel(response.riskLevel()),
                    emptyRiskFactors,
                    analysisSupport.toRiskScore(response.riskLevel())
            );
            matchedCaseRepository.deleteByAnalysis(analysis);
        }
        analysis = aiAnalysisRepository.save(analysis);

        matchedCaseRepository.save(analysisSupport.createDefaultMatchedCase(analysis, experience, response));

        log.info("ai_analysis_response_stored {}",
                analysisSupport.buildAiLogFields(experience.getId(), analysis.getId(), null, null));
        return analysis;
    }

    private Optional<AiAnalysis> persistDemoScenarioAnalysisIfMatched(
            FailureExperience experience,
            AiAnalysis existingAnalysis
    ) {
        Optional<DemoScenarioSupport.DemoScenario> scenario = demoScenarioSupport.match(experience);
        if (scenario.isEmpty()) {
            return Optional.empty();
        }

        experience.updateStructuredData(demoScenarioSupport.mergeStructuredData(experience, scenario.get()));
        FailureExperience savedExperience = experienceRepository.save(experience);

        AiAnalysis analysis = existingAnalysis;
        if (analysis == null) {
            analysis = AiAnalysis.create(
                    savedExperience,
                    analysisSupport.writeJson(scenario.get().keywords()),
                    analysisSupport.writeJson(scenario.get().advice()),
                    scenario.get().summary(),
                    analysisSupport.truncate(scenario.get().failureCategory(), 50),
                    analysisSupport.normalizeRiskLevel(scenario.get().riskLevel()),
                    analysisSupport.writeJson(scenario.get().riskFactors()),
                    scenario.get().riskScore()
            );
        } else {
            analysis.updateFromAiResult(
                    analysisSupport.writeJson(scenario.get().keywords()),
                    analysisSupport.writeJson(scenario.get().advice()),
                    scenario.get().summary(),
                    analysisSupport.truncate(scenario.get().failureCategory(), 50),
                    analysisSupport.normalizeRiskLevel(scenario.get().riskLevel()),
                    analysisSupport.writeJson(scenario.get().riskFactors()),
                    scenario.get().riskScore()
            );
            matchedCaseRepository.deleteByAnalysis(analysis);
        }

        analysis = aiAnalysisRepository.save(analysis);
        matchedCaseRepository.saveAll(buildDemoMatchedCases(analysis, scenario.get()));
        log.info("demo_scenario_analysis_stored experienceId={} scenario={}",
                savedExperience.getId(), scenario.get().code());
        return Optional.of(analysis);
    }

    private List<MatchedCase> buildDemoMatchedCases(
            AiAnalysis analysis,
            DemoScenarioSupport.DemoScenario scenario
    ) {
        List<MatchedCase> matchedCases = new ArrayList<>();
        for (int index = 0; index < scenario.similarCaseIds().size(); index++) {
            Long similarCaseId = scenario.similarCaseIds().get(index);
            FailureExperience similarExperience = experienceRepository.findWithUserAndCategoryById(similarCaseId)
                    .orElseThrow(() -> new NotFoundException("Demo similar case not found."));
            Optional<AiAnalysis> similarAnalysis = aiAnalysisRepository.findByExperience(similarExperience);

            String summary = similarAnalysis.map(AiAnalysis::getStructuredSummary)
                    .filter(value -> value != null && !value.isBlank())
                    .orElse(similarExperience.getContent());
            String keyLesson = similarExperience.getLessonsLearned() != null
                    && !similarExperience.getLessonsLearned().isBlank()
                    ? similarExperience.getLessonsLearned()
                    : similarExperience.getContent();

            matchedCases.add(MatchedCase.create(
                    analysis,
                    String.valueOf(similarCaseId),
                    similarExperience.getTitle(),
                    summary,
                    keyLesson,
                    scenario.matchRates().get(index)
            ));
        }
        return matchedCases;
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
            log.info("ai_analysis_response_received {}", analysisSupport.buildAiLogFields(experience.getId(), null, null, null));
            return response;
        } catch (ResourceAccessException exception) {
            log.warn("ai_analysis_request_timeout {}", analysisSupport.buildAiLogFields(experience.getId(), null, null,
                    exception.getMessage()), exception);
            throw new AiServerTimeoutException("AI server timeout.", exception);
        } catch (RestClientException exception) {
            log.warn("ai_analysis_request_failed {}", analysisSupport.buildAiLogFields(experience.getId(), null, null,
                    exception.getMessage()), exception);
            throw new AiServerException("AI server request failed.", exception);
        } catch (Exception exception) {
            log.error("ai_analysis_response_parse_failed {}", analysisSupport.buildAiLogFields(experience.getId(), null, null,
                    exception.getMessage()), exception);
            throw new AiServerParseException("AI response parsing failed.", exception);
        }
    }

    private FailureExperience getExperience(Long experienceId) {
        return experienceRepository.findWithUserAndCategoryById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));
    }

}
