INSERT INTO business_categories (id, name, description, icon, color)
VALUES
    (1, '온라인 판매 · 이커머스', '스마트스토어, 쿠팡, 오픈마켓, 구매대행, 위탁판매, 재고 기반 쇼핑몰 등', 'commerce', '#2F6BFF'),
    (2, '콘텐츠·SNS 기반', '유튜브, 블로그, 인스타그램, 릴스, 뉴스레터, 개인 브랜딩 기반 활동', 'content', '#FF8A00'),
    (3, '디지털 상품·지식 판매', '전자책, 강의 제작, 온라인 클래스, 지식 문서, 템플릿, PDF 자료 판매 등', 'digital', '#7A5CFF'),
    (4, '플랫폼 기반 노동', '배달, 대리운전, 쿠팡플렉스, 설문 참여, 테스트 작업 등 플랫폼 기반 활동', 'platform', '#13A37F'),
    (5, '재능 판매·프리랜서', '디자인, 영상 편집, 글쓰기, 개발, 번역, 외주, 레슨 등 프리랜서형 활동', 'freelance', '#E64980'),
    (6, '투자·재테크', '주식, 코인, ETF, P2P 투자, 부동산 소액 투자 등', 'investment', '#EF4444'),
    (7, '오프라인 기반 부업', '공방, 핸드메이드, 플리마켓 판매, 대면 서비스 운영 등 오프라인 기반 활동', 'offline', '#10B981'),
    (8, '기타', '명확하게 분류되지 않는 기타 부업 경험', 'etc', '#8B5CF6')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    color = VALUES(color);

UPDATE failure_experiences
SET category_id = CASE JSON_UNQUOTE(JSON_EXTRACT(structured_data, '$.rawCategory'))
    WHEN '온라인판매_이커머스' THEN 1
    WHEN '콘텐츠_SNS' THEN 2
    WHEN '디지털상품_지식판매' THEN 3
    WHEN '플랫폼노동' THEN 4
    WHEN '재능_프리랜서' THEN 5
    WHEN '투자_재테크' THEN 6
    WHEN '오프라인부업' THEN 7
    WHEN '기타' THEN 8
    ELSE category_id
END
WHERE JSON_EXTRACT(structured_data, '$.rawCategory') IS NOT NULL;
