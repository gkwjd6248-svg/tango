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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { eventsApi, ChatRoom } from '../../src/api/events';
import { useTheme, Theme } from '../../src/theme/useTheme';

const eventTypeColors: Record<string, string> = {
  milonga: '#8B0000',
  festival: '#9C27B0',
  workshop: '#2196F3',
  class: '#4CAF50',
  practica: '#DAA520',
};

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ChatListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      const data = await eventsApi.getMyChatRooms();
      setRooms(data);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
  };

  const renderItem = ({ item }: { item: ChatRoom }) => {
    const typeColor = eventTypeColors[item.eventType] || '#666';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/events/${item.eventId}/chat`)}
        accessibilityRole="button"
      >
        <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>{item.eventTitle}</Text>
            {item.lastMessageAt && (
              <Text style={styles.timeAgo}>{getTimeAgo(item.lastMessageAt)}</Text>
            )}
          </View>
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          )}
        </View>
        {(item.unreadCount ?? 0) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.eventId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noChatRooms')}</Text>
            <Text style={styles.emptySubtext}>{t('joinEventToChat')}</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    paddingVertical: 14,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  typeIndicator: { width: 4, height: '100%', marginRight: 12 },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1, marginRight: 8 },
  timeAgo: { fontSize: 11, color: c.textTertiary },
  lastMessage: { fontSize: 13, color: c.textTertiary, marginTop: 4 },
  badge: {
    backgroundColor: c.primaryLight,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyText: { fontSize: 16, color: c.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: c.textTertiary, marginTop: 4 },
});
