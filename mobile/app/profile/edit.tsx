import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme, Theme } from '../../src/theme/useTheme';

const DANCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'];
const COUNTRIES = [
  'AR', 'BR', 'CL', 'CO', 'DE', 'ES', 'FR', 'GB', 'IT', 'JP',
  'KR', 'MX', 'NL', 'PE', 'TR', 'US', 'UY', 'VN',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [countryCode, setCountryCode] = useState(user?.countryCode || '');
  const [danceLevel, setDanceLevel] = useState(user?.danceLevel || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert(t('error'), t('nicknameRequired'));
      return;
    }
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        nickname: nickname.trim(),
        countryCode: countryCode || undefined,
        danceLevel: danceLevel || undefined,
      });
      // Update local store
      useAuthStore.setState({ user: { ...user!, ...updated } });
      Alert.alert(t('profileUpdated'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.label}>{t('nickname')} *</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder={t('nicknamePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          maxLength={50}
        />

        <Text style={styles.label}>{t('country')}</Text>
        <View style={styles.chipRow}>
          {COUNTRIES.map((code) => (
            <TouchableOpacity
              key={code}
              style={[styles.chip, countryCode === code && styles.chipActive]}
              onPress={() => setCountryCode(countryCode === code ? '' : code)}
            >
              <Text style={[styles.chipText, countryCode === code && styles.chipTextActive]}>{code}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('danceLevel')}</Text>
        <View style={styles.chipRow}>
          {DANCE_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.chip, danceLevel === level && styles.chipActive]}
              onPress={() => setDanceLevel(danceLevel === level ? '' : level)}
            >
              <Text style={[styles.chipText, danceLevel === level && styles.chipTextActive]}>
                {t(level) || level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{t('save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: c.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    padding: 12,
    fontSize: 15,
    color: c.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.border,
  },
  chipActive: { backgroundColor: c.primary },
  chipText: { fontSize: 13, color: c.text, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: c.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
