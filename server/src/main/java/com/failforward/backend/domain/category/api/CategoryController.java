package com.failforward.backend.domain.category.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.common.support.CategoryCatalog;
import com.failforward.backend.domain.category.dto.CategoryResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getCategories() {
        return ApiResponse.ok(
                "카테고리 목록 조회 성공",
                CategoryCatalog.getItems().stream().map(CategoryResponse::from).toList()
        );
    }
}
