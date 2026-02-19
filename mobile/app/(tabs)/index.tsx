import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { EventCard } from '../../src/components/EventCard';
import { eventsApi } from '../../src/api/events';

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
  const [events, setEvents] = useState<TangoEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      const response = await eventsApi.getEvents();
      setEvents(response.items);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E91E63']} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No events found nearby</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
});
