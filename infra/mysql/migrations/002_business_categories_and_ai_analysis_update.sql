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
    (1, '온라인 사업', '스마트스토어, 블로그, 유튜브 등 온라인 기반 부업', '💻', '#3B82F6'),
    (2, '오프라인 사업', '매장 운영, 지역 서비스 등 오프라인 판매 중심 부업', '🏪', '#10B981'),
    (3, '콘텐츠', '전자책, 강의, 뉴스레터, 크리에이터형 부업', '🎨', '#F59E0B'),
    (4, '투자·자동화', '광고 운영, 자동화 수익화, 실험형 사이드 프로젝트', '📈', '#EF4444'),
    (5, '기타', '명확히 분류되지 않는 기타 부업 경험', '✨', '#8B5CF6')
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
