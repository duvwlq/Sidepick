package com.failforward.backend.domain.category.repository;

import com.failforward.backend.domain.category.entity.BusinessCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessCategoryRepository extends JpaRepository<BusinessCategory, Long> {
}
