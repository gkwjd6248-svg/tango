import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/useAuthStore';
import { notificationsApi } from '../../src/api/notifications';
import { CountryFlag } from '../../src/components/CountryFlag';
import { useTheme, Theme } from '../../src/theme/useTheme';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi.getUnreadCount().then((data) => setUnreadCount(data.count)).catch(() => {});
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>{t('joinCommunity')}</Text>
        <Text style={styles.authSubtitle}>{t('connectDancers')}</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}><Text style={styles.loginBtnText}>{t('login')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}><Text style={styles.registerBtnText}>{t('register')}</Text></TouchableOpacity>
      </View>
    );
  }

  const menuItems = [
    { label: t('myEvents'), onPress: () => router.push('/profile/events') },
    { label: t('myRegistrations'), onPress: () => router.push('/profile/registrations') },
    { label: t('myBookmarks'), onPress: () => router.push('/bookmarks') },
    { label: t('myPosts'), onPress: () => router.push('/my-posts') },
    { label: t('notifications'), onPress: () => router.push('/notifications'), badge: unreadCount },
    { label: t('chatRooms'), onPress: () => router.push('/chat') },
    { label: t('settings'), onPress: () => router.push('/settings') },
    { label: t('logout'), onPress: logout, danger: true },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.nickname?.charAt(0)?.toUpperCase()}</Text></View>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{user?.nickname}</Text>
          {user?.countryCode && <CountryFlag countryCode={user.countryCode} size={20} />}
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.danceLevel && <View style={styles.levelBadge}><Text style={styles.levelText}>{user.danceLevel}</Text></View>}
        <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/profile/edit')}>
          <Text style={styles.editProfileText}>{t('editProfile')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <Text style={[styles.menuText, item.danger && styles.menuTextDanger]}>{item.label}</Text>
            <View style={styles.menuRight}>
              {item.badge != null && item.badge > 0 && <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{item.badge}</Text></View>}
              {!item.danger && <Text style={styles.menuChevron}>›</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: c.background },
  authTitle: { fontSize: 22, fontWeight: 'bold', color: c.text, marginBottom: 8, textAlign: 'center' },
  authSubtitle: { fontSize: 15, color: c.textSecondary, marginBottom: 32, textAlign: 'center' },
  loginBtn: { width: '100%', backgroundColor: c.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerBtn: { width: '100%', borderWidth: 1.5, borderColor: c.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  registerBtnText: { color: c.primary, fontSize: 16, fontWeight: '600' },
  header: { alignItems: 'center', padding: 28, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nickname: { fontSize: 20, fontWeight: 'bold', color: c.text },
  email: { fontSize: 14, color: c.textTertiary },
  levelBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: c.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: '#DAA520' },
  levelText: { fontSize: 12, color: '#DAA520', fontWeight: '600' },
  editProfileBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.primary },
  editProfileText: { fontSize: 13, color: c.primary, fontWeight: '600' },
  section: { marginTop: 16, backgroundColor: c.surface },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  menuText: { fontSize: 16, color: c.text },
  menuTextDanger: { color: c.error },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: { backgroundColor: '#E91E63', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  menuChevron: { fontSize: 20, color: c.textTertiary },
});
