'use client';

import { useI18nStore, Locale } from '@/lib/i18n';
import { HiOutlineGlobe } from 'react-icons/hi';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  ko: '한',
  es: 'ES',
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18nStore();

  const locales: Locale[] = ['en', 'ko', 'es'];
  const nextLocale = locales[(locales.indexOf(locale) + 1) % locales.length];

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-red-100 hover:text-white hover:bg-white/10 text-xs font-medium transition-all"
      title={`Switch to ${nextLocale.toUpperCase()}`}
      aria-label="Switch language"
    >
      <HiOutlineGlobe className="w-4 h-4" />
      {LOCALE_LABELS[locale]}
    </button>
  );
}
