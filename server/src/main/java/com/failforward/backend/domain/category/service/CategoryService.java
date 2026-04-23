package com.failforward.backend.domain.category.service;

import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.repository.BusinessCategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final BusinessCategoryRepository categoryRepository;

    public List<BusinessCategory> getCategories() {
        return categoryRepository.findAll()
                .stream()
                .sorted((left, right) -> Long.compare(left.getId(), right.getId()))
                .toList();
    }

    public BusinessCategory getCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found."));
    }
}
