CREATE DATABASE IF NOT EXISTS failforward
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE failforward;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    nickname VARCHAR(20) UNIQUE NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    profile_image VARCHAR(500),
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_completed BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS business_categories (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(20) NOT NULL,
    color VARCHAR(20) NOT NULL,
    type ENUM('business_field', 'cross_topic') NOT NULL
);

CREATE TABLE IF NOT EXISTS failure_experiences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    investment_amount BIGINT,
    duration_months INTEGER,
    average_daily_hours VARCHAR(30),
    is_concurrent_with_main_job BOOLEAN,
    monthly_revenue BIGINT,
    failure_reason VARCHAR(50) NOT NULL,
    failure_reasons JSON,
    difficulties JSON,
    target_market VARCHAR(100),
    marketing_channels JSON,
    lessons_learned TEXT,
    would_retry BOOLEAN,
    structured_data JSON,
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_failure_experiences_category
        FOREIGN KEY (category_id) REFERENCES business_categories(id),
    CONSTRAINT fk_failure_experiences_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL UNIQUE,
    fail_reason_tags JSON NOT NULL,
    summary_list JSON NOT NULL,
    structured_summary TEXT,
    risk_factor_analysis TEXT,
    risk_score DECIMAL(3,1),
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_analysis_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matched_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    case_id VARCHAR(50) NOT NULL,
    case_title VARCHAR(200) NOT NULL,
    case_summary TEXT,
    key_lesson TEXT,
    match_rate INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_matched_cases_analysis
        FOREIGN KEY (analysis_id) REFERENCES ai_analysis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    experience_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    content VARCHAR(1000) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_experience
        FOREIGN KEY (experience_id) REFERENCES failure_experiences(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
);

CREATE INDEX idx_failure_experiences_user_id ON failure_experiences(user_id);
CREATE INDEX idx_failure_experiences_category_id ON failure_experiences(category_id);
CREATE INDEX idx_failure_experiences_business_type ON failure_experiences(business_type);
CREATE INDEX idx_failure_experiences_created_at ON failure_experiences(created_at);
CREATE INDEX idx_ai_analysis_experience_id ON ai_analysis(experience_id);
CREATE INDEX idx_matched_cases_analysis_id ON matched_cases(analysis_id);
CREATE INDEX idx_comments_experience_id ON comments(experience_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_email_verification_tokens_email ON email_verification_tokens(email);

INSERT INTO business_categories (id, name, description, icon, color, type)
VALUES
    (1, '온라인 판매·이커머스', '스마트스토어, 쿠팡, 오픈마켓, 구매대행, 위탁판매, 재고 기반 쇼핑몰 등', 'commerce', '#2F6BFF', 'business_field'),
    (2, '콘텐츠·SNS', '유튜브, 블로그, 인스타그램, 릴스, 뉴스레터, 개인 브랜딩 기반 활동', 'content', '#FF8A00', 'business_field'),
    (3, '디지털·지식판매', '전자책, 강의 제작, 온라인 클래스, 지식 문서, 템플릿, PDF 자료 판매 등', 'digital', '#7A5CFF', 'business_field'),
    (4, '플랫폼 노동', '배달, 대리운전, 쿠팡플렉스, 설문 참여, 테스트 작업 등 플랫폼 기반 활동', 'platform', '#13A37F', 'business_field'),
    (5, '재능·프리랜서', '디자인, 영상 편집, 글쓰기, 개발, 번역, 외주, 레슨 등 프리랜서형 활동', 'freelance', '#E64980', 'business_field'),
    (6, '투자·재테크', '주식, 코인, ETF, P2P 투자, 부동산 소액 투자 등', 'investment', '#EF4444', 'business_field'),
    (7, '오프라인 부업', '공방, 핸드메이드, 플리마켓 판매, 대면 서비스 운영 등 오프라인 기반 활동', 'offline', '#10B981', 'business_field'),
    (8, '부업 시작 전 공통', '시작 전 체크리스트, 진입 판단, 준비도 점검 등 공통 안내', 'common', '#3B82F6', 'cross_topic'),
    (9, '세금·사업자', '사업자 등록, 세금 신고, 통신판매 신고, 비용 처리 등', 'tax', '#0F766E', 'cross_topic'),
    (10, '본업 + 부업', '겸업 가능 범위, 시간 관리, 회사 규정, 병행 전략 등', 'workplus', '#2563EB', 'cross_topic'),
    (11, '마케팅·광고 운영', '광고 집행, 유입 분석, 전환율 관리, 채널 운영 등', 'marketing', '#EA580C', 'cross_topic'),
    (12, '도구·툴 추천', '생산성 도구, 콘텐츠 툴, 자동화 도구, 관리 툴 추천', 'tools', '#7C3AED', 'cross_topic'),
    (13, '멘탈 관리·번아웃', '번아웃 예방, 리듬 관리, 감정 회복, 지속 가능성 점검', 'mental', '#DB2777', 'cross_topic'),
    (14, '법률·계약', '계약서, 저작권, 분쟁 대응, 환불 정책, 법적 유의사항', 'legal', '#DC2626', 'cross_topic'),
    (15, '회계·장부', '장부 정리, 영수증 보관, 손익 계산, 세무 준비', 'accounting', '#0891B2', 'cross_topic'),
    (16, '부업 인사이트', '시장 흐름, 성장 전략, 사례 해석, 장기 운영 인사이트', 'insight', '#4F46E5', 'cross_topic')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    color = VALUES(color),
    type = VALUES(type);
