# Tango Community Platform - Agent Memory

## Tech Stack (confirmed)
- Backend: NestJS 10, TypeORM 0.3, PostgreSQL 16 + PostGIS 3.4
- Frontend: Next.js 14 (App Router), React Native (Expo) — monorepo via Turborepo
- Auth: JWT (passport-jwt), token payload is `{ sub: userId }`, validated to `{ userId }` on request object
- ORM: TypeORM with `autoLoadEntities: true` — no manual entity registration in AppModule

## Backend Patterns (backend/src/modules/)
- JWT guard: `JwtAuthGuard extends AuthGuard('jwt')` from `modules/auth/guards/jwt-auth.guard.ts`
- Auth user on request: `req.user.userId` (string) — never `req.user.id`
- Repository injection: `@InjectRepository(Entity) private readonly repo: Repository<Entity>`
- Soft delete: entities use `@DeleteDateColumn({ name: 'deleted_at' })`, filter with `deletedAt IS NULL` in QB or `IsNull()` in findOne
- Hard delete required for likes: DB triggers only fire on physical DELETE, not TypeORM softRemove
- Pagination pattern: `{ items, total, page, limit }` returned from all list endpoints
- Query builder: use `.createQueryBuilder('alias')` for joins and complex filters

## PostGIS Entity Pattern
- Geography columns: use `type: 'geography', spatialFeatureType: 'Point', srid: 4326, select: false`
  (select:false prevents binary blob appearing in default SELECT responses)
- ST_DWithin/ST_Distance parameters: MakePoint(lng, lat) order — longitude FIRST, latitude SECOND
- Raw spatial queries: use `.createQueryBuilder` with `.addSelect(ST_Distance(...), 'alias')`,
  then `.setParameters({...})` to bind lat/lng/radius; `.orderBy('alias', 'ASC')` for distance sort

## Generated Columns (PostgreSQL GENERATED ALWAYS)
- ProductDeal.discountPercentage: `insert: false, update: false, nullable: true` in @Column decorator
  so TypeORM never writes to this column; DB computes it from original_price / deal_price automatically

## Database Schema Notes (001_initial_schema.sql)
- `comments.is_hidden` is in the task spec but NOT in the DDL — entity maps it with `default: false`
- `likes` table: polymorphic via `likeable_type` ('post'|'comment') + `likeable_id` UUID
- `user_event_bookmarks`: composite PK (user_id, event_id) — use `@PrimaryColumn` on both
- DB triggers auto-maintain denormalized counts: `like_count` on posts/comments, `comment_count` on posts
- Soft-delete on comments does NOT fire the `trg_comments_counter` trigger (TypeORM limitation)

## Module Structure
- community.module.ts: CommunityPost + Comment + Like entities; Posts/Comments/Likes services+controllers
- events.module.ts: TangoEvent + Bookmark entities; Events/Bookmarks services+controllers
- affiliates.module.ts: HotelAffiliate + ProductDeal entities; Hotels/Products services; AffiliatesController
- translations.module.ts: PostTranslation + CommunityPost entities; TranslationsService+Controller
- notifications.module.ts: Notification entity; NotificationsService+Controller; exports NotificationsService
- Route collision note: BookmarksController and EventsController both use @Controller('events').
  NestJS merges routes correctly; literal path `GET /events/bookmarks` wins over `:id` param.
  Declare `GET /events/bookmarks` BEFORE `GET /events/:eventId/bookmark/check` within BookmarksController.
- Notifications route ordering: declare GET /notifications/unread-count and PATCH /notifications/read-all
  BEFORE `:id` routes to prevent them being swallowed by the param handler.

## Key File Paths
- Backend entry: backend/src/main.ts
- App module: backend/src/app.module.ts
- DB schema: backend/src/database/migrations/001_initial_schema.sql
- Shared types target: packages/shared/ (not yet implemented)

See `backend-patterns.md` for detailed implementation notes.

## Web App (Next.js 14, App Router)

### Key File Paths
- Entry: web/src/app/layout.tsx — imports Header + Footer + AppProviders
- API client: web/src/lib/api/client.ts — axios, localStorage token, 401 redirect
- Auth store: web/src/store/useAuthStore.ts — zustand/persist, exposes login/register/logout/loadToken
- i18n: web/src/lib/i18n/index.ts — useI18nStore + useTranslation hook, en/ko/es
- Shared types: web/src/types/index.ts

### Web Patterns
- Auth store API: `login(email,password)`, `register({...})`, `logout()`, `loadToken()` — NOT `setAuth`/`clearAuth`
- Token storage: localStorage key `'token'` — axios interceptor reads it on every request
- zustand/persist stores: tango-auth (auth), tango-locale (i18n)
- AppProviders: client component wrapping layout, calls loadToken() + locale detection on mount
- PostCard: accepts optional `onUpdated?: (post: Post) => void` prop
- getPosts API: accepts optional `myPosts?: boolean` query param

### Web Route Map
- / -> Home (events list)
- /events -> Events page with search/filter
- /events/[id] -> Event detail with bookmark + hotels
- /community -> Community feed with compose
- /deals -> Affiliate deals with categories
- /profile -> User profile (auth-gated)
- /profile/bookmarks -> Saved events
- /profile/posts -> My posts
- /profile/notifications -> Notification list
- /auth/login -> Login page
- /auth/register -> Register page

### Web Startup
- `npm run web:dev` (from monorepo root) — runs Next.js on port 3001
- Requires backend on port 3000 (NEXT_PUBLIC_API_URL env var)

## Mobile App (Expo SDK 52 / Expo Router 4)

### Key File Paths
- Root layout: mobile/app/_layout.tsx — Stack navigator, registers all routes
- Tabs layout: mobile/app/(tabs)/_layout.tsx
- API client: mobile/src/api/client.ts — axios with SecureStore token injection
- i18n: mobile/src/i18n/index.ts — i18next, en/ko/es, device language detection

### Mobile Patterns
- API files: `export const fooApi = { method: async (...) => { const r = await apiClient.verb(...); return r.data; } }`
- Stores: Zustand create<State>((set, get) => ...), follow useEventStore.ts pattern
- Screens: StyleSheet.create, no inline styles, loading/error/empty states always handled
- i18n: useTranslation() hook, t('key') for all user-facing strings
- Navigation: useRouter() from expo-router, router.push('/path') for navigation
- Tango color palette in mobile: primary #8B0000 (deep red), accent #DAA520 (gold), bg #f5f5f5, text #1A1A1A

### Route Map (Expo Router file-based)
- /(tabs)/index -> Events list
- /(tabs)/community -> Community posts
- /(tabs)/deals -> Affiliate deals
- /(tabs)/profile -> User profile
- /event/[id] -> Event detail (push)
- /create-post -> New post (modal)
- /bookmarks -> User's bookmarked events (push)
- /my-posts -> User's own posts (push)
- /(auth)/login -> Login (modal)
- /(auth)/register -> Register (modal)

### Mobile Store Architecture
- useCommunityStore: posts[], page, hasMore, fetchPosts/loadMore/createPost/setFilters/updatePostLike/updatePostTranslation
- useDealsStore: deals[], selectedCategory, fetchDeals/loadMore/setCategory
- PostCard: wired to communityApi.toggleLike and communityApi.translatePost; optimistic-free (server round-trip)
- EventCard: accepts optional onPress prop for navigation
