import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EventCard } from '../../src/components/EventCard';
import { eventsApi } from '../../src/api/events';
import { useTheme, Theme } from '../../src/theme/useTheme';

interface TangoEvent {
  id: string;
  title: string;
  eventType: string;
  venueName: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  imageUrls: string[];
}

export default function EventsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [events, setEvents] = useState<TangoEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setError(null);
      const response = await eventsApi.getEvents();
      setEvents(response.items);
    } catch (err: any) {
      setError(err.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  useEffect(() => { loadEvents(); }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={loadEvents}>{t('retry')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noEvents')}</Text>
            <Text style={styles.emptySubtext}>{t('pullToRefresh')}</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  list: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: c.background },
  loadingText: { fontSize: 16, color: c.textSecondary },
  errorText: { fontSize: 16, color: c.primary, marginBottom: 12, textAlign: 'center' },
  retryText: { fontSize: 15, color: c.primary, textDecorationLine: 'underline' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: c.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: c.textTertiary, marginTop: 8 },
});
