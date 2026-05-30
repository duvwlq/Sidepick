CREATE TABLE experience_bookmarks (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_experience_bookmark UNIQUE (experience_id, user_id),
    CONSTRAINT fk_experience_bookmarks_experience FOREIGN KEY (experience_id) REFERENCES failure_experiences (id) ON DELETE CASCADE,
    CONSTRAINT fk_experience_bookmarks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE experience_reactions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_experience_reaction UNIQUE (experience_id, user_id, reaction_type),
    CONSTRAINT fk_experience_reactions_experience FOREIGN KEY (experience_id) REFERENCES failure_experiences (id) ON DELETE CASCADE,
    CONSTRAINT fk_experience_reactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_experience_views (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    last_viewed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_user_experience_view UNIQUE (experience_id, user_id),
    CONSTRAINT fk_user_experience_views_experience FOREIGN KEY (experience_id) REFERENCES failure_experiences (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_experience_views_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
