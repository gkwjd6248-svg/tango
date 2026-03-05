import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationsApi, Notification } from '../src/api/notifications';
import { NotificationItem } from '../src/components/NotificationItem';
import { useTheme, Theme } from '../src/theme/useTheme';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = useCallback(async (pageNum: number) => {
    try {
      const data = await notificationsApi.getNotifications(pageNum, 20);
      if (pageNum === 1) {
        setNotifications(data.items);
      } else {
        setNotifications((prev) => [...prev, ...data.items]);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadNotifications(1);
  };

  const handlePress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
        );
      } catch {
        // Silent fail
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silent fail
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>{t('markAllRead')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={handlePress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        onEndReached={() => {
          if (hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadNotifications(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>{t('noNotifications')}</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markAllBtn: {
    backgroundColor: c.surface,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  markAllText: { fontSize: 14, color: c.primary, fontWeight: '600' },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: c.textTertiary },
});
