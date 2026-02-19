# AI 크롤링 파이프라인 설계서

## 1. 전체 파이프라인 개요

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  크롤링 소스  │───→│   BullMQ     │───→│  웹 스크래핑  │───→│ HTML 전처리  │
│  목록 (DB)   │    │  스케줄러    │    │ Playwright/  │    │ (정제/청소)  │
│              │    │              │    │  Cheerio     │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                    │
┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  알림 발송   │←───│  DB 저장     │←───│  데이터 검증  │←───┌──────┴───────┐
│ (신규 행사)  │    │ (Upsert)    │    │  Zod Schema  │    │ Claude API  │
│              │    │              │    │  + Geocoding │    │  구조화 추출 │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## 2. 크롤링 대상 분석

### 2.1 탱고 행사 웹사이트의 특성

전 세계 탱고 행사 정보는 극도로 파편화되어 있습니다:

| 유형 | 예시 | 특성 |
|------|------|------|
| 전문 캘린더 사이트 | tangocalendar.com, hoy-milonga.com | 정형화된 이벤트 목록, 비교적 파싱 쉬움 |
| 개인 블로그/WordPress | 각국 탱고 교사 블로그 | 비정형 텍스트, 이미지 안에 일정 정보 |
| Facebook 이벤트 | 밀롱가 주최자 페이지 | API 제한적, 로그인 필요할 수 있음 |
| 문화 센터 웹사이트 | 아르헨티나/유럽 문화 센터 | 다국어, 불규칙한 업데이트 |
| 탱고 스쿨 사이트 | 각국 탱고 학원 | 수업 일정, 워크숍 정보 혼재 |

### 2.2 핵심 도전 과제

1. **표준 포맷 없음**: 각 사이트마다 날짜, 시간, 가격 표기 방식이 다름
2. **다국어**: 스페인어, 영어, 한국어, 일본어, 독일어, 터키어 등
3. **날짜 형식 불일치**: "Sábado 15 de Marzo", "3/15/2025", "15.03.2025" 등
4. **동적 렌더링**: React/Vue SPA 사이트는 JS 실행 필요

### 2.3 해결 전략: Claude API를 범용 파서로 활용

Claude API의 강력한 자연어 이해 능력을 활용하여:
- 어떤 형식의 HTML이든 → 규격화된 JSON으로 변환
- 다국어 콘텐츠 → 영어 메타데이터 + 원본 보존
- 탱고 전문 용어(밀롱가, 프랙티카, 발스 등) 자동 분류

---

## 3. 단계별 작동 로직

### Step 1: 소스 관리 및 스케줄링

```
crawl_sources 테이블 → BullMQ 작업 큐 → 주기적 실행
```

- `crawl_sources` 테이블에서 활성 소스 목록 로드
- 각 소스의 `crawl_frequency`에 따라 BullMQ 반복 작업 등록
- 소스별 설정: 크롤링 깊이, CSS 셀렉터 힌트, 사용할 스크래퍼 유형

```typescript
// parser_config 예시 (JSONB)
{
  "scraper": "playwright",     // "playwright" | "cheerio"
  "selectors": {
    "eventList": ".event-card",
    "title": "h2.event-title",
    "date": ".event-date"
  },
  "pagination": {
    "type": "url_param",        // "url_param" | "infinite_scroll" | "next_button"
    "param": "page",
    "maxPages": 5
  },
  "language": "es"
}
```

### Step 2: 웹 스크래핑

두 가지 엔진을 소스 특성에 따라 선택:

| 엔진 | 사용 시점 | 장점 | 단점 |
|------|----------|------|------|
| **Playwright** | SPA, JS 렌더링 필요 | 완전한 브라우저 렌더링 | 느림, 리소스 많이 사용 |
| **Cheerio** | 정적 HTML | 빠름, 가벼움 | JS 미실행 |

핵심 원칙:
- `robots.txt` 준수
- 요청 간 1-3초 딜레이 (Polite Crawling)
- User-Agent 적절히 설정
- 실패 시 지수 백오프 재시도 (최대 3회)

### Step 3: HTML 전처리

Claude API에 보내기 전 HTML을 정제:

1. `<script>`, `<style>`, `<nav>`, `<footer>`, `<iframe>` 태그 제거
2. 광고 영역 제거 (일반적인 광고 class/id 패턴)
3. 메인 콘텐츠 영역만 추출
4. HTML을 간소화된 텍스트로 변환
5. 토큰 수가 Claude 컨텍스트 윈도우의 80%를 초과하면 청크 분할

### Step 4: Claude API 구조화 추출

Claude에게 정제된 HTML을 보내고 규격화된 JSON을 받습니다.

**시스템 프롬프트:**

```
You are a specialized data extraction AI for Argentine Tango events worldwide.

Your task is to extract structured event information from raw HTML/text content
of tango event websites.

TANGO-SPECIFIC TERMINOLOGY:
- Milonga: A social dance event where people dance Argentine Tango
- Practica: A practice session, more informal than a milonga
- Festival: Multi-day tango event with workshops, milongas, and shows
- Workshop/Taller: A teaching session, usually 1-3 hours
- Class/Clase: Regular recurring tango lessons
- Vals: Waltz style within tango
- Encuentro: A tango meeting/gathering, often by invitation

EXTRACTION RULES:
1. Extract ALL events found on the page
2. Dates must be ISO 8601 format with timezone if available
3. Classify event_type as: milonga, festival, workshop, class, or practica
4. If price is mentioned, extract amount and currency
5. Extract venue address as completely as possible
6. If GPS coordinates are available, include them
7. Preserve the original language in description, translate title to English

Return a JSON array of events matching this exact schema:
[{
  "title": "string (English)",
  "title_original": "string (original language)",
  "description": "string (original language)",
  "event_type": "milonga|festival|workshop|class|practica",
  "venue_name": "string",
  "address": "string",
  "city": "string",
  "country_code": "XX (ISO 3166-1 alpha-2)",
  "latitude": number|null,
  "longitude": number|null,
  "start_datetime": "ISO 8601",
  "end_datetime": "ISO 8601|null",
  "recurrence_rule": "RRULE string|null",
  "organizer_name": "string|null",
  "price_info": "string|null",
  "currency": "XXX|null",
  "image_urls": ["string"],
  "confidence": 0.0-1.0
}]

If no events are found, return an empty array [].
If unsure about a field, set it to null and lower the confidence score.
```

### Step 5: 데이터 검증 및 정규화

Claude의 출력을 Zod 스키마로 엄격히 검증:

```typescript
const EventSchema = z.object({
  title: z.string().min(1),
  event_type: z.enum(['milonga', 'festival', 'workshop', 'class', 'practica']),
  city: z.string().min(1),
  country_code: z.string().length(2),
  start_datetime: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  // ... 기타 필드
});
```

추가 정규화:
1. **Geocoding**: 주소만 있고 좌표 없으면 → Google Geocoding API로 변환
2. **중복 체크**: 제목 + 날짜 + 장소로 퍼지 매칭 → 기존 이벤트와 중복 확인
3. **신뢰도 필터**: `confidence < 0.5`인 데이터는 관리자 검수 큐로

### Step 6: 데이터 저장

```typescript
// Upsert 로직
// source_url 기준으로 기존 데이터 확인
// 있으면 UPDATE (변경된 필드만)
// 없으면 INSERT
// crawl_logs에 통계 기록
```

### Step 7: 모니터링 및 품질 관리

- 소스별 성공률 대시보드
- 연속 3회 실패 시 알림
- 주 1회 랜덤 샘플링 → 수동 검증
- 데이터 품질 메트릭: 필드 완성도, 신뢰도 분포

---

## 4. 에러 처리 전략

| 에러 유형 | 처리 방식 |
|----------|----------|
| 네트워크 타임아웃 | 3회 재시도 (지수 백오프: 5s → 15s → 45s) |
| 사이트 구조 변경 | 크롤링 실패 로그 → 관리자 알림 → parser_config 수정 |
| Claude API 에러 | 재시도 3회, 실패 시 Dead Letter Queue 저장 |
| 데이터 검증 실패 | 원본 HTML 저장, 관리자 검수 큐로 이동 |
| Rate Limiting | 자동 딜레이 증가, 큐 우선순위 조정 |

---

## 5. 비용 최적화

| 전략 | 설명 |
|------|------|
| Claude Haiku 사용 | 단순 추출 작업은 Haiku 모델로 비용 90% 절감 |
| 변경 감지 | 이전 크롤링과 HTML diff → 변경 없으면 Claude 호출 스킵 |
| 배치 처리 | 여러 소스 결과를 묶어서 처리 |
| 캐싱 | 동일 URL의 반복 크롤링 결과 캐시 |

---

## 6. 확장 전략

1. **관리자 UI로 소스 추가**: 웹 대시보드에서 URL 입력 → 자동 파서 설정
2. **커뮤니티 제보**: 유저가 행사 URL 제출 → 크롤러가 자동 처리
3. **Facebook Events API**: 가능한 범위에서 Facebook 행사 연동
4. **Google Calendar 연동**: 탱고 관련 공개 캘린더 구독
