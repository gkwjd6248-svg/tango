'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en, Translations } from './translations/en';
import { ko } from './translations/ko';
import { es } from './translations/es';

export type Locale = 'en' | 'ko' | 'es';

const localeMap: Record<Locale, Translations> = { en, ko, es };

interface I18nState {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const detectedLocale = typeof navigator !== 'undefined'
  ? (navigator.language.toLowerCase().startsWith('ko') ? 'ko' as Locale
    : navigator.language.toLowerCase().startsWith('es') ? 'es' as Locale
    : 'en' as Locale)
  : 'en' as Locale;

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: detectedLocale,
      t: localeMap[detectedLocale],
      setLocale: (locale: Locale) => {
        set({ locale, t: localeMap[locale] });
      },
    }),
    {
      name: 'tango-locale-v2',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = localeMap[state.locale];
        }
      },
    },
  ),
);

/**
 * Lightweight hook — returns translation object for the active locale.
 * Use as: const { t } = useTranslation();
 */
export function useTranslation() {
  const { t, locale, setLocale } = useI18nStore();
  return { t, locale, setLocale };
}

/** Replace template variables like {{n}} in translation strings */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

/** Detect browser locale and map to a supported Locale */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('es')) return 'es';
  return 'en';
}
