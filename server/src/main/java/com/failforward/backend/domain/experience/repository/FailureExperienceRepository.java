package com.failforward.backend.domain.experience.repository;

import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FailureExperienceRepository extends JpaRepository<FailureExperience, Long> {

    @EntityGraph(attributePaths = {"user", "category"})
    @Query("select e from FailureExperience e where e.id = :experienceId")
    Optional<FailureExperience> findWithUserAndCategoryById(Long experienceId);

    @EntityGraph(attributePaths = {"user", "category"})
    List<FailureExperience> findAllByIsPublicTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"user", "category"})
    @Query("""
            select e
            from FailureExperience e
            where e.isPublic = true
              and (:categoryId is null or e.category.id = :categoryId)
              and (:failureReason is null or :failureReason = '' or lower(coalesce(e.failureReason, '')) = lower(:failureReason))
              and (:durationMonthsMin is null or coalesce(e.durationMonths, 0) >= :durationMonthsMin)
              and (:durationMonthsMax is null or coalesce(e.durationMonths, 0) <= :durationMonthsMax)
              and (:investmentAmountMin is null or coalesce(e.investmentAmount, 0) >= :investmentAmountMin)
              and (:investmentAmountMax is null or coalesce(e.investmentAmount, 0) <= :investmentAmountMax)
              and (
                :q is null
                or :q = ''
                or lower(coalesce(e.title, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.content, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.businessType, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.failureReason, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.lessonsLearned, '')) like lower(concat('%', :q, '%'))
              )
            order by e.createdAt desc
            """)
    List<FailureExperience> searchPublicLatest(
            @Param("q") String q,
            @Param("categoryId") Long categoryId,
            @Param("failureReason") String failureReason,
            @Param("durationMonthsMin") Integer durationMonthsMin,
            @Param("durationMonthsMax") Integer durationMonthsMax,
            @Param("investmentAmountMin") Integer investmentAmountMin,
            @Param("investmentAmountMax") Integer investmentAmountMax
    );

    @EntityGraph(attributePaths = {"user", "category"})
    @Query("""
            select e
            from FailureExperience e
            where e.isPublic = true
              and (:categoryId is null or e.category.id = :categoryId)
              and (:failureReason is null or :failureReason = '' or lower(coalesce(e.failureReason, '')) = lower(:failureReason))
              and (:durationMonthsMin is null or coalesce(e.durationMonths, 0) >= :durationMonthsMin)
              and (:durationMonthsMax is null or coalesce(e.durationMonths, 0) <= :durationMonthsMax)
              and (:investmentAmountMin is null or coalesce(e.investmentAmount, 0) >= :investmentAmountMin)
              and (:investmentAmountMax is null or coalesce(e.investmentAmount, 0) <= :investmentAmountMax)
              and (
                :q is null
                or :q = ''
                or lower(coalesce(e.title, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.content, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.businessType, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.failureReason, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(e.lessonsLearned, '')) like lower(concat('%', :q, '%'))
              )
            order by e.viewCount desc, e.likeCount desc, e.createdAt desc
            """)
    List<FailureExperience> searchPublicPopular(
            @Param("q") String q,
            @Param("categoryId") Long categoryId,
            @Param("failureReason") String failureReason,
            @Param("durationMonthsMin") Integer durationMonthsMin,
            @Param("durationMonthsMax") Integer durationMonthsMax,
            @Param("investmentAmountMin") Integer investmentAmountMin,
            @Param("investmentAmountMax") Integer investmentAmountMax
    );
}
