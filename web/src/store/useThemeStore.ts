'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const current = get().theme;
        const isDark =
          current === 'dark' ||
          (current === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        const next: Theme = isDark ? 'light' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },

      initTheme: () => {
        const { theme } = get();
        applyTheme(theme);

        // Listen for system preference changes when in 'system' mode
        if (typeof window !== 'undefined') {
          const mq = window.matchMedia('(prefers-color-scheme: dark)');
          mq.addEventListener('change', () => {
            if (get().theme === 'system') {
              applyTheme('system');
            }
          });
        }
      },
    }),
    {
      name: 'tango-theme',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
