import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', nickname: '', countryCode: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.nickname || !form.countryCode) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.back();
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Nickname" value={form.nickname}
        onChangeText={(v) => setForm({ ...form, nickname: v })} />
      <TextInput style={styles.input} placeholder="Email" value={form.email}
        onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password (min 8 characters)" value={form.password}
        onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
      <TextInput style={styles.input} placeholder="Country Code (e.g. KR, US, AR)" value={form.countryCode}
        onChangeText={(v) => setForm({ ...form, countryCode: v.toUpperCase() })} maxLength={2} autoCapitalize="characters" />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#E91E63', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#E91E63', fontSize: 14 },
});
