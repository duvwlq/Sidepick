CREATE DATABASE IF NOT EXISTS failforward
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE failforward;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(20) NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    profile_image VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_nickname (nickname)
);

CREATE TABLE IF NOT EXISTS failure_experiences (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    investment_amount INT NULL,
    duration_months INT NULL,
    failure_reason VARCHAR(50) NOT NULL,
    target_market VARCHAR(100) NULL,
    marketing_channels JSON NULL,
    lessons_learned TEXT NULL,
    would_retry BOOLEAN NULL,
    structured_data JSON NULL,
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_failure_experiences_user_id (user_id),
    KEY idx_failure_experiences_business_type (business_type),
    KEY idx_failure_experiences_created_at (created_at),
    CONSTRAINT fk_failure_experiences_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGINT NOT NULL AUTO_INCREMENT,
    experience_id BIGINT NOT NULL,
    fail_reason_tags JSON NOT NULL,
    summary_list JSON NOT NULL,
    risk_factor_analysis TEXT NULL,
    risk_score DECIMAL(3,1) NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_analysis_experience_id (experience_id),
    KEY idx_ai_analysis_experience_id (experience_id),
    CONSTRAINT fk_ai_analysis_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matched_cases (
    id BIGINT NOT NULL AUTO_INCREMENT,
    analysis_id BIGINT NOT NULL,
    case_id VARCHAR(50) NOT NULL,
    case_title VARCHAR(200) NOT NULL,
    case_summary TEXT NULL,
    key_lesson TEXT NULL,
    match_rate INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_matched_cases_analysis_id (analysis_id),
    CONSTRAINT fk_matched_cases_analysis
        FOREIGN KEY (analysis_id) REFERENCES ai_analysis (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    experience_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    content VARCHAR(1000) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comments_experience_id (experience_id),
    KEY idx_comments_user_id (user_id),
    CONSTRAINT fk_comments_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent
        FOREIGN KEY (parent_id) REFERENCES comments (id)
        ON DELETE SET NULL
);

