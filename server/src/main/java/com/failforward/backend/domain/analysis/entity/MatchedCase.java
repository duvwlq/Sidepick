package com.failforward.backend.domain.analysis.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Entity
@Table(name = "matched_cases")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchedCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private AiAnalysis analysis;

    @Column(name = "case_id", nullable = false, length = 50)
    private String caseId;

    @Column(name = "case_title", nullable = false, length = 200)
    private String caseTitle;

    @Column(name = "case_summary", columnDefinition = "TEXT")
    private String caseSummary;

    @Column(name = "key_lesson", columnDefinition = "TEXT")
    private String keyLesson;

    @Column(name = "match_rate", nullable = false)
    private Integer matchRate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private MatchedCase(
            AiAnalysis analysis,
            String caseId,
            String caseTitle,
            String caseSummary,
            String keyLesson,
            Integer matchRate
    ) {
        this.analysis = analysis;
        this.caseId = caseId;
        this.caseTitle = caseTitle;
        this.caseSummary = caseSummary;
        this.keyLesson = keyLesson;
        this.matchRate = matchRate;
    }

    public static MatchedCase create(
            AiAnalysis analysis,
            String caseId,
            String caseTitle,
            String caseSummary,
            String keyLesson,
            Integer matchRate
    ) {
        return new MatchedCase(analysis, caseId, caseTitle, caseSummary, keyLesson, matchRate);
    }
}
