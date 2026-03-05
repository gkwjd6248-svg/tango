# Frontend Dev Agent Memory

## Project: Tango Community Web App

Tech stack: Next.js (App Router) + TypeScript + Tailwind CSS

## i18n System

- Translation files live at `src/lib/i18n/translations/{en,ko,es}.ts`
- The `Translations` type is auto-derived from the `en` object shape in `en.ts`
- `ko.ts` and `es.ts` import `type { Translations }` from `./en` and must have EXACTLY the same keys
- Nested objects (like `errors`, `postType`, `ago`) are allowed one level deep only — the type supports two levels max
- New flat string keys must be added to the same section in all three files simultaneously to avoid type errors
- `useTranslation()` hook is imported from `@/lib/i18n`

## Auth Pages Design Pattern

- All auth pages share the same shell: `min-h-screen flex items-center justify-center bg-warm-50 px-4 py-16`
- Card wrapper: `<div className="card p-8">`
- Logo block at top: diamond glyph (♦) with `text-accent-500` + italic serif "Tango" in `text-primary-700`
- Error alerts: `role="alert"` + `bg-red-50 border border-red-200 text-red-700`
- Success alerts: `role="status" aria-live="polite"` + `bg-green-50 border border-green-200 text-green-800`
- Inputs use the `input-field` utility class
- Primary CTA uses `btn-primary w-full py-3`
- Loading spinner: inline SVG with `animate-spin h-4 w-4`
- "Back to home" footer link: `text-xs text-warm-400 hover:text-warm-600`
- Forgot password link style: `text-sm text-primary-700 hover:text-primary-600 font-medium`
- Auth pages are client components (`'use client'`) using `useState` + `FormEvent`

## Key Files

- Login page: `src/app/auth/login/page.tsx`
- Register page: `src/app/auth/register/page.tsx`
- Forgot password page: `src/app/auth/forgot-password/page.tsx`
- Auth store: `@/store/useAuthStore`
- i18n hook: `@/lib/i18n` (exports `useTranslation`, returns `{ locale, setLocale, t }`)
- Events API: `src/lib/api/events.ts`
- Shared utils: `src/lib/utils.ts` (formatDate, formatDateShort, countryCodeToFlag)
- EventCard component: `src/components/EventCard.tsx`
- Event detail page: `src/app/events/[id]/page.tsx`

## Tailwind Color Tokens Used

- `warm-50`, `warm-400`, `warm-500`, `warm-600`, `warm-800`, `warm-950` — neutral warm grays
- `primary-600`, `primary-700` — brand primary (links, headings)
- `accent-500` — accent color for diamond logo glyph

## Date Formatting Rules

- `formatDate(dateStr, locale?)` and `formatDateShort(dateStr, locale?)` in `src/lib/utils.ts` accept an optional BCP 47 locale string.
- Always pass the `locale` value from `useTranslation()` to these functions — never rely on `undefined` (browser default).
- Direct `Date` method calls (`toLocaleDateString`, `toLocaleTimeString`) must also receive `locale`, not `undefined` or `[]`.
- Locale codes in the app (`'en'`, `'ko'`, `'es'`) are valid BCP 47 tags accepted by Intl APIs.

## Events API Param Mapping

- `EventFilters` interface uses frontend-friendly names: `countryCode`, `eventType`.
- `eventsApi.getEvents()` maps them to backend query param names before the HTTP call:
  - `countryCode` -> `country`
  - `eventType` -> `type`
- Never pass the `EventFilters` object directly as Axios params; always go through the mapping object inside `getEvents`.
