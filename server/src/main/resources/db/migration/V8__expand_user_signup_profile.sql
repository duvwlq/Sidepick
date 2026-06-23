ALTER TABLE users
    ADD COLUMN full_name VARCHAR(50) NULL AFTER nickname,
    ADD COLUMN birth_date DATE NULL AFTER full_name,
    ADD COLUMN gender VARCHAR(30) NULL AFTER birth_date,
    ADD COLUMN region VARCHAR(50) NULL AFTER gender,
    ADD COLUMN signup_purposes VARCHAR(500) NULL AFTER region,
    ADD COLUMN experience_status VARCHAR(30) NULL AFTER signup_purposes;
