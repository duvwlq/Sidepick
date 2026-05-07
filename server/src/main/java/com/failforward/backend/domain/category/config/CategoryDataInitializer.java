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
        return args -> categoryRepository.saveAll(List.of(
                BusinessCategory.create(1L, "온라인 판매 · 이커머스", "스마트스토어/ 쿠팡, 오픈마켓 /구매대행/ 위탁판매 (드롭쉬핑) /해외구매, 수입판매 /재고 기반 쇼핑몰 등", "🛍️", "#2F6BFF"),
                BusinessCategory.create(2L, "콘텐츠·SNS 기반", "유튜브/ 블로그/ 인스타그램 /티딩/ 뉴스레터 /개인 브랜딩 기반 등", "🎬", "#FF8A00"),
                BusinessCategory.create(3L, "디지털 상품·지식 판매", "전자책 판매/ 강의 제작 /강의 플랫폼, 디지털 판매 /노션 자료 판매/ PDF 자료 판매 등", "📘", "#7A5CFF"),
                BusinessCategory.create(4L, "플랫폼 기반 노동형", "배달, 대리운전, 쿠팡플렉스, 단기 알바 플랫폼 /설문 참여, 앱테크", "🧰", "#13A37F"),
                BusinessCategory.create(5L, "재능 판매·프리랜서", "디자인/ 영상 편집/ 글쓰기 /개발/ 번역/ 크몽, 탈잉 등 플랫폼 활동", "✍️", "#E64980"),
                BusinessCategory.create(6L, "투자·재테크", "주식/ 코인/ ETF/ P2P 투자 /부동산 소액 투자 등", "📈", "#EF4444"),
                BusinessCategory.create(7L, "오프라인 기반 부업", "공방, 핸드메이드 /플리마켓 판매 /클래스 운영 (오프라인) 등", "🏪", "#10B981"),
                BusinessCategory.create(8L, "기타", "명확히 분류되지 않는 기타 부업 경험", "✨", "#8B5CF6")
        ));
    }
}
