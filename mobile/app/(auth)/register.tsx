import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme, Theme } from '../../src/theme/useTheme';
import { SocialLoginButtons } from '../../src/components/SocialLoginButtons';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { register } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState({ email: '', password: '', nickname: '', countryCode: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.nickname || !form.countryCode) { Alert.alert(t('error'), 'Please fill in all fields'); return; }
    setLoading(true);
    try { await register(form); router.back(); }
    catch (error: any) { Alert.alert('Registration Failed', error.message || 'Please try again'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder={t('nickname')} placeholderTextColor={colors.textTertiary} value={form.nickname} onChangeText={(v) => setForm({ ...form, nickname: v })} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textTertiary} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password (min 8 characters)" placeholderTextColor={colors.textTertiary} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
      <TextInput style={styles.input} placeholder="Country Code (e.g. KR, US, AR)" placeholderTextColor={colors.textTertiary} value={form.countryCode} onChangeText={(v) => setForm({ ...form, countryCode: v.toUpperCase() })} maxLength={2} autoCapitalize="characters" />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : t('register')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>Already have an account? {t('login')}</Text>
      </TouchableOpacity>
      <SocialLoginButtons />
    </ScrollView>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: c.surface },
  title: { fontSize: 28, fontWeight: 'bold', color: c.text, marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, color: c.text, backgroundColor: c.background },
  button: { backgroundColor: c.primaryLight, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: c.primaryLight, fontSize: 14 },
});
