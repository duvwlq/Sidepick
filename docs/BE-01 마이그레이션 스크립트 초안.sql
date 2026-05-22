-- BE-01 마이그레이션 스크립트 초안
-- Draft only. Do not apply without final review.

ALTER TABLE users
    ADD COLUMN full_name VARCHAR(50) NULL AFTER nickname,
    ADD COLUMN birth_date DATE NULL AFTER full_name,
    ADD COLUMN gender VARCHAR(20) NULL AFTER birth_date,
    ADD COLUMN region VARCHAR(50) NULL AFTER gender,
    ADD COLUMN signup_purpose VARCHAR(30) NULL AFTER region,
    ADD COLUMN side_hustle_experience_status VARCHAR(20) NULL AFTER signup_purpose;

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
