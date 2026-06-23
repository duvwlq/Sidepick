ALTER TABLE failure_experiences
    ADD COLUMN case_status VARCHAR(20) NOT NULL DEFAULT 'FAILURE' AFTER is_public;

UPDATE failure_experiences
SET case_status = 'FAILURE'
WHERE case_status IS NULL OR TRIM(case_status) = '';
