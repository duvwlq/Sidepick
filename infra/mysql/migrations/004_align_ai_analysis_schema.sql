USE failforward;
SET NAMES utf8mb4;

ALTER TABLE ai_analysis
    ADD COLUMN IF NOT EXISTS structured_summary TEXT NULL AFTER summary_list,
    ADD COLUMN IF NOT EXISTS risk_factor_analysis TEXT NULL AFTER structured_summary,
    ADD COLUMN IF NOT EXISTS risk_score DECIMAL(3,1) NULL AFTER risk_factor_analysis,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER risk_score;

ALTER TABLE matched_cases
    ADD COLUMN IF NOT EXISTS case_summary TEXT NULL AFTER case_title,
    ADD COLUMN IF NOT EXISTS key_lesson TEXT NULL AFTER case_summary,
    ADD COLUMN IF NOT EXISTS match_rate INTEGER NOT NULL DEFAULT 0 AFTER key_lesson,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER match_rate;
