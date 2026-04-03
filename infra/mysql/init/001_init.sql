CREATE DATABASE IF NOT EXISTS failforward
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE failforward;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(20) UNIQUE NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    profile_image VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS failure_experiences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    investment_amount INTEGER,
    duration_months INTEGER,
    failure_reason VARCHAR(50) NOT NULL,
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
    CONSTRAINT fk_failure_experiences_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL UNIQUE,
    fail_reason_tags JSON NOT NULL,
    summary_list JSON NOT NULL,
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
CREATE INDEX idx_failure_experiences_business_type ON failure_experiences(business_type);
CREATE INDEX idx_failure_experiences_created_at ON failure_experiences(created_at);
CREATE INDEX idx_ai_analysis_experience_id ON ai_analysis(experience_id);
CREATE INDEX idx_matched_cases_analysis_id ON matched_cases(analysis_id);
CREATE INDEX idx_comments_experience_id ON comments(experience_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
