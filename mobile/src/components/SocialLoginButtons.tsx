import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme';
import { useSocialAuth } from '../hooks/useSocialAuth';

export function SocialLoginButtons() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState<string | null>(null);
  const {
    loginWithGoogle,
    loginWithKakao,
    loginWithNaver,
    loginWithApple,
    isAppleAvailable,
  } = useSocialAuth();

  const handleSocial = async (
    provider: string,
    fn: () => Promise<{ isNewUser?: boolean } | null>,
  ) => {
    setLoading(provider);
    try {
      const result = await fn();
      if (result) {
        router.back();
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('orContinueWith')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border }]}
        onPress={() => handleSocial('google', loginWithGoogle)}
        disabled={loading === 'google'}
      >
        <Text style={[styles.buttonText, { color: '#1A1A1A' }]}>
          {loading === 'google' ? t('loading') : t('continueWithGoogle')}
        </Text>
      </TouchableOpacity>

      {/* Kakao */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FEE500' }]}
        onPress={() => handleSocial('kakao', loginWithKakao)}
        disabled={loading === 'kakao'}
      >
        <Text style={[styles.buttonText, { color: '#000000' }]}>
          {loading === 'kakao' ? t('loading') : t('continueWithKakao')}
        </Text>
      </TouchableOpacity>

      {/* Naver */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#03C75A' }]}
        onPress={() => handleSocial('naver', loginWithNaver)}
        disabled={loading === 'naver'}
      >
        <Text style={[styles.buttonText, { color: '#ffffff' }]}>
          {loading === 'naver' ? t('loading') : t('continueWithNaver')}
        </Text>
      </TouchableOpacity>

      {/* Apple - iOS only */}
      {isAppleAvailable && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#000000' }]}
          onPress={() => handleSocial('apple', loginWithApple)}
          disabled={loading === 'apple'}
        >
          <Text style={[styles.buttonText, { color: '#ffffff' }]}>
            {loading === 'apple' ? t('loading') : t('continueWithApple')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (c: Theme) =>
  StyleSheet.create({
    container: { marginTop: 16 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { paddingHorizontal: 12, color: c.textTertiary, fontSize: 13 },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
    },
    buttonText: { fontSize: 15, fontWeight: '600' },
  });
