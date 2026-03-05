'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { detectLocale, useI18nStore } from '@/lib/i18n';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const loadToken = useAuthStore((s) => s.loadToken);
  const initTheme = useThemeStore((s) => s.initTheme);
  const setLocale = useI18nStore((s) => s.setLocale);
  const locale = useI18nStore((s) => s.locale);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initialize theme (dark/light/system)
    initTheme();

    // Kick off token validation / user profile fetch
    loadToken();

    // Detect browser locale only if the user has not persisted a preference
    const saved = localStorage.getItem('tango-locale');
    if (!saved) {
      const detected = detectLocale();
      if (detected !== locale) {
        setLocale(detected);
      }
    }
  }, [loadToken, setLocale, locale]);

  return <>{children}</>;
}
