package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.domain.analysis.entity.AiAnalysis;
import com.failforward.backend.domain.analysis.repository.AiAnalysisRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ai-guide-repair.enabled", havingValue = "true")
public class AiGuideRepairRunner implements ApplicationRunner {

    private final AiAnalysisRepository aiAnalysisRepository;
    private final AIAnalysisSupport analysisSupport;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<AiAnalysis> analyses = aiAnalysisRepository.findAllByOrderByIdAsc();
        int updatedCount = 0;

        for (AiAnalysis analysis : analyses) {
            String repairedAdviceJson = analysisSupport.buildStoredAdviceJson(
                    analysis.getExperience(),
                    analysis.getFailureCategory(),
                    analysis.getStructuredSummary()
            );

            if (repairedAdviceJson.equals(analysis.getSummaryList())) {
                continue;
            }

            analysis.updateFromAiResult(
                    analysis.getFailReasonTags(),
                    repairedAdviceJson,
                    analysis.getStructuredSummary(),
                    analysis.getFailureCategory(),
                    analysis.getRiskLevel(),
                    analysis.getRiskFactorAnalysis(),
                    analysis.getRiskScore()
            );
            updatedCount++;
        }

        if (updatedCount > 0) {
            aiAnalysisRepository.saveAll(analyses);
        }

        log.info("ai_guide_repair_completed totalAnalyses={} updatedCount={}", analyses.size(), updatedCount);
    }
}
