import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { Theme } from './index';

export function useTheme() {
  const { colors, isDark, mode } = useThemeStore();
  return { colors, isDark, mode };
}

export type { Theme };
