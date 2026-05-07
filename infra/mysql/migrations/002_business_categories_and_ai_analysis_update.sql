USE failforward;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS business_categories (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(20) NOT NULL,
    color VARCHAR(20) NOT NULL
);

INSERT INTO business_categories (id, name, description, icon, color)
VALUES
    (1, '온라인 판매 · 이커머스', '스마트스토어, 쿠팡, 오픈마켓, 구매대행, 위탁판매, 재고 기반 쇼핑몰 등', 'commerce', '#2F6BFF'),
    (2, '콘텐츠·SNS 기반', '유튜브, 블로그, 인스타그램, 릴스, 뉴스레터, 개인 브랜드 기반 등', 'content', '#FF8A00'),
    (3, '디지털 상품·지식 판매', '전자책, 강의 제작, 클래스, 강의 플랫폼, 지식 판매, 노션 자료, PDF 자료 판매 등', 'digital', '#7A5CFF'),
    (4, '플랫폼 기반 노동형', '배달, 퀵커머스, 대리운전, 쿠팡플렉스, 단기 알바 플랫폼, 설문 참여, 테스트 등', 'platform', '#13A37F'),
    (5, '재능 판매·프리랜서', '디자인, 영상 편집, 글쓰기, 기고, 라이팅, 개발, 번역, 외주, 레슨 등 플랫폼 활동', 'freelance', '#E64980'),
    (6, '투자·재테크', '주식, 코인, ETF, P2P 투자, 부동산 소액 투자 등', 'investment', '#EF4444'),
    (7, '오프라인 기반 부업', '공방, 핸드메이드, 플리마켓 판매, 클래스 운영 등 오프라인 기반 활동', 'offline', '#10B981'),
    (8, '기타', '명확하게 분류되지 않는 기타 부업 경험', 'etc', '#8B5CF6')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    color = VALUES(color);

ALTER TABLE ai_analysis
    ADD COLUMN IF NOT EXISTS structured_summary TEXT NULL AFTER summary_list;

ALTER TABLE failure_experiences
    ADD COLUMN IF NOT EXISTS category_id BIGINT NULL AFTER user_id;

UPDATE failure_experiences
SET category_id = 5
WHERE category_id IS NULL;

ALTER TABLE failure_experiences
    MODIFY COLUMN category_id BIGINT NOT NULL;

SET @has_category_fk := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'failure_experiences'
      AND CONSTRAINT_NAME = 'fk_failure_experiences_category'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_category_fk_sql := IF(
    @has_category_fk = 0,
    'ALTER TABLE failure_experiences ADD CONSTRAINT fk_failure_experiences_category FOREIGN KEY (category_id) REFERENCES business_categories(id)',
    'SELECT 1'
);

PREPARE add_category_fk_stmt FROM @add_category_fk_sql;
EXECUTE add_category_fk_stmt;
DEALLOCATE PREPARE add_category_fk_stmt;

SET @has_category_index := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'failure_experiences'
      AND INDEX_NAME = 'idx_failure_experiences_category_id'
);

SET @add_category_index_sql := IF(
    @has_category_index = 0,
    'CREATE INDEX idx_failure_experiences_category_id ON failure_experiences(category_id)',
    'SELECT 1'
);

PREPARE add_category_index_stmt FROM @add_category_index_sql;
EXECUTE add_category_index_stmt;
DEALLOCATE PREPARE add_category_index_stmt;
