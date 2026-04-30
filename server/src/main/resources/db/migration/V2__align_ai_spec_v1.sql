ALTER TABLE failure_experiences
    ADD COLUMN weekly_hours INT NULL AFTER duration_months;

ALTER TABLE failure_experiences
    ADD COLUMN difficulty_etc TEXT NULL AFTER difficulties;

ALTER TABLE failure_experiences
    ADD COLUMN difficulty_extra TEXT NULL AFTER difficulty_etc;

ALTER TABLE ai_analysis
    ADD COLUMN failure_category VARCHAR(50) NULL AFTER structured_summary;

ALTER TABLE ai_analysis
    ADD COLUMN risk_level VARCHAR(20) NULL AFTER failure_category;
