CREATE DATABASE IF NOT EXISTS failforward
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE failforward;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    nickname VARCHAR(20) UNIQUE NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    profile_image VARCHAR(500),
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_completed BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(120) NOT NULL,
    provider_email VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_social_accounts_provider UNIQUE (provider, provider_user_id),
    CONSTRAINT fk_social_accounts_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_categories (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(20) NOT NULL,
    color VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS failure_experiences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    investment_amount INTEGER,
    duration_months INTEGER,
    average_daily_hours VARCHAR(30),
    is_concurrent_with_main_job BOOLEAN,
    monthly_revenue INTEGER,
    failure_reason VARCHAR(50) NOT NULL,
    failure_reasons JSON,
    difficulties JSON,
    target_market VARCHAR(100),
    marketing_channels JSON,
    lessons_learned TEXT,
    would_retry BOOLEAN,
    structured_data JSON,
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_failure_experiences_category
        FOREIGN KEY (category_id) REFERENCES business_categories(id),
    CONSTRAINT fk_failure_experiences_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL UNIQUE,
    fail_reason_tags JSON NOT NULL,
    summary_list JSON NOT NULL,
    structured_summary TEXT,
    risk_factor_analysis TEXT,
    risk_score DECIMAL(3,1),
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_analysis_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matched_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    case_id VARCHAR(50) NOT NULL,
    case_title VARCHAR(200) NOT NULL,
    case_summary TEXT,
    key_lesson TEXT,
    match_rate INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_matched_cases_analysis
        FOREIGN KEY (analysis_id) REFERENCES ai_analysis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    content VARCHAR(1000) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
);

CREATE INDEX idx_failure_experiences_user_id ON failure_experiences(user_id);
CREATE INDEX idx_failure_experiences_category_id ON failure_experiences(category_id);
CREATE INDEX idx_failure_experiences_business_type ON failure_experiences(business_type);
CREATE INDEX idx_failure_experiences_created_at ON failure_experiences(created_at);
CREATE INDEX idx_ai_analysis_experience_id ON ai_analysis(experience_id);
CREATE INDEX idx_matched_cases_analysis_id ON matched_cases(analysis_id);
CREATE INDEX idx_comments_experience_id ON comments(experience_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_email_verification_tokens_email ON email_verification_tokens(email);

INSERT INTO business_categories (id, name, description, icon, color)
VALUES
    (1, '온라인 판매 · 이커머스', '스마트스토어/ 쿠팡, 오픈마켓 /구매대행/ 위탁판매 (드롭쉬핑) /해외구매, 수입판매 /재고 기반 쇼핑몰 등', '🛍️', '#2F6BFF'),
    (2, '콘텐츠·SNS 기반', '유튜브/ 블로그/ 인스타그램 /티딩/ 뉴스레터 /개인 브랜딩 기반 등', '🎬', '#FF8A00'),
    (3, '디지털 상품·지식 판매', '전자책 판매/ 강의 제작 /강의 플랫폼, 디지털 판매 /노션 자료 판매/ PDF 자료 판매 등', '📘', '#7A5CFF'),
    (4, '플랫폼 기반 노동형', '배달, 대리운전, 쿠팡플렉스, 단기 알바 플랫폼 /설문 참여, 앱테크', '🧰', '#13A37F'),
    (5, '재능 판매·프리랜서', '디자인/ 영상 편집/ 글쓰기 /개발/ 번역/ 크몽, 탈잉 등 플랫폼 활동', '✍️', '#E64980'),
    (6, '투자·재테크', '주식/ 코인/ ETF/ P2P 투자 /부동산 소액 투자 등', '📈', '#EF4444'),
    (7, '오프라인 기반 부업', '공방, 핸드메이드 /플리마켓 판매 /클래스 운영 (오프라인) 등', '🏪', '#10B981'),
    (8, '기타', '명확히 분류되지 않는 기타 부업 경험', '✨', '#8B5CF6')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    color = VALUES(color);
