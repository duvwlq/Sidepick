ALTER TABLE failure_experiences
    ADD COLUMN IF NOT EXISTS weekly_hours INT NULL AFTER duration_months;

ALTER TABLE failure_experiences
    ADD COLUMN IF NOT EXISTS difficulty_etc TEXT NULL AFTER difficulties;

ALTER TABLE failure_experiences
    ADD COLUMN IF NOT EXISTS difficulty_extra TEXT NULL AFTER difficulty_etc;

ALTER TABLE ai_analysis
    ADD COLUMN IF NOT EXISTS failure_category VARCHAR(50) NULL AFTER structured_summary;

ALTER TABLE ai_analysis
    ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) NULL AFTER failure_category;
