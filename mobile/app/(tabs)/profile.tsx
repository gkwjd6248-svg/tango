import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/useAuthStore';
import { CountryFlag } from '../../src/components/CountryFlag';

interface MenuItem {
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>{t('joinCommunity')}</Text>
        <Text style={styles.authSubtitle}>{t('connectDancers')}</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
        >
          <Text style={styles.loginBtnText}>{t('login')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push('/(auth)/register')}
          accessibilityRole="button"
        >
          <Text style={styles.registerBtnText}>{t('register')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const menuItems: MenuItem[] = [
    {
      label: t('myBookmarks'),
      onPress: () => router.push('/bookmarks'),
    },
    {
      label: t('myPosts'),
      onPress: () => router.push('/my-posts'),
    },
    {
      label: t('settings'),
      onPress: () => {},
    },
    {
      label: t('logout'),
      onPress: logout,
      danger: true,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nickname?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{user?.nickname}</Text>
          {user?.countryCode && (
            <CountryFlag countryCode={user.countryCode} size={20} />
          )}
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.danceLevel && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{user.danceLevel}</Text>
          </View>
        )}
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={item.onPress}
            accessibilityRole="button"
          >
            <Text style={[styles.menuText, item.danger && styles.menuTextDanger]}>
              {item.label}
            </Text>
            {!item.danger && <Text style={styles.menuChevron}>›</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#8B0000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#8B0000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerBtnText: { color: '#8B0000', fontSize: 16, fontWeight: '600' },
  header: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nickname: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  email: { fontSize: 14, color: '#999' },
  levelBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DAA520',
  },
  levelText: { fontSize: 12, color: '#DAA520', fontWeight: '600' },
  section: { marginTop: 16, backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: { fontSize: 16, color: '#333' },
  menuTextDanger: { color: '#8B0000' },
  menuChevron: { fontSize: 20, color: '#ccc' },
});
