CREATE DATABASE IF NOT EXISTS sidepick
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sidepick;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    login_id VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(50) NOT NULL,
    birth_date DATE NULL,
    gender VARCHAR(10) NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    nickname VARCHAR(50) NOT NULL,
    has_side_hustle_experience BOOLEAN NOT NULL DEFAULT FALSE,
    nickname_change_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_login_id (login_id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_phone (phone),
    UNIQUE KEY uk_users_nickname (nickname)
);

CREATE TABLE IF NOT EXISTS social_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(100) NOT NULL,
    provider_email VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_social_provider_user (provider, provider_user_id),
    KEY idx_social_user_id (user_id),
    CONSTRAINT fk_social_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    side_hustle_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_posts_user_id (user_id),
    KEY idx_posts_category (category),
    KEY idx_posts_created_at (created_at),
    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_results (
    id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    failure_factor_top1 VARCHAR(255) NULL,
    failure_factor_top2 VARCHAR(255) NULL,
    failure_factor_top3 VARCHAR(255) NULL,
    caution_summary TEXT NULL,
    success_factors TEXT NULL,
    missing_factors TEXT NULL,
    risk_score DECIMAL(5,2) NULL,
    analysis_version VARCHAR(30) NOT NULL DEFAULT 'v1',
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_analysis_post_id (post_id),
    CONSTRAINT fk_analysis_post
        FOREIGN KEY (post_id) REFERENCES posts (id)
        ON DELETE CASCADE
);
