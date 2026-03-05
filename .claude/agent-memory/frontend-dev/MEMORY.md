# Tango Community — Frontend Dev Agent Memory

## Project Stack
- **Web**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeORM + PostgreSQL
- **State**: Zustand (with persist middleware)
- **i18n**: Custom Zustand store at `web/src/lib/i18n/index.ts`, hook: `useTranslation()`
- **API client**: Axios instance at `web/src/lib/api/client.ts` — auto-attaches Bearer token from localStorage

## Key File Paths
- Auth guard (backend): `backend/src/modules/auth/guards/jwt-auth.guard.ts`
- Auth guard (frontend): `web/src/components/AuthGuard.tsx`
- i18n translations: `web/src/lib/i18n/translations/{en,ko,es}.ts`
- API modules: `web/src/lib/api/{events,client}.ts`
- Events entity: `backend/src/modules/events/entities/event.entity.ts`
- Globe component: `web/src/components/TangoGlobe.tsx` (client-only, dynamic import ssr:false)
- Landing page: `web/src/app/page.tsx`

## i18n Pattern
- Source of truth is `en.ts` — the `Translations` type is derived from it via `typeof en`
- `Translations` type only resolves two levels deep (flat string values or one-level nested object)
- `ko.ts` and `es.ts` import `Translations` and must mirror every key in `en.ts`
- Nested objects (e.g. `postType`, `ago` inside `community`) resolve to `{ [Q]: string }` — keep them at exactly two levels
- When adding new i18n keys, update all three locale files simultaneously

## Component Patterns
- Pages that require auth: wrap inner form component with `<AuthGuard>` in the default export
- Separate the "inner form" component from the page export for clarity (see `community/create/page.tsx`)
- Section headers inside forms use: `text-xs font-bold text-primary-700 uppercase tracking-wider`
- Field labels use: `text-xs font-bold text-primary-700 uppercase tracking-wider mb-1.5`
- Standard input class: `rounded-lg border border-warm-200 px-4 py-2.5 text-sm text-warm-900 focus:ring-primary-700/20 focus:border-primary-700`
- Error alerts: `role="alert"`, class `bg-red-50 border border-red-200 text-red-700`
- Spinner SVG: animate-spin with circle+path pattern (see community/create for copy-paste template)

## Backend Patterns
- DTOs live in `backend/src/modules/<module>/dto/` and use `class-validator` decorators
- `@IsDateString()` for ISO datetime strings; `@Type(() => Number)` from `class-transformer` needed for numeric fields coming as strings
- Service `create()` receives string datetimes and converts to `new Date()` before saving
- The `_userId` convention (underscore prefix) signals intentionally unused parameter — avoids TS `noUnusedParameters` errors
- `JwtAuthGuard` is at `../auth/guards/jwt-auth.guard.ts` relative to any module

## API Client Notes
- `apiClient.post<T>('/path', data)` returns `AxiosResponse<T>` — always unwrap with `.data`
- 401 responses trigger auto-redirect to `/auth/login` (except on auth pages)
- Deals API (`web/src/lib/api/deals.ts`): `getDeals` accepts `category`, `country`, `page`, `limit` — omit `country` entirely for 'all'; send 'US' or 'KR' for country-specific; send 'GLOBAL' for AliExpress (backend treats as NULL target_country)
- Backend may return affiliate providers in lowercase ('temu', 'amazon') — always normalize via `PROVIDER_DISPLAY_NAMES` map before using as display label or color lookup key

## Globe / Landing Page Patterns
- `react-globe.gl` + `three` + `@types/three` installed at monorepo root (`tango/node_modules/`)
- Globe component MUST be loaded via `dynamic(() => import(...), { ssr: false })` — WebGL unavailable on server
- GeoJSON countries dataset: `https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson`
- Country ISO code field in GeoJSON: `feature.properties.ISO_A2` (uppercase); `-99` means no valid code
- Globe uses polygon layer (`polygonsData`) — NOT hexPolygons — for country shapes
- Auto-rotation via `controls().autoRotate = true; controls().autoRotateSpeed = 0.25` after `onGlobeReady`
- Globe canvas takes explicit pixel `width`/`height` props — use a ResizeObserver on the parent div to pass correct dimensions
- Highlighted countries use `accent-500` gold (#D4A017) with alpha scaling by event count
- Background: `#0d0d0d`; inactive countries: `rgba(63,51,24,0.6)`; stroke: `rgba(212,160,23,0.15)`

## Deals Page Patterns
- Country filter tabs use `rounded-xl border` style (more prominent than category chips)
- Category chips use `rounded-full` pill style (lighter visual weight)
- Country filter options: 'all' (no param), 'US', 'KR', 'GLOBAL'
- `next.config.js` uses `hostname: '**'` wildcard — all HTTPS image domains already allowed (no per-domain config needed)

## Styling Tokens
- Primary: `primary-700` (dark tango red/maroon)
- Accent: `accent-500` (gold/amber CTA buttons) with `text-warm-950` text
- Warm neutrals: `warm-100` through `warm-950`
- Page container: `page-container` utility class
- Button classes: `btn-primary`, `btn-secondary`

## Dark Mode (darkMode: 'class' — toggle via adding `dark` to `<html>`)
- Global classes already dark-mode-ready: `.card`, `.input-field`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` — do NOT add dark: bg/border to elements using these
- Page background: `bg-warm-50 dark:bg-[#1A1410]`
- Sticky headers/action bars: `bg-white dark:bg-warm-900 border-b border-warm-100 dark:border-warm-800`
- Surface cards (inline, not `.card` class): `bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800`
- Subtle surface (organizer block, muted bg): `bg-warm-50 dark:bg-warm-800 border border-warm-100 dark:border-warm-700`
- Primary text: `text-warm-950 dark:text-warm-100` / `text-warm-900 dark:text-warm-100`
- Secondary text: `text-warm-800 dark:text-warm-200` / `text-warm-700 dark:text-warm-300`
- Muted text: `text-warm-600 dark:text-warm-400` / `text-warm-500 dark:text-warm-400` / `text-warm-400 dark:text-warm-500`
- Dividers: `divide-warm-100 dark:divide-warm-800`
- Skeleton pulse bars: `bg-gray-100 dark:bg-warm-800` / `bg-gray-200 dark:bg-warm-800`
- Filter pills (inactive): add `dark:bg-warm-800 dark:text-warm-300 dark:border-warm-700`
- Category chips (inactive `bg-warm-100`): add `dark:bg-warm-800 dark:text-warm-300`
- Error alerts: add `dark:bg-red-900/30 dark:border-red-800 dark:text-red-300`
- Warning banners (amber): add `dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300`
- Info banners (primary-50): add `dark:bg-primary-900/30 dark:border-primary-800`
- Green success badges: add `dark:bg-green-900/30 dark:text-green-400`
- Blue info badges: add `dark:bg-blue-900/30 dark:text-blue-400`
- Link/accent text `text-primary-700`: add `dark:text-primary-400`
- Hover bg `hover:bg-warm-50`: add `dark:hover:bg-warm-800`
- Hover bg `hover:bg-red-50`: add `dark:hover:bg-red-900/30`
- Modal overlays `bg-black/50` — fine as-is; modal content needs `dark:bg-warm-900`
- Form selects/textareas inside modals: add `dark:bg-warm-800 dark:border-warm-700 dark:text-warm-100`
- Map placeholder gradient `from-green-50 to-green-100`: add `dark:from-green-900/30 dark:to-green-900/20`
- Home page uses hardcoded dark gradient via inline `style` — no bg dark: variant needed

See `patterns.md` for detailed notes.
