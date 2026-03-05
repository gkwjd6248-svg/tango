import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../src/store/useThemeStore';
import { useTheme, Theme } from '../src/theme/useTheme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { mode, isDark, setMode } = useThemeStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleThemeToggle = (value: boolean) => {
    setMode(value ? 'dark' : 'light');
  };

  const handleSystemTheme = () => {
    setMode('system');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Language */}
      <Text style={styles.sectionTitle}>{t('language')}</Text>
      <View style={styles.section}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.menuItem}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <Text style={styles.menuText}>{lang.label}</Text>
            {i18n.language === lang.code && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Theme */}
      <Text style={styles.sectionTitle}>{t('theme')}</Text>
      <View style={styles.section}>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>{t('darkMode')}</Text>
          <Switch
            value={isDark}
            onValueChange={handleThemeToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={handleSystemTheme}>
          <Text style={styles.menuText}>{t('useSystemTheme')}</Text>
          {mode === 'system' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>{t('about')}</Text>
      <View style={styles.section}>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>{t('version')}</Text>
          <Text style={styles.menuValue}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: { backgroundColor: c.surface },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  menuText: { fontSize: 16, color: c.text },
  menuValue: { fontSize: 14, color: c.textTertiary },
  checkmark: { fontSize: 18, color: c.primary, fontWeight: '700' },
});
