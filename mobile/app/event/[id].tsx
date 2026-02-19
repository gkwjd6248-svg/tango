import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '../../src/api/events';
import { bookmarksApi, BookmarkedEvent } from '../../src/api/bookmarks';
import { dealsApi, Hotel } from '../../src/api/deals';
import { CountryFlag } from '../../src/components/CountryFlag';

interface EventDetail {
  id: string;
  title: string;
  eventType: string;
  description: string;
  venueName: string;
  venueAddress: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  endDatetime?: string;
  price?: number;
  currency?: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
  organizer?: {
    name: string;
    contactEmail?: string;
  };
}

const eventTypeColors: Record<string, string> = {
  milonga: '#8B0000',
  festival: '#9C27B0',
  workshop: '#2196F3',
  class: '#4CAF50',
  practica: '#DAA520',
};

function HotelItem({ hotel }: { hotel: Hotel }) {
  const { t } = useTranslation();

  const handleBook = async () => {
    const supported = await Linking.canOpenURL(hotel.affiliateUrl);
    if (supported) {
      await Linking.openURL(hotel.affiliateUrl);
    }
  };

  return (
    <View style={styles.hotelCard}>
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>
          {hotel.name}
        </Text>
        <Text style={styles.hotelAddress} numberOfLines={1}>
          {hotel.address}
        </Text>
        <View style={styles.hotelMeta}>
          <Text style={styles.hotelStar}>
            {'★'.repeat(Math.min(hotel.starRating, 5))}
            {'☆'.repeat(Math.max(0, 5 - hotel.starRating))}
          </Text>
          {hotel.distanceKm !== undefined && (
            <Text style={styles.hotelDistance}>
              {hotel.distanceKm.toFixed(1)} km
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
        <Text style={styles.bookBtnText}>
          {hotel.currency} {hotel.price.toFixed(0)}
        </Text>
        <Text style={styles.bookBtnLabel}>{t('bookHotel')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadEventDetail();
  }, [id]);

  const loadEventDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventData, bookmarkData] = await Promise.all([
        eventsApi.getEvent(id as string),
        bookmarksApi.checkBookmark(id as string).catch(() => ({ bookmarked: false })),
      ]);

      setEvent(eventData);
      setIsBookmarked(bookmarkData.bookmarked);

      // Load hotels in the background after event loads
      if (eventData.latitude && eventData.longitude) {
        dealsApi
          .getHotelsNearEvent(id as string, eventData.latitude, eventData.longitude)
          .then(setHotels)
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!event || isBookmarking) return;
    setIsBookmarking(true);
    try {
      const result = await bookmarksApi.toggleBookmark(event.id);
      setIsBookmarked(result.bookmarked);
    } catch {
      // Silent fail
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.title,
        message: `${event.title}\n${event.venueName}, ${event.city}\n${new Date(event.startDatetime).toLocaleDateString()}`,
      });
    } catch {
      // Silent fail
    }
  };

  const handleViewMap = async () => {
    if (!event) return;
    const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || t('error')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadEventDetail}>
          <Text style={styles.retryBtnText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColor = eventTypeColors[event.eventType] || '#666';
  const startDate = new Date(event.startDatetime);
  const endDate = event.endDatetime ? new Date(event.endDatetime) : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero section */}
      <View style={[styles.hero, { backgroundColor: typeColor }]}>
        <View style={styles.heroContent}>
          <View style={styles.heroTopRow}>
            <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={styles.typeText}>{event.eventType.toUpperCase()}</Text>
            </View>
            <CountryFlag countryCode={event.countryCode} size={20} />
          </View>
          <Text style={styles.heroTitle}>{event.title}</Text>
          <Text style={styles.heroVenue}>{event.venueName}</Text>
          <Text style={styles.heroCity}>{event.city}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, isBookmarked && styles.actionBtnActive]}
          onPress={handleBookmark}
          disabled={isBookmarking}
          accessibilityLabel={t('bookmark')}
        >
          {isBookmarking ? (
            <ActivityIndicator size="small" color={isBookmarked ? '#fff' : '#8B0000'} />
          ) : (
            <Text style={[styles.actionBtnText, isBookmarked && styles.actionBtnTextActive]}>
              {isBookmarked ? t('bookmarked') : t('bookmark')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          accessibilityLabel={t('share')}
        >
          <Text style={styles.actionBtnText}>{t('share')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleViewMap}
          accessibilityLabel={t('viewOnMap')}
        >
          <Text style={styles.actionBtnText}>{t('viewOnMap')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Date & Time */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>{t('dateTime')}</Text>
          <Text style={styles.infoValue}>
            {startDate.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.infoValue}>
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {endDate &&
              ` - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </Text>
        </View>

        {/* Venue */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>{t('venue')}</Text>
          <Text style={styles.infoValue}>{event.venueName}</Text>
          {event.venueAddress && (
            <Text style={styles.infoSubValue}>{event.venueAddress}</Text>
          )}
        </View>

        {/* Price */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>{t('price')}</Text>
          <Text style={styles.infoValue}>
            {event.price
              ? `${event.currency || ''} ${event.price}`
              : t('freeEntry')}
          </Text>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>{t('description')}</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Hotels Nearby */}
        {hotels.length > 0 && (
          <View style={styles.hotelsSection}>
            <Text style={styles.hotelsSectionTitle}>{t('hotelsNearby')}</Text>
            {hotels.map((hotel) => (
              <HotelItem key={hotel.id} hotel={hotel} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  errorText: {
    fontSize: 16,
    color: '#8B0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Hero
  hero: { padding: 24, paddingTop: 32, paddingBottom: 28 },
  heroContent: {},
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 30,
  },
  heroVenue: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  heroCity: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  // Action row
  actionRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#8B0000',
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#8B0000',
  },
  actionBtnText: { fontSize: 12, color: '#8B0000', fontWeight: '600' },
  actionBtnTextActive: { color: '#fff' },

  // Body sections
  body: { padding: 16 },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#8B0000',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: { fontSize: 16, color: '#1A1A1A', fontWeight: '500', marginBottom: 2 },
  infoSubValue: { fontSize: 14, color: '#666', marginTop: 2 },
  descriptionText: { fontSize: 15, color: '#444', lineHeight: 22 },

  // Hotels
  hotelsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  hotelsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  hotelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  hotelInfo: { flex: 1, marginRight: 12 },
  hotelName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  hotelAddress: { fontSize: 12, color: '#999', marginBottom: 4 },
  hotelMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hotelStar: { fontSize: 12, color: '#DAA520' },
  hotelDistance: { fontSize: 11, color: '#999', marginLeft: 6 },
  bookBtn: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  bookBtnLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 1 },
});
