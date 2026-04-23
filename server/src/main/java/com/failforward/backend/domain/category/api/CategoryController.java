package com.failforward.backend.domain.category.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.category.dto.CategoryResponse;
import com.failforward.backend.domain.category.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getCategories() {
        return ApiResponse.ok(
                "Category list loaded.",
                categoryService.getCategories().stream().map(CategoryResponse::from).toList()
        );
    }
}
