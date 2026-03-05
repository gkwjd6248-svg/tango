import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { LightTheme, DarkTheme, Theme } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: Theme;
  setMode: (mode: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
}

function resolveTheme(mode: ThemeMode): { isDark: boolean; colors: Theme } {
  if (mode === 'system') {
    const systemDark = Appearance.getColorScheme() === 'dark';
    return { isDark: systemDark, colors: systemDark ? DarkTheme : LightTheme };
  }
  const isDark = mode === 'dark';
  return { isDark, colors: isDark ? DarkTheme : LightTheme };
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  isDark: false,
  colors: LightTheme,

  setMode: async (mode) => {
    const { isDark, colors } = resolveTheme(mode);
    set({ mode, isDark, colors });
    await AsyncStorage.setItem('themeMode', mode);
  },

  loadTheme: async () => {
    const saved = (await AsyncStorage.getItem('themeMode')) as ThemeMode | null;
    const mode = saved || 'system';
    const { isDark, colors } = resolveTheme(mode);
    set({ mode, isDark, colors });
  },
}));
