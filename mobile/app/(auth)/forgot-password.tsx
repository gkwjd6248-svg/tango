import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../src/api/auth';
import { useTheme, Theme } from '../../src/theme/useTheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert(t('error'), t('enterEmail')); return; }
    setIsLoading(true);
    try { await authApi.requestPasswordReset(email.trim()); setIsSent(true); }
    catch (err: any) { Alert.alert(t('error'), err.message || t('error')); }
    finally { setIsLoading(false); }
  };

  if (isSent) {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>✉️</Text>
        <Text style={styles.successTitle}>{t('resetEmailSent')}</Text>
        <Text style={styles.successText}>{t('resetEmailSentDesc')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t('backToLogin')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('forgotPassword')}</Text>
      <Text style={styles.subtitle}>{t('forgotPasswordDesc')}</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder={t('emailPlaceholder')} placeholderTextColor={colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />
      <TouchableOpacity style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('sendResetLink')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.linkText}>{t('backToLogin')}</Text></TouchableOpacity>
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: c.background },
  title: { fontSize: 24, fontWeight: 'bold', color: c.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 32 },
  input: { width: '100%', backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 14, fontSize: 15, marginBottom: 16, color: c.text },
  submitBtn: { width: '100%', backgroundColor: c.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkText: { fontSize: 14, color: c.primary, fontWeight: '500' },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: c.text, marginBottom: 8 },
  successText: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 24 },
  backBtn: { backgroundColor: c.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
