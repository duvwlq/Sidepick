CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(20) UNIQUE NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    profile_image VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS failure_experiences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    investment_amount INTEGER,
    duration_months INTEGER,
    failure_reason VARCHAR(50) NOT NULL,
    target_market VARCHAR(100),
    marketing_channels JSONB,
    lessons_learned TEXT,
    would_retry BOOLEAN,
    structured_data JSONB,
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGSERIAL PRIMARY KEY,
    experience_id BIGINT NOT NULL UNIQUE REFERENCES failure_experiences(id) ON DELETE CASCADE,
    fail_reason_tags JSONB NOT NULL,
    summary_list JSONB NOT NULL,
    risk_factor_analysis TEXT,
    risk_score DECIMAL(3,1),
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matched_cases (
    id BIGSERIAL PRIMARY KEY,
    analysis_id BIGINT NOT NULL REFERENCES ai_analysis(id) ON DELETE CASCADE,
    case_id VARCHAR(50) NOT NULL,
    case_title VARCHAR(200) NOT NULL,
    case_summary TEXT,
    key_lesson TEXT,
    match_rate INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    experience_id BIGINT NOT NULL REFERENCES failure_experiences(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES comments(id) ON DELETE SET NULL,
    content VARCHAR(1000) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_failure_experiences_user_id ON failure_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_failure_experiences_business_type ON failure_experiences(business_type);
CREATE INDEX IF NOT EXISTS idx_failure_experiences_created_at ON failure_experiences(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_experience_id ON ai_analysis(experience_id);
CREATE INDEX IF NOT EXISTS idx_matched_cases_analysis_id ON matched_cases(analysis_id);
CREATE INDEX IF NOT EXISTS idx_comments_experience_id ON comments(experience_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
