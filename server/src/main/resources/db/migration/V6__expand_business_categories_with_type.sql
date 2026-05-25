ALTER TABLE business_categories
    ADD COLUMN IF NOT EXISTS type ENUM('business_field', 'cross_topic') NOT NULL DEFAULT 'business_field' AFTER color;

INSERT INTO business_categories (id, name, description, icon, color, type)
VALUES
    (1, '온라인 판매·이커머스', '스마트스토어, 쿠팡, 오픈마켓, 구매대행, 위탁판매, 재고 기반 쇼핑몰 등', 'commerce', '#2F6BFF', 'business_field'),
    (2, '콘텐츠·SNS', '유튜브, 블로그, 인스타그램, 릴스, 뉴스레터, 개인 브랜딩 기반 활동', 'content', '#FF8A00', 'business_field'),
    (3, '디지털·지식판매', '전자책, 강의 제작, 온라인 클래스, 지식 문서, 템플릿, PDF 자료 판매 등', 'digital', '#7A5CFF', 'business_field'),
    (4, '플랫폼 노동', '배달, 대리운전, 쿠팡플렉스, 설문 참여, 테스트 작업 등 플랫폼 기반 활동', 'platform', '#13A37F', 'business_field'),
    (5, '재능·프리랜서', '디자인, 영상 편집, 글쓰기, 개발, 번역, 외주, 레슨 등 프리랜서형 활동', 'freelance', '#E64980', 'business_field'),
    (6, '투자·재테크', '주식, 코인, ETF, P2P 투자, 부동산 소액 투자 등', 'investment', '#EF4444', 'business_field'),
    (7, '오프라인 부업', '공방, 핸드메이드, 플리마켓 판매, 대면 서비스 운영 등 오프라인 기반 활동', 'offline', '#10B981', 'business_field'),
    (8, '부업 시작 전 공통', '시작 전 체크리스트, 진입 판단, 준비도 점검 등 공통 안내', 'common', '#3B82F6', 'cross_topic'),
    (9, '세금·사업자', '사업자 등록, 세금 신고, 통신판매 신고, 비용 처리 등', 'tax', '#0F766E', 'cross_topic'),
    (10, '본업 + 부업', '겸업 가능 범위, 시간 관리, 회사 규정, 병행 전략 등', 'workplus', '#2563EB', 'cross_topic'),
    (11, '마케팅·광고 운영', '광고 집행, 유입 분석, 전환율 관리, 채널 운영 등', 'marketing', '#EA580C', 'cross_topic'),
    (12, '도구·툴 추천', '생산성 도구, 콘텐츠 툴, 자동화 도구, 관리 툴 추천', 'tools', '#7C3AED', 'cross_topic'),
    (13, '멘탈 관리·번아웃', '번아웃 예방, 리듬 관리, 감정 회복, 지속 가능성 점검', 'mental', '#DB2777', 'cross_topic'),
    (14, '법률·계약', '계약서, 저작권, 분쟁 대응, 환불 정책, 법적 유의사항', 'legal', '#DC2626', 'cross_topic'),
    (15, '회계·장부', '장부 정리, 영수증 보관, 손익 계산, 세무 준비', 'accounting', '#0891B2', 'cross_topic'),
    (16, '부업 인사이트', '시장 흐름, 성장 전략, 사례 해석, 장기 운영 인사이트', 'insight', '#4F46E5', 'cross_topic')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    color = VALUES(color),
    type = VALUES(type);
