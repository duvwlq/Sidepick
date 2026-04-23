CREATE DATABASE IF NOT EXISTS failforward
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE failforward;

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
    (1, '온라인사업', '쇼핑몰, 블로그, 유튜브 등 온라인 기반 부업', '💻', '#3B82F6'),
    (2, '오프라인사업', '매장 운영, 로컬 서비스, 오프라인 판매 중심 부업', '🏪', '#10B981'),
    (3, '콘텐츠', '전자책, 강의, 뉴스레터, 크리에이터형 부업', '📝', '#F59E0B'),
    (4, '투자형', '스마트스토어 자동화, 재고형 사업, 소규모 투자 시도', '💰', '#EF4444'),
    (5, '기타', '명확히 분류되지 않는 기타 부업', '📦', '#8B5CF6')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    color = VALUES(color);
