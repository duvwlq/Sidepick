package com.failforward.backend.domain.category.repository;

import com.failforward.backend.domain.category.entity.BusinessCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessCategoryRepository extends JpaRepository<BusinessCategory, Long> {

    Optional<BusinessCategory> findByName(String name);
}
