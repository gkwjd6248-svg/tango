import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme, Theme } from '../../src/theme/useTheme';
import { SocialLoginButtons } from '../../src/components/SocialLoginButtons';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert(t('error'), 'Please fill in all fields'); return; }
    setLoading(true);
    try { await login(email, password); router.back(); }
    catch (error: any) { Alert.alert('Login Failed', error.message || 'Please check your credentials'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : t('login')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.link}>{t('forgotPassword')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
        <Text style={styles.link}>Don't have an account? {t('register')}</Text>
      </TouchableOpacity>
      <SocialLoginButtons />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: c.surface },
  title: { fontSize: 28, fontWeight: 'bold', color: c.text, marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, color: c.text, backgroundColor: c.background },
  button: { backgroundColor: c.primaryLight, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: c.primaryLight, fontSize: 14, marginTop: 8 },
});
