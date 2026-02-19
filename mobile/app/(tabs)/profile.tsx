import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { CountryFlag } from '../../src/components/CountryFlag';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Join the Tango Community</Text>
        <Text style={styles.authSubtitle}>Connect with dancers worldwide</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.nickname?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{user?.nickname}</Text>
          {user?.countryCode && <CountryFlag countryCode={user.countryCode} size={20} />}
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>My Bookmarked Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>My Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <Text style={[styles.menuText, { color: '#E91E63' }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  authSubtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  loginBtn: { width: '100%', backgroundColor: '#E91E63', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerBtn: { width: '100%', borderWidth: 1, borderColor: '#E91E63', padding: 16, borderRadius: 12, alignItems: 'center' },
  registerBtnText: { color: '#E91E63', fontSize: 16, fontWeight: '600' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nickname: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#999', marginTop: 4 },
  section: { marginTop: 16, backgroundColor: '#fff' },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 16, color: '#333' },
});
