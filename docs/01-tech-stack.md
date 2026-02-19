# 글로벌 탱고 커뮤니티 앱 - 기술 스택 추천서

## 1. 아키텍처 개요 (Architecture Overview)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          React Native (Expo SDK 52) + TypeScript          │   │
│  │   Zustand │ Expo Router │ Tamagui │ react-native-maps    │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────┼───────────────────────────────────────┐
│                     API GATEWAY (NestJS)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth    │  │  Events  │  │Community │  │  Affiliates  │   │
│  │  Module   │  │  Module  │  │  Module  │  │   Module     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │             │                │            │
│  ┌────┴──────────────┴─────────────┴────────────────┴──────┐   │
│  │              TypeORM + PostgreSQL Driver                  │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                     DATA LAYER                                   │
│  ┌────────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  │
│  │ PostgreSQL │  │  Redis   │  │Meilisearch│  │  AWS S3 /   │  │
│  │ + PostGIS  │  │  Cache   │  │  Search   │  │ Cloudflare  │  │
│  └────────────┘  └──────────┘  └───────────┘  │    R2       │  │
│                                                └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                  CRAWLER SERVICE                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │Playwright │  │ Cheerio  │  │Claude API│  │  BullMQ      │   │
│  │(동적 페이지)│  │(정적 HTML)│  │(AI 추출) │  │ (스케줄러)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│              EXTERNAL SERVICES                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │Booking.com│  │  Amazon  │  │  Coupang │  │  DeepL /     │   │
│  │  Agoda   │  │AliExpress│  │ Partners │  │Google Trans  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 프론트엔드 (모바일 크로스플랫폼)

### 핵심 선택: **React Native + Expo SDK 52**

| 항목 | 선택 | 버전 |
|------|------|------|
| 프레임워크 | React Native + Expo | SDK 52, RN 0.76 |
| 언어 | TypeScript | 5.3+ |
| 라우팅 | Expo Router | v4 (파일 기반) |
| 상태관리 | Zustand | 4.5+ |
| UI 프레임워크 | Tamagui 또는 NativeWind | 최신 |
| 지도 | react-native-maps | 1.18+ |
| 영상 재생 | expo-av | 15.0+ |
| 다국어 | i18next + expo-localization | 23.x / 16.x |
| 보안 저장소 | expo-secure-store | 14.0+ |
| 애니메이션 | react-native-reanimated | 3.16+ |

### Flutter 대비 React Native 선택 이유

1. **JS/TS 생태계 시너지**: 백엔드(NestJS)와 크롤러 모두 TypeScript → 코드/타입 공유 가능
2. **npm 라이브러리 풀**: 소셜 앱에 필요한 라이브러리(지도, 영상, 번역 등)가 React Native에서 더 풍부
3. **Expo 생태계**: EAS Build로 CI/CD 간소화, OTA 업데이트로 빠른 배포
4. **개발자 채용**: React Native 개발자 풀이 Flutter보다 3배 이상 넓음 (글로벌 기준)
5. **웹 확장성**: React Native for Web으로 향후 웹 버전 확장 용이

---

## 3. 백엔드

### 핵심 선택: **Node.js + NestJS (TypeScript)**

| 항목 | 선택 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | NestJS | 10.3+ | 모듈러 백엔드 아키텍처 |
| ORM | TypeORM | 0.3.19+ | PostgreSQL 연동 |
| 인증 | Passport.js + JWT | 0.7 / 10.2 | OAuth2 + 토큰 인증 |
| 유효성 검사 | class-validator | 0.14+ | DTO 검증 |
| 큐 | BullMQ | 5.x | 크롤링 작업, 알림 스케줄링 |
| 캐시 | ioredis | 5.3+ | Redis 클라이언트 |
| 실시간 | Socket.IO | 4.x | 커뮤니티 실시간 업데이트 |
| 파일 업로드 | @aws-sdk/client-s3 | 3.x | S3/R2 파일 업로드 |

### NestJS 선택 이유

1. **모듈러 아키텍처**: Auth, Users, Events, Community, Affiliates 각각 독립 모듈로 관리
2. **DI (의존성 주입)**: 테스트 용이성, 결합도 낮춤
3. **데코레이터 기반**: 직관적인 라우팅, 가드, 파이프 선언
4. **TypeScript 네이티브**: 프론트엔드와 타입 공유 가능
5. **GraphQL 하이브리드**: 커뮤니티 피드는 GraphQL, 제휴 API는 REST로 최적 선택

### API 구조

```
POST   /api/v1/auth/register      # 회원가입
POST   /api/v1/auth/login         # 로그인
GET    /api/v1/users/me            # 내 프로필
PUT    /api/v1/users/me            # 프로필 수정
GET    /api/v1/events              # 행사 목록 (필터: 위치, 국가, 타입)
GET    /api/v1/events/:id          # 행사 상세
GET    /api/v1/posts               # 커뮤니티 피드
POST   /api/v1/posts               # 게시글 작성
GET    /api/v1/affiliates/hotels   # 호텔 검색
GET    /api/v1/affiliates/products # 상품 특가
```

---

## 4. 데이터베이스

| 역할 | 기술 | 선택 이유 |
|------|------|----------|
| 주 DB | PostgreSQL 16 + PostGIS 3.4 | 지리공간 쿼리 (반경 내 행사/호텔 검색), JSONB, 안정성 |
| 캐시 | Redis 7 | 세션, Rate Limiting, 피드 캐싱, BullMQ 백엔드 |
| 검색 | Meilisearch 1.6+ | 다국어 Full-text 검색 (이벤트/게시글), Elasticsearch보다 경량 |
| 파일 | AWS S3 또는 Cloudflare R2 | 유저 업로드 이미지/영상, CDN 연동 |

### PostgreSQL + PostGIS 선택 이유

- `ST_DWithin()` 함수로 "내 위치 반경 10km 내 밀롱가" 같은 쿼리 즉시 실행
- GIST 인덱스로 지리 쿼리 O(log n) 성능
- JSONB로 `image_urls`, `amenities` 같은 유연한 데이터 저장
- Generated Column으로 `discount_percentage` 자동 계산

---

## 5. AI / 크롤링

| 항목 | 기술 | 용도 |
|------|------|------|
| AI 추출 | Claude API (Anthropic) | HTML → 구조화된 JSON 변환 |
| 동적 크롤링 | Playwright | JavaScript 렌더링이 필요한 SPA 사이트 |
| 정적 파싱 | Cheerio | 정적 HTML 빠른 파싱 |
| 스케줄링 | BullMQ | 크롤링 작업 큐 관리 |
| 검증 | Zod | 추출된 데이터 스키마 검증 |

### Claude API 선택 이유

1. **비정형 HTML 이해력**: 다양한 형식의 탱고 행사 웹사이트를 일관된 JSON으로 변환
2. **다국어 처리**: 스페인어, 일본어, 한국어, 영어 등 다양한 언어의 행사 정보 추출
3. **컨텍스트 이해**: 밀롱가, 프랙티카, 발스 등 탱고 전문 용어 이해
4. **비용 효율**: Haiku 모델로 대량 크롤링 시 비용 최적화 가능

---

## 6. 제휴 API 연동

| 제휴사 | API | 수수료 모델 |
|--------|-----|-----------|
| Booking.com | Affiliate Partner API | 예약 완료 시 커미션 (15-40%) |
| Agoda | Affiliate API | 예약 완료 시 커미션 (5-12%) |
| Amazon | Product Advertising API 5.0 | 구매 시 커미션 (1-10%) |
| Coupang | Coupang Partners API | 구매 시 커미션 (3-7%) |
| AliExpress | Affiliate API (Admitad 경유) | 구매 시 커미션 (3-9%) |

---

## 7. 번역

| 항목 | 기술 | 용도 |
|------|------|------|
| 1순위 | DeepL API | 고품질 번역 (유럽어 강점) |
| 2순위 | Google Cloud Translation | DeepL 미지원 언어 폴백 |
| 캐싱 | `post_translations` 테이블 | 동일 번역 API 재호출 방지 |

### 번역 전략
1. 유저가 "번역" 버튼 클릭 시 → DB 캐시 확인
2. 캐시 없으면 → DeepL API 호출 → 결과 캐시 저장
3. DeepL 미지원 언어 → Google Translation 폴백
4. 시스템 UI → i18next로 클라이언트 사이드 번역 (13개 언어)

---

## 8. 인프라 / DevOps

| 항목 | 기술 | 선택 이유 |
|------|------|----------|
| 클라우드 | AWS | 글로벌 리전, 풍부한 서비스 |
| 컨테이너 | Docker + ECS Fargate | 서버리스 컨테이너, 오토스케일링 |
| CI/CD | GitHub Actions | PR 기반 자동 빌드/배포 |
| CDN | CloudFront | 정적 파일, 이미지 글로벌 배포 |
| 모니터링 | Grafana + Prometheus | 메트릭 수집, 대시보드, 알림 |
| 로깅 | Pino → CloudWatch Logs | 구조화된 JSON 로깅 |
| 앱 배포 | EAS Build (Expo) | iOS/Android 빌드 + OTA 업데이트 |
| DB 관리 | RDS PostgreSQL | 자동 백업, Multi-AZ, PostGIS 지원 |
| 캐시 관리 | ElastiCache Redis | 관리형 Redis, 자동 장애 복구 |

### Docker Compose (로컬 개발)

```yaml
services:
  postgres:  # PostGIS 포함, 포트 5432
  redis:     # 세션/큐, 포트 6379
  elasticsearch:  # 검색, 포트 9200
```

---

## 9. 프로젝트 구조 (모노레포)

```
tango/
├── package.json              # npm workspaces root
├── docker-compose.yml        # 로컬 개발 인프라
├── .env.example              # 환경변수 템플릿
├── .gitignore
│
├── docs/                     # 설계 문서
│   ├── 01-tech-stack.md
│   ├── 02-database-schema.md
│   └── 03-ai-crawling-pipeline.md
│
├── backend/                  # NestJS 백엔드
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   ├── database/migrations/
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── events/
│   │       ├── community/
│   │       └── affiliates/
│   └── package.json
│
├── mobile/                   # Expo React Native 앱
│   ├── app/                  # Expo Router (파일 기반 라우팅)
│   │   ├── (tabs)/           # 탭 네비게이션
│   │   └── (auth)/           # 인증 화면
│   ├── src/
│   │   ├── api/              # API 클라이언트
│   │   ├── store/            # Zustand 스토어
│   │   ├── components/       # 공통 컴포넌트
│   │   └── i18n/             # 다국어 설정
│   └── package.json
│
└── crawler/                  # AI 크롤링 서비스
    ├── src/
    │   ├── index.ts          # 메인 엔트리
    │   ├── scraper.ts        # 웹 스크래핑
    │   ├── ai-extractor.ts   # Claude API 연동
    │   ├── storage.ts        # DB 저장
    │   ├── types.ts          # 타입 정의
    │   └── config.ts         # 설정
    └── package.json
```

---

## 10. 기술 스택 요약표

| 레이어 | 기술 | 언어 |
|--------|------|------|
| 모바일 앱 | React Native + Expo SDK 52 | TypeScript |
| 백엔드 API | NestJS 10 + TypeORM | TypeScript |
| 주 데이터베이스 | PostgreSQL 16 + PostGIS 3.4 | SQL |
| 캐시/큐 | Redis 7 + BullMQ | - |
| 검색 엔진 | Meilisearch 1.6 | - |
| AI 크롤링 | Playwright + Cheerio + Claude API | TypeScript |
| 번역 | DeepL API + Google Translation | - |
| 파일 저장 | AWS S3 / Cloudflare R2 | - |
| 인프라 | AWS ECS Fargate + RDS + ElastiCache | - |
| CI/CD | GitHub Actions + EAS Build | YAML |
| 컨테이너 | Docker + Docker Compose | Dockerfile |
| 모니터링 | Grafana + Prometheus | - |
