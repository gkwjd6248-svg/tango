# 글로벌 탱고 커뮤니티 앱 - 데이터베이스 스키마 설계서

## 1. 개요

본 문서는 글로벌 탱고 커뮤니티 앱의 핵심 데이터베이스 스키마를 정의합니다.
PostgreSQL + PostGIS 확장을 기반으로 설계되었으며, 수십만 글로벌 유저의 동시 접속과 지리 기반 쿼리를 최적화합니다.

## 2. 기술 선택 근거

| 기술 | 선택 이유 |
|------|----------|
| **PostgreSQL 16** | JSONB, Full-text search, PostGIS 지원, 높은 안정성 |
| **PostGIS 3.4** | 행사 장소 근처 호텔 검색 등 지리공간 쿼리 필수 |
| **UUID v4** | 분산 환경에서 충돌 없는 고유 ID 생성 |
| **JSONB** | 이미지 URL 배열, 편의시설 등 유연한 스키마 |
| **Soft Delete** | `deleted_at` 컬럼으로 데이터 복구 가능성 유지 |

## 3. ER 관계도 (텍스트)

```
users ─────┬──< community_posts ──< comments
           │         │                  │
           │         ├──< post_translations
           │         │
           │         ├──< likes (polymorphic)
           │         │
           │   reports (polymorphic)
           │
           ├──< user_event_bookmarks >── events
           │                              │
           │                              ├──< hotel_affiliates
           │                              │
           │                              └── crawl_sources ──< crawl_logs
           │
           ├──< affiliate_clicks
           │
           └──< notifications

product_deals (독립 테이블, affiliate_clicks와 연결)
```

## 4. 테이블 상세 설계

### 4.1 `users` (유저)
- **역할**: 앱 사용자 정보 관리
- **핵심 설계**: `country_code`(ISO 3166-1)로 국기 표시, `preferred_language`로 자동 번역 타겟 언어 결정
- **인증**: 로컬 이메일/비밀번호 + OAuth(Google, Apple, Kakao) 지원
- **위치**: 사용자 홈 위치 저장으로 근처 행사 추천

### 4.2 `events` (밀롱가/행사/수업)
- **역할**: 전 세계 탱고 행사 정보 관리
- **핵심 설계**: PostGIS `GEOGRAPHY(POINT, 4326)`으로 위치 저장, `ST_DWithin`으로 반경 검색
- **반복 일정**: `recurrence_rule` (RFC 5545 RRULE) 형식으로 정기 밀롱가 지원
- **크롤링 연동**: `crawl_source_id`로 어느 소스에서 수집된 데이터인지 추적

### 4.3 `crawl_sources` / `crawl_logs` (크롤링 관리)
- **역할**: 크롤링 대상 웹사이트 관리 및 실행 이력 추적
- **핵심 설계**: `parser_config` (JSONB)로 사이트별 파싱 설정 저장, 크롤링 성공/실패 통계 기록

### 4.4 `hotel_affiliates` (호텔 제휴)
- **역할**: 행사 근처 호텔 정보 + 제휴 링크
- **핵심 설계**: `distance_from_event_meters`로 행사장까지 거리 사전 계산, PostGIS 위치 데이터 포함

### 4.5 `product_deals` (탱고 상품 특가)
- **역할**: 쿠팡/아마존/알리익스프레스 탱고 상품 특가 관리
- **핵심 설계**: `expires_at`으로 만료된 특가 자동 비활성화, 카테고리별 필터링

### 4.6 `affiliate_clicks` (수수료 추적)
- **역할**: 호텔/상품 클릭 및 전환 추적으로 수수료 정산
- **핵심 설계**: polymorphic 패턴으로 호텔/상품 모두 하나의 테이블에서 추적

### 4.7 `community_posts` / `comments` (커뮤니티)
- **역할**: 유저 게시글, 댓글, 영상 공유
- **핵심 설계**: `country_scope`로 국가별 피드 분리 (NULL = 글로벌), denormalized 카운터로 성능 최적화

### 4.8 `post_translations` (번역 캐시)
- **역할**: 번역 결과 캐싱으로 API 비용 절감
- **핵심 설계**: `(post_id, target_language)` 유니크 제약으로 중복 번역 방지

### 4.9 `likes` (좋아요)
- **역할**: 게시글/댓글 좋아요
- **핵심 설계**: polymorphic 패턴 + 유니크 제약으로 중복 좋아요 방지

### 4.10 `reports` (신고)
- **역할**: 부적절한 콘텐츠 신고 관리
- **핵심 설계**: polymorphic 패턴으로 게시글/댓글/유저 모두 신고 가능

### 4.11 `notifications` (알림)
- **역할**: 푸시 알림 및 인앱 알림 관리
- **핵심 설계**: `data` (JSONB)로 알림 유형별 추가 데이터 저장

### 4.12 `user_event_bookmarks` (행사 북마크)
- **역할**: 유저가 관심 있는 행사 저장
- **핵심 설계**: 복합 PK로 중복 북마크 방지

## 5. 인덱싱 전략

| 인덱스 | 대상 테이블 | 유형 | 용도 |
|--------|-----------|------|------|
| `idx_events_location` | events | GIST (geography) | 반경 내 행사 검색 |
| `idx_events_start_datetime` | events | B-tree | 날짜순 정렬 |
| `idx_events_country_code` | events | B-tree | 국가별 필터 |
| `idx_events_status` | events | B-tree | 활성 행사 필터 |
| `idx_hotels_location` | hotel_affiliates | GIST (geography) | 호텔 위치 검색 |
| `idx_posts_user_id` | community_posts | B-tree | 유저별 게시글 조회 |
| `idx_posts_country_scope` | community_posts | B-tree | 국가별 피드 |
| `idx_posts_created_at` | community_posts | B-tree DESC | 최신순 정렬 |
| `idx_comments_post_id` | comments | B-tree | 게시글별 댓글 |
| `idx_likes_unique` | likes | UNIQUE | 중복 좋아요 방지 |
| `idx_users_email` | users | UNIQUE | 이메일 로그인 |
| `idx_clicks_user_id` | affiliate_clicks | B-tree | 유저별 클릭 이력 |

## 6. 데이터 무결성

- **Foreign Key + CASCADE**: 유저 삭제 시 관련 게시글, 댓글, 좋아요 연쇄 처리
- **CHECK 제약조건**: ENUM 대체로 유효한 값만 저장
- **NOT NULL**: 필수 필드에 NULL 방지
- **DEFAULT 값**: `created_at`, `is_verified` 등 기본값 설정

## 7. 마이그레이션 파일

SQL 마이그레이션 파일: `backend/src/database/migrations/001_initial_schema.sql`
