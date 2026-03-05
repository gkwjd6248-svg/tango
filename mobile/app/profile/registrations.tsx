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
import { eventsApi } from '../../src/api/events';
import { RegistrationStatusBadge } from '../../src/components/RegistrationStatusBadge';
import { useTheme, Theme } from '../../src/theme/useTheme';

interface MyRegistration {
  id: string;
  title: string;
  eventType: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  registrationStatus?: string;
  registrationDate?: string;
}

const eventTypeColors: Record<string, string> = {
  milonga: '#8B0000',
  festival: '#9C27B0',
  workshop: '#2196F3',
  class: '#4CAF50',
  practica: '#DAA520',
};

export default function MyRegistrationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<MyRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRegistrations = useCallback(async (pageNum: number) => {
    try {
      const data = await eventsApi.getMyRegistrations(pageNum, 20);
      const results = data.items || [];
      if (pageNum === 1) {
        setItems(results);
      } else {
        setItems((prev) => [...prev, ...results]);
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
    loadRegistrations(1);
  }, [loadRegistrations]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadRegistrations(1);
  };

  const handleCancel = (eventId: string, title: string) => {
    Alert.alert(
      t('cancelRegistration'),
      `${t('cancelRegistrationConfirm')} "${title}"?`,
      [
        { text: t('back'), style: 'cancel' },
        {
          text: t('cancel'),
          style: 'destructive',
          onPress: async () => {
            setCancellingId(eventId);
            try {
              await eventsApi.cancelRegistration(eventId);
              setItems((prev) =>
                prev.map((item) =>
                  item.id === eventId ? { ...item, registrationStatus: 'cancelled' } : item,
                ),
              );
            } catch (err: any) {
              Alert.alert(t('error'), err.message || t('error'));
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: MyRegistration }) => {
    const typeColor = eventTypeColors[item.eventType] || colors.textSecondary;
    const canCancel = item.registrationStatus && !['cancelled', 'rejected'].includes(item.registrationStatus);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeText}>{item.eventType.toUpperCase()}</Text>
          </View>
          {item.registrationStatus && (
            <RegistrationStatusBadge status={item.registrationStatus} />
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.location}>{item.city}, {item.countryCode}</Text>
        <Text style={styles.date}>
          {new Date(item.startDatetime).toLocaleDateString()}
        </Text>
        {item.registrationDate && (
          <Text style={styles.regDate}>
            {t('registeredOn')}: {new Date(item.registrationDate).toLocaleDateString()}
          </Text>
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancel(item.id, item.title)}
            disabled={cancellingId === item.id}
          >
            {cancellingId === item.id ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.cancelBtnText}>{t('cancelRegistration')}</Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
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
            loadRegistrations(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noRegistrations')}</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.browseBtnText}>{t('browseEvents')}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  typeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 4 },
  location: { fontSize: 13, color: c.textSecondary },
  date: { fontSize: 13, color: c.textTertiary, marginTop: 2 },
  regDate: { fontSize: 11, color: c.textTertiary, marginTop: 4 },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: c.error,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: c.error, fontSize: 13, fontWeight: '600' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: c.textTertiary, marginBottom: 16 },
  browseBtn: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
