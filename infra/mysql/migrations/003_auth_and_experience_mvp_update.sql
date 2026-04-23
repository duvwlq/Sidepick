USE failforward;

ALTER TABLE users
    MODIFY COLUMN password VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL' AFTER profile_image,
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER auth_provider,
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT TRUE AFTER email_verified;

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

ALTER TABLE failure_experiences
    ADD COLUMN IF NOT EXISTS average_daily_hours VARCHAR(30) NULL AFTER duration_months,
    ADD COLUMN IF NOT EXISTS is_concurrent_with_main_job BOOLEAN NULL AFTER average_daily_hours,
    ADD COLUMN IF NOT EXISTS monthly_revenue INTEGER NULL AFTER is_concurrent_with_main_job,
    ADD COLUMN IF NOT EXISTS failure_reasons JSON NULL AFTER failure_reason,
    ADD COLUMN IF NOT EXISTS difficulties JSON NULL AFTER failure_reasons;

CREATE INDEX idx_email_verification_tokens_email ON email_verification_tokens(email);
