import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { eventsApi, EventDetail, RegistrationCounts } from '../../src/api/events';
import { useTheme, Theme } from '../../src/theme/useTheme';

const eventTypeColors: Record<string, string> = {
  milonga: '#8B0000',
  festival: '#9C27B0',
  workshop: '#2196F3',
  class: '#4CAF50',
  practica: '#DAA520',
};

export default function MyEventsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [events, setEvents] = useState<(EventDetail & { regCounts?: RegistrationCounts })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEvents = useCallback(async (pageNum: number) => {
    try {
      const data = await eventsApi.getMyEvents(pageNum, 20);
      const items = data.items || [];
      // Load registration counts
      const withCounts = await Promise.all(
        items.map(async (event: EventDetail) => {
          try {
            const regCounts = await eventsApi.getRegistrationCounts(event.id);
            return { ...event, regCounts };
          } catch {
            return event;
          }
        }),
      );
      if (pageNum === 1) {
        setEvents(withCounts);
      } else {
        setEvents((prev) => [...prev, ...withCounts]);
      }
      setHasMore(pageNum < (data.totalPages || 1));
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(1);
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadEvents(1);
  };

  const handleDelete = (eventId: string, title: string) => {
    Alert.alert(
      t('deleteEvent'),
      `${t('deleteConfirm')} "${title}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            setDeletingId(eventId);
            try {
              await eventsApi.deleteEvent(eventId);
              setEvents((prev) => prev.filter((e) => e.id !== eventId));
            } catch (err: any) {
              Alert.alert(t('error'), err.message || t('error'));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: EventDetail & { regCounts?: RegistrationCounts } }) => {
    const typeColor = eventTypeColors[item.eventType] || colors.textSecondary;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeText}>{item.eventType.toUpperCase()}</Text>
          </View>
          {item.isVerified && <Text style={styles.verified}>Verified</Text>}
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.location}>{item.city}, {item.countryCode}</Text>
        <Text style={styles.date}>
          {new Date(item.startDatetime).toLocaleDateString()}
        </Text>

        {item.regCounts && (
          <View style={styles.countsRow}>
            <Text style={styles.countLabel}>
              {t('approved')}: <Text style={styles.countValue}>{item.regCounts.approved}</Text>
            </Text>
            <Text style={styles.countLabel}>
              {t('pending')}: <Text style={[styles.countValue, { color: '#E65100' }]}>{item.regCounts.pending}</Text>
            </Text>
            <Text style={styles.countLabel}>
              {t('total')}: <Text style={styles.countValue}>{item.regCounts.total}</Text>
            </Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push(`/events/${item.id}/registrations`)}
          >
            <Text style={styles.manageBtnText}>{t('manageRegistrations')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.title)}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.deleteBtnText}>{t('delete')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        onEndReached={() => {
          if (hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadEvents(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noMyEvents')}</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/events/create')}>
              <Text style={styles.createBtnText}>{t('createFirstEvent')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/events/create')}
        accessibilityLabel={t('createEvent')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  typeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  verified: { fontSize: 11, color: c.success, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 4 },
  location: { fontSize: 13, color: c.textSecondary },
  date: { fontSize: 13, color: c.textTertiary, marginTop: 2 },
  countsRow: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border },
  countLabel: { fontSize: 12, color: c.textSecondary },
  countValue: { fontWeight: '700', color: c.success },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  manageBtn: {
    flex: 1,
    backgroundColor: c.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  manageBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.error,
    alignItems: 'center',
  },
  deleteBtnText: { color: c.error, fontSize: 13, fontWeight: '600' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: c.textTertiary, marginBottom: 16 },
  createBtn: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
