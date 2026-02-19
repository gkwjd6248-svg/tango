-- ============================================================
-- 글로벌 탱고 커뮤니티 앱 - 초기 데이터베이스 스키마
-- PostgreSQL 16 + PostGIS 3.4
-- ============================================================

-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. users (유저)
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    nickname        VARCHAR(30) NOT NULL,
    avatar_url      TEXT,
    country_code    CHAR(2) NOT NULL,                          -- ISO 3166-1 alpha-2
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en',       -- ISO 639-1
    auth_provider   VARCHAR(20) NOT NULL DEFAULT 'local'
        CHECK (auth_provider IN ('local', 'google', 'apple', 'kakao')),
    auth_provider_id VARCHAR(255),
    bio             TEXT,
    dance_level     VARCHAR(20) NOT NULL DEFAULT 'beginner'
        CHECK (dance_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ                                -- soft delete
);

COMMENT ON TABLE users IS '앱 사용자 정보 (국가, 언어, 댄스 레벨 포함)';
CREATE INDEX idx_users_country_code ON users(country_code);
CREATE INDEX idx_users_dance_level ON users(dance_level);

-- ============================================================
-- 2. crawl_sources (크롤링 소스 관리)
-- ============================================================
CREATE TABLE crawl_sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    base_url        TEXT NOT NULL,
    crawl_frequency VARCHAR(20) NOT NULL DEFAULT 'daily'
        CHECK (crawl_frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    last_crawled_at TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    parser_config   JSONB NOT NULL DEFAULT '{}',               -- 사이트별 파싱 설정
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE crawl_sources IS '크롤링 대상 웹사이트 관리';

-- ============================================================
-- 3. crawl_logs (크롤링 실행 이력)
-- ============================================================
CREATE TABLE crawl_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crawl_source_id UUID NOT NULL REFERENCES crawl_sources(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'failed', 'partial')),
    events_found    INTEGER NOT NULL DEFAULT 0,
    events_created  INTEGER NOT NULL DEFAULT 0,
    events_updated  INTEGER NOT NULL DEFAULT 0,
    error_log       TEXT
);

COMMENT ON TABLE crawl_logs IS '크롤링 실행 이력 및 통계';
CREATE INDEX idx_crawl_logs_source_id ON crawl_logs(crawl_source_id);
CREATE INDEX idx_crawl_logs_started_at ON crawl_logs(started_at DESC);

-- ============================================================
-- 4. events (밀롱가/행사/수업)
-- ============================================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    event_type      VARCHAR(20) NOT NULL
        CHECK (event_type IN ('milonga', 'festival', 'workshop', 'class', 'practica')),
    venue_name      VARCHAR(300),
    address         TEXT,
    city            VARCHAR(100),
    country_code    CHAR(2) NOT NULL,                          -- ISO 3166-1 alpha-2
    location        GEOGRAPHY(POINT, 4326),                    -- PostGIS 좌표
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    start_datetime  TIMESTAMPTZ NOT NULL,
    end_datetime    TIMESTAMPTZ,
    recurrence_rule VARCHAR(500),                               -- RFC 5545 RRULE
    source_url      TEXT,
    crawl_source_id UUID REFERENCES crawl_sources(id) ON DELETE SET NULL,
    organizer_name  VARCHAR(255),
    organizer_contact VARCHAR(255),
    price_info      VARCHAR(255),
    currency        CHAR(3),                                    -- ISO 4217
    image_urls      JSONB DEFAULT '[]',
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE events IS '전 세계 탱고 행사 정보 (밀롱가, 페스티벌, 워크숍, 수업, 프랙티카)';
CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_country_code ON events(country_code);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_source_url ON events(source_url);

-- ============================================================
-- 5. hotel_affiliates (호텔 제휴)
-- ============================================================
CREATE TABLE hotel_affiliates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    hotel_name              VARCHAR(300) NOT NULL,
    hotel_address           TEXT,
    location                GEOGRAPHY(POINT, 4326),
    latitude                DOUBLE PRECISION,
    longitude               DOUBLE PRECISION,
    distance_from_event_meters INTEGER,
    price_per_night_min     DECIMAL(10, 2),
    currency                CHAR(3) DEFAULT 'USD',
    rating                  DECIMAL(2, 1),
    review_count            INTEGER DEFAULT 0,
    affiliate_provider      VARCHAR(20) NOT NULL
        CHECK (affiliate_provider IN ('booking_com', 'agoda')),
    affiliate_url           TEXT NOT NULL,
    affiliate_id            VARCHAR(255),
    image_url               TEXT,
    amenities               JSONB DEFAULT '[]',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE hotel_affiliates IS '행사 근처 호텔 제휴 정보 (Booking.com, Agoda)';
CREATE INDEX idx_hotels_event_id ON hotel_affiliates(event_id);
CREATE INDEX idx_hotels_location ON hotel_affiliates USING GIST(location);
CREATE INDEX idx_hotels_provider ON hotel_affiliates(affiliate_provider);

-- ============================================================
-- 6. product_deals (탱고 상품 특가)
-- ============================================================
CREATE TABLE product_deals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    product_category    VARCHAR(20) NOT NULL
        CHECK (product_category IN ('shoes', 'clothing', 'accessories', 'music', 'other')),
    original_price      DECIMAL(10, 2) NOT NULL,
    deal_price          DECIMAL(10, 2) NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    discount_percentage INTEGER GENERATED ALWAYS AS (
        CASE WHEN original_price > 0
            THEN ROUND(((original_price - deal_price) / original_price * 100))::INTEGER
            ELSE 0
        END
    ) STORED,
    affiliate_provider  VARCHAR(20) NOT NULL
        CHECK (affiliate_provider IN ('coupang', 'amazon', 'aliexpress')),
    affiliate_url       TEXT NOT NULL,
    affiliate_id        VARCHAR(255),
    image_urls          JSONB DEFAULT '[]',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_deals IS '탱고 상품 특가 (쿠팡, 아마존, 알리익스프레스)';
CREATE INDEX idx_products_category ON product_deals(product_category);
CREATE INDEX idx_products_provider ON product_deals(affiliate_provider);
CREATE INDEX idx_products_is_active ON product_deals(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_expires_at ON product_deals(expires_at);

-- ============================================================
-- 7. affiliate_clicks (수수료 추적)
-- ============================================================
CREATE TABLE affiliate_clicks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    affiliate_type      VARCHAR(20) NOT NULL
        CHECK (affiliate_type IN ('hotel', 'product')),
    affiliate_item_id   UUID NOT NULL,                          -- hotel_affiliates.id 또는 product_deals.id
    clicked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted           BOOLEAN NOT NULL DEFAULT FALSE,
    conversion_amount   DECIMAL(10, 2),
    commission_amount   DECIMAL(10, 2)
);

COMMENT ON TABLE affiliate_clicks IS '제휴 클릭 및 전환 추적 (수수료 정산용)';
CREATE INDEX idx_clicks_user_id ON affiliate_clicks(user_id);
CREATE INDEX idx_clicks_type ON affiliate_clicks(affiliate_type);
CREATE INDEX idx_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);
CREATE INDEX idx_clicks_converted ON affiliate_clicks(converted) WHERE converted = TRUE;

-- ============================================================
-- 8. community_posts (커뮤니티 게시글)
-- ============================================================
CREATE TABLE community_posts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_text                TEXT NOT NULL,
    content_text_original_lang  VARCHAR(5),                    -- 원본 언어 코드
    media_urls                  JSONB DEFAULT '[]',
    media_type                  VARCHAR(10) NOT NULL DEFAULT 'none'
        CHECK (media_type IN ('none', 'image', 'video')),
    post_type                   VARCHAR(20) NOT NULL DEFAULT 'general'
        CHECK (post_type IN ('general', 'review', 'question', 'meetup')),
    country_scope               CHAR(2),                       -- NULL = 글로벌, 값 있으면 해당 국가 전용
    like_count                  INTEGER NOT NULL DEFAULT 0,    -- denormalized
    comment_count               INTEGER NOT NULL DEFAULT 0,    -- denormalized
    share_count                 INTEGER NOT NULL DEFAULT 0,    -- denormalized
    is_pinned                   BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden                   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ                    -- soft delete
);

COMMENT ON TABLE community_posts IS '커뮤니티 게시글 (글로벌/국가별 피드)';
CREATE INDEX idx_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_posts_country_scope ON community_posts(country_scope);
CREATE INDEX idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_posts_post_type ON community_posts(post_type);
CREATE INDEX idx_posts_not_deleted ON community_posts(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- 9. post_translations (번역 캐시)
-- ============================================================
CREATE TABLE post_translations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    target_language     VARCHAR(5) NOT NULL,                   -- ISO 639-1
    translated_text     TEXT NOT NULL,
    translation_provider VARCHAR(20) NOT NULL DEFAULT 'deepl'
        CHECK (translation_provider IN ('deepl', 'google', 'claude')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, target_language)                           -- 게시글당 언어별 1개 번역만
);

COMMENT ON TABLE post_translations IS '게시글 번역 캐시 (API 비용 절감)';
CREATE INDEX idx_translations_post_id ON post_translations(post_id);

-- ============================================================
-- 10. comments (댓글)
-- ============================================================
CREATE TABLE comments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id   UUID REFERENCES comments(id) ON DELETE CASCADE,  -- 대댓글
    content_text        TEXT NOT NULL,
    like_count          INTEGER NOT NULL DEFAULT 0,            -- denormalized
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ                            -- soft delete
);

COMMENT ON TABLE comments IS '게시글 댓글 (대댓글 지원)';
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- ============================================================
-- 11. likes (좋아요 - polymorphic)
-- ============================================================
CREATE TABLE likes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    likeable_type   VARCHAR(10) NOT NULL
        CHECK (likeable_type IN ('post', 'comment')),
    likeable_id     UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, likeable_type, likeable_id)                -- 중복 좋아요 방지
);

COMMENT ON TABLE likes IS '좋아요 (게시글/댓글 공통)';
CREATE INDEX idx_likes_likeable ON likes(likeable_type, likeable_id);

-- ============================================================
-- 12. reports (신고)
-- ============================================================
CREATE TABLE reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_type       VARCHAR(10) NOT NULL
        CHECK (reported_type IN ('post', 'comment', 'user')),
    reported_id         UUID NOT NULL,
    reason              TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_note          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reports IS '부적절한 콘텐츠/유저 신고';
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reported ON reports(reported_type, reported_id);

-- ============================================================
-- 13. notifications (알림)
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL
        CHECK (type IN ('new_event', 'event_reminder', 'new_comment', 'new_like', 'new_follower', 'deal_alert', 'system')),
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    data            JSONB DEFAULT '{}',                        -- 알림 유형별 추가 데이터
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS '푸시 알림 및 인앱 알림';
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- 14. user_event_bookmarks (행사 북마크)
-- ============================================================
CREATE TABLE user_event_bookmarks (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

COMMENT ON TABLE user_event_bookmarks IS '유저 행사 북마크 (관심 행사 저장)';
CREATE INDEX idx_bookmarks_event_id ON user_event_bookmarks(event_id);

-- ============================================================
-- 트리거: updated_at 자동 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crawl_sources_updated_at BEFORE UPDATE ON crawl_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_hotels_updated_at BEFORE UPDATE ON hotel_affiliates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON product_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 트리거: PostGIS location 자동 갱신 (lat/lng 변경 시)
-- ============================================================
CREATE OR REPLACE FUNCTION update_location_from_coords()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_location BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_location_from_coords();

CREATE TRIGGER trg_hotels_location BEFORE INSERT OR UPDATE ON hotel_affiliates
    FOR EACH ROW EXECUTE FUNCTION update_location_from_coords();

-- ============================================================
-- 트리거: denormalized 카운터 자동 갱신
-- ============================================================

-- 좋아요 카운터
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.likeable_type = 'post' THEN
            UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.likeable_id;
        ELSIF NEW.likeable_type = 'comment' THEN
            UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.likeable_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.likeable_type = 'post' THEN
            UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.likeable_id;
        ELSIF OLD.likeable_type = 'comment' THEN
            UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.likeable_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_likes_counter AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- 댓글 카운터
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comments_counter AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_count();
