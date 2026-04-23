package com.failforward.backend.domain.experience.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "failure_experiences")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FailureExperience extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private BusinessCategory category;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "business_type", nullable = false, length = 50)
    private String businessType;

    @Column(name = "investment_amount")
    private Integer investmentAmount;

    @Column(name = "duration_months")
    private Integer durationMonths;

    @Column(name = "average_daily_hours", length = 30)
    private String averageDailyHours;

    @Column(name = "is_concurrent_with_main_job")
    private Boolean isConcurrentWithMainJob;

    @Column(name = "monthly_revenue")
    private Integer monthlyRevenue;

    @Column(name = "failure_reason", nullable = false, length = 50)
    private String failureReason;

    @Column(name = "failure_reasons", columnDefinition = "json")
    private String failureReasons;

    @Column(name = "difficulties", columnDefinition = "json")
    private String difficulties;

    @Column(name = "target_market", length = 100)
    private String targetMarket;

    @Column(name = "marketing_channels", columnDefinition = "json")
    private String marketingChannels;

    @Column(name = "lessons_learned", columnDefinition = "TEXT")
    private String lessonsLearned;

    @Column(name = "would_retry")
    private Boolean wouldRetry;

    @Column(name = "structured_data", columnDefinition = "json")
    private String structuredData;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;

    private FailureExperience(
            User user,
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
            String failureReasons,
            String difficulties,
            String targetMarket,
            String marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry,
            String structuredData
    ) {
        this.user = user;
        this.category = category;
        this.title = title;
        this.content = content;
        this.businessType = businessType;
        this.investmentAmount = investmentAmount;
        this.durationMonths = durationMonths;
        this.averageDailyHours = averageDailyHours;
        this.isConcurrentWithMainJob = isConcurrentWithMainJob;
        this.monthlyRevenue = monthlyRevenue;
        this.failureReason = failureReason;
        this.failureReasons = failureReasons;
        this.difficulties = difficulties;
        this.targetMarket = targetMarket;
        this.marketingChannels = marketingChannels;
        this.lessonsLearned = lessonsLearned;
        this.wouldRetry = wouldRetry;
        this.structuredData = structuredData;
        this.viewCount = 0;
        this.likeCount = 0;
        this.isPublic = true;
    }

    public static FailureExperience create(
            User user,
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
            String failureReasons,
            String difficulties,
            String targetMarket,
            String marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry,
            String structuredData
    ) {
        return new FailureExperience(
                user,
                category,
                title,
                content,
                businessType,
                investmentAmount,
                durationMonths,
                averageDailyHours,
                isConcurrentWithMainJob,
                monthlyRevenue,
                failureReason,
                failureReasons,
                difficulties,
                targetMarket,
                marketingChannels,
                lessonsLearned,
                wouldRetry,
                structuredData
        );
    }

    public void increaseViewCount() {
        this.viewCount = this.viewCount + 1;
    }

    public void update(
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
            String failureReasons,
            String difficulties,
            String targetMarket,
            String marketingChannels,
            String lessonsLearned,
            Boolean wouldRetry,
            String structuredData
    ) {
        this.category = category;
        this.title = title;
        this.content = content;
        this.businessType = businessType;
        this.investmentAmount = investmentAmount;
        this.durationMonths = durationMonths;
        this.averageDailyHours = averageDailyHours;
        this.isConcurrentWithMainJob = isConcurrentWithMainJob;
        this.monthlyRevenue = monthlyRevenue;
        this.failureReason = failureReason;
        this.failureReasons = failureReasons;
        this.difficulties = difficulties;
        this.targetMarket = targetMarket;
        this.marketingChannels = marketingChannels;
        this.lessonsLearned = lessonsLearned;
        this.wouldRetry = wouldRetry;
        this.structuredData = structuredData;
    }
}
