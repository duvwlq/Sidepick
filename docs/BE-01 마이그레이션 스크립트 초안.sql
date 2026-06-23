-- BE-01 마이그레이션 스크립트 초안
-- Draft only. Do not apply without final review.

ALTER TABLE users
    ADD COLUMN full_name VARCHAR(50) NULL AFTER nickname,
    ADD COLUMN birth_date DATE NULL AFTER full_name,
    ADD COLUMN gender VARCHAR(20) NULL AFTER birth_date,
    ADD COLUMN region VARCHAR(50) NULL AFTER gender,
    ADD COLUMN signup_purpose VARCHAR(30) NULL AFTER region,
    ADD COLUMN side_hustle_experience_status VARCHAR(20) NULL AFTER signup_purpose;

-- v1 MVP 기준 business_categories 현황(확인 기준)
-- 8 rows:
-- 1 commerce          온라인 판매·이커머스
-- 2 content-sns       콘텐츠·SNS
-- 3 digital-product   디지털·지식판매
-- 4 platform-labor    플랫폼 노동
-- 5 talent            재능·프리랜서
-- 6 investment        투자·재테크
-- 7 offline           오프라인 부업
-- 8 pre-start         부업 시작 전 공통

ALTER TABLE business_categories
    ADD COLUMN type ENUM('business_field', 'cross_topic') NOT NULL DEFAULT 'business_field' AFTER color;

INSERT INTO business_categories (id, name, description, icon, color, type)
VALUES
    (1, '온라인 판매·이커머스', '스마트스토어, 쿠팡, 오픈마켓, 구매대행, 위탁판매, 재고 기반 쇼핑몰 등', 'commerce', '#2F6BFF', 'business_field'),
    (2, '콘텐츠·SNS', '유튜브, 블로그, 인스타그램, 릴스, 뉴스레터, 개인 브랜딩 기반 활동', 'content-sns', '#FF8A00', 'business_field'),
    (3, '디지털·지식판매', '전자책, 강의 제작, 온라인 클래스, 지식 문서, 템플릿, PDF 자료 판매 등', 'digital-product', '#7A5CFF', 'business_field'),
    (4, '플랫폼 노동', '배달, 대리운전, 쿠팡플렉스, 설문 참여, 테스트 작업 등 플랫폼 기반 활동', 'platform-labor', '#13A37F', 'business_field'),
    (5, '재능·프리랜서', '디자인, 영상 편집, 글쓰기, 개발, 번역, 외주, 레슨 등 프리랜서형 활동', 'talent', '#E64980', 'business_field'),
    (6, '투자·재테크', '주식, 코인, ETF, P2P 투자, 부동산 소액 투자 등', 'investment', '#EF4444', 'business_field'),
    (7, '오프라인 부업', '공방, 핸드메이드, 플리마켓 판매, 대면 서비스 운영 등 오프라인 기반 활동', 'offline', '#10B981', 'business_field'),
    (8, '부업 시작 전 공통', '시작 전 체크리스트, 진입 판단, 준비도 점검 등 공통 안내', 'pre-start', '#3B82F6', 'cross_topic'),
    (9, '세금·사업자', '사업자 등록, 세금 신고, 통신판매 신고, 비용 처리 등', 'tax', '#0F766E', 'cross_topic'),
    (10, '본업 + 부업', '겸업 가능 범위, 시간 관리, 회사 규정, 병행 전략 등', 'work-balance', '#2563EB', 'cross_topic'),
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

CREATE TABLE user_interest_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_interest_categories UNIQUE (user_id, category_id),
    CONSTRAINT fk_user_interest_categories_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_interest_categories_category
        FOREIGN KEY (category_id) REFERENCES business_categories(id) ON DELETE CASCADE
);

CREATE TABLE experience_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_experience_images_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences(id) ON DELETE CASCADE
);

CREATE TABLE experience_bookmarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    experience_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_experience_bookmarks UNIQUE (user_id, experience_id),
    CONSTRAINT fk_experience_bookmarks_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_experience_bookmarks_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences(id) ON DELETE CASCADE
);

CREATE TABLE experience_reactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    experience_id BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_experience_reactions UNIQUE (user_id, experience_id, reaction_type),
    CONSTRAINT fk_experience_reactions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_experience_reactions_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    actor_user_id BIGINT NULL,
    type VARCHAR(30) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id BIGINT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE success_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    source_url VARCHAR(500) NULL,
    source_title VARCHAR(200) NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    investment_amount INT NULL,
    duration_months INT NULL,
    weekly_hours INT NULL,
    monthly_revenue INT NULL,
    success_factors JSON NULL,
    keywords JSON NULL,
    structured_data JSON NULL,
    ai_summary TEXT NULL,
    difference_points JSON NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_success_cases_category
        FOREIGN KEY (category_id) REFERENCES business_categories(id)
);

CREATE TABLE user_token_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usage_date DATE NOT NULL,
    user_id BIGINT NOT NULL,
    agent_type VARCHAR(20) NOT NULL,
    request_count INT NOT NULL DEFAULT 0,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    estimated_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
    fallback_count INT NOT NULL DEFAULT 0,
    blocked_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_token_usage UNIQUE (usage_date, user_id, agent_type),
    CONSTRAINT fk_user_token_usage_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE llm_request_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    agent_type VARCHAR(20) NOT NULL,
    route_type VARCHAR(20) NOT NULL,
    model_name VARCHAR(80) NOT NULL,
    prompt_version VARCHAR(30) NOT NULL,
    input_chars INT NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    estimated_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
    tool_calls INT NOT NULL DEFAULT 0,
    iterations INT NOT NULL DEFAULT 0,
    fallback_reason VARCHAR(50) NULL,
    response_status VARCHAR(20) NOT NULL,
    latency_ms INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_llm_request_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_experience_images_experience_id ON experience_images(experience_id);
CREATE INDEX idx_notifications_user_created_at ON notifications(user_id, created_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_success_cases_category_id ON success_cases(category_id);
CREATE INDEX idx_success_cases_published_at ON success_cases(published_at);
CREATE INDEX idx_user_token_usage_user_date ON user_token_usage(user_id, usage_date);
CREATE INDEX idx_llm_request_logs_created_at ON llm_request_logs(created_at);
CREATE INDEX idx_llm_request_logs_user_created_at ON llm_request_logs(user_id, created_at);
