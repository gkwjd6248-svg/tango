import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CountryFlag } from './CountryFlag';

interface Props {
  event: {
    id: string;
    title: string;
    eventType: string;
    venueName: string;
    city: string;
    countryCode: string;
    startDatetime: string;
    imageUrls?: string[];
  };
  onPress?: () => void;
}

const eventTypeColors: Record<string, string> = {
  milonga: '#8B0000',
  festival: '#9C27B0',
  workshop: '#2196F3',
  class: '#4CAF50',
  practica: '#DAA520',
};

export function EventCard({ event, onPress }: Props) {
  const date = new Date(event.startDatetime);
  const typeColor = eventTypeColors[event.eventType] || '#666';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeText}>{event.eventType}</Text>
          </View>
          <CountryFlag countryCode={event.countryCode} size={16} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.venue}>{event.venueName}</Text>
        <Text style={styles.location}>{event.city}</Text>
        <Text style={styles.date}>
          {date.toLocaleDateString()}{' '}
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: { padding: 12 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  venue: { fontSize: 14, color: '#666' },
  location: { fontSize: 13, color: '#999', marginTop: 2 },
  date: { fontSize: 13, color: '#8B0000', marginTop: 6, fontWeight: '500' },
});
