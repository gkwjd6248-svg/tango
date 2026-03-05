import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/useAuthStore';
import { notificationsApi } from '../../src/api/notifications';
import { useTheme } from '../../src/theme/useTheme';

function NotificationBadge() {
  const { isAuthenticated } = useAuthStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = () => {
      notificationsApi.getUnreadCount()
        .then((data) => setCount(data.count))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (count <= 0) return null;

  return (
    <View style={badgeStyles.badge}>
      <Text style={badgeStyles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#E91E63',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: { backgroundColor: colors.tabBarBg, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.primaryLight },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('events'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'E'}</Text>,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('community'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'C'}</Text>,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: t('deals'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'D'}</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => (
            <View>
              <Text style={{ fontSize: 20, color }}>{'P'}</Text>
              <NotificationBadge />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
