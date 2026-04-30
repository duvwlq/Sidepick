package com.failforward.backend.domain.analysis.entity;

import com.failforward.backend.domain.experience.entity.FailureExperience;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Entity
@Table(name = "ai_analysis")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = false, unique = true)
    private FailureExperience experience;

    @Column(name = "fail_reason_tags", nullable = false, columnDefinition = "json")
    private String failReasonTags;

    @Column(name = "summary_list", nullable = false, columnDefinition = "json")
    private String summaryList;

    @Column(name = "structured_summary", columnDefinition = "TEXT")
    private String structuredSummary;

    @Column(name = "failure_category", length = 50)
    private String failureCategory;

    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    @Column(name = "risk_factor_analysis", columnDefinition = "TEXT")
    private String riskFactorAnalysis;

    @Column(name = "risk_score", precision = 3, scale = 1)
    private BigDecimal riskScore;

    @CreationTimestamp
    @Column(name = "processed_at", nullable = false, updatable = false)
    private LocalDateTime processedAt;

    private AiAnalysis(
            FailureExperience experience,
            String failReasonTags,
            String summaryList,
            String structuredSummary,
            String failureCategory,
            String riskLevel,
            String riskFactorAnalysis,
            BigDecimal riskScore
    ) {
        this.experience = experience;
        this.failReasonTags = failReasonTags;
        this.summaryList = summaryList;
        this.structuredSummary = structuredSummary;
        this.failureCategory = failureCategory;
        this.riskLevel = riskLevel;
        this.riskFactorAnalysis = riskFactorAnalysis;
        this.riskScore = riskScore;
    }

    public static AiAnalysis create(
            FailureExperience experience,
            String failReasonTags,
            String summaryList,
            String structuredSummary,
            String failureCategory,
            String riskLevel,
            String riskFactorAnalysis,
            BigDecimal riskScore
    ) {
        return new AiAnalysis(
                experience,
                failReasonTags,
                summaryList,
                structuredSummary,
                failureCategory,
                riskLevel,
                riskFactorAnalysis,
                riskScore
        );
    }

    public void updateFromAiResult(
            String failReasonTags,
            String summaryList,
            String structuredSummary,
            String failureCategory,
            String riskLevel,
            String riskFactorAnalysis,
            BigDecimal riskScore
    ) {
        this.failReasonTags = failReasonTags;
        this.summaryList = summaryList;
        this.structuredSummary = structuredSummary;
        this.failureCategory = failureCategory;
        this.riskLevel = riskLevel;
        this.riskFactorAnalysis = riskFactorAnalysis;
        this.riskScore = riskScore;
    }
}
