package com.failforward.backend.domain.category.config;

import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.repository.BusinessCategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class CategoryDataInitializer {

    private final BusinessCategoryRepository categoryRepository;

    @Bean
    public ApplicationRunner businessCategoryInitializer() {
        return args -> {
            if (categoryRepository.count() > 0) {
                return;
            }

            categoryRepository.saveAll(List.of(
                    BusinessCategory.create(1L, "온라인사업", "쇼핑몰, 블로그, 유튜브 등 온라인 기반 부업", "💻", "#3B82F6"),
                    BusinessCategory.create(2L, "오프라인사업", "매장 운영, 로컬 서비스, 오프라인 판매 중심 부업", "🏪", "#10B981"),
                    BusinessCategory.create(3L, "콘텐츠", "전자책, 강의, 뉴스레터, 크리에이터형 부업", "📝", "#F59E0B"),
                    BusinessCategory.create(4L, "투자형", "스마트스토어 자동화, 재고형 사업, 소규모 투자 시도", "💰", "#EF4444"),
                    BusinessCategory.create(5L, "기타", "명확히 분류되지 않는 기타 부업", "📦", "#8B5CF6")
            ));
        };
    }
}
