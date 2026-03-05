import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { eventsApi, EventDetail, VoteResult, RegistrationCounts } from '../../src/api/events';
import { bookmarksApi } from '../../src/api/bookmarks';
import { dealsApi, Hotel } from '../../src/api/deals';
import { CountryFlag } from '../../src/components/CountryFlag';
import { VoteBar } from '../../src/components/VoteBar';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme, Theme } from '../../src/theme/useTheme';

const eventTypeColors: Record<string, string> = {
  milonga: '#8B0000',
  festival: '#9C27B0',
  workshop: '#2196F3',
  class: '#4CAF50',
  practica: '#DAA520',
};

const REPORT_REASONS = [
  'Spam or misleading',
  'Incorrect information',
  'Inappropriate content',
  'Duplicate event',
  'Other',
];

function HotelItem({ hotel, colors }: { hotel: Hotel; colors: Theme }) {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const handleBook = async () => {
    const supported = await Linking.canOpenURL(hotel.affiliateUrl);
    if (supported) await Linking.openURL(hotel.affiliateUrl);
  };
  return (
    <View style={styles.hotelCard}>
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
        <Text style={styles.hotelAddress} numberOfLines={1}>{hotel.address}</Text>
        <View style={styles.hotelMeta}>
          <Text style={styles.hotelStar}>
            {'★'.repeat(Math.min(hotel.starRating, 5))}
            {'☆'.repeat(Math.max(0, 5 - hotel.starRating))}
          </Text>
          {hotel.distanceKm !== undefined && (
            <Text style={styles.hotelDistance}>{hotel.distanceKm.toFixed(1)} km</Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
        <Text style={styles.bookBtnText}>{hotel.currency} {hotel.price.toFixed(0)}</Text>
        <Text style={styles.bookBtnLabel}>{t('bookHotel')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration state
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [regCounts, setRegCounts] = useState<RegistrationCounts | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Votes state
  const [votes, setVotes] = useState<VoteResult>({ likes: 0, dislikes: 0, userVote: null });

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);

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

      // Load additional data in parallel
      const promises: Promise<void>[] = [];

      if (eventData.latitude && eventData.longitude) {
        promises.push(
          dealsApi.getHotelsNearEvent(id as string, eventData.latitude, eventData.longitude)
            .then(setHotels).catch(() => {}),
        );
      }

      promises.push(
        eventsApi.getEventVotes(id as string).then(setVotes).catch(() => {}),
      );

      promises.push(
        eventsApi.getRegistrationCounts(id as string).then(setRegCounts).catch(() => {}),
      );

      if (isAuthenticated) {
        promises.push(
          eventsApi.getMyRegistrationStatus(id as string)
            .then((data) => setRegStatus(data.status))
            .catch(() => {}),
        );
      }

      await Promise.all(promises);
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
    } catch {} finally {
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
    } catch {}
  };

  const handleViewMap = async () => {
    if (!event) return;
    const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const handleRegister = async () => {
    if (!event || isRegistering || !isAuthenticated) return;
    setIsRegistering(true);
    try {
      const result = await eventsApi.registerForEvent(event.id);
      setRegStatus(result.status);
      const counts = await eventsApi.getRegistrationCounts(event.id);
      setRegCounts(counts);
      Alert.alert(t('registered'), t('registrationSuccess'));
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event || isRegistering) return;
    Alert.alert(t('cancelRegistration'), t('cancelRegistrationConfirm'), [
      { text: t('back'), style: 'cancel' },
      {
        text: t('cancel'),
        style: 'destructive',
        onPress: async () => {
          setIsRegistering(true);
          try {
            await eventsApi.cancelRegistration(event.id);
            setRegStatus('cancelled');
            const counts = await eventsApi.getRegistrationCounts(event.id);
            setRegCounts(counts);
          } catch (err: any) {
            Alert.alert(t('error'), err.message || t('error'));
          } finally {
            setIsRegistering(false);
          }
        },
      },
    ]);
  };

  const handleReport = async () => {
    if (!event || !reportReason) return;
    setIsReporting(true);
    try {
      await eventsApi.reportEvent(event.id, { reason: reportReason, description: reportDescription });
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      Alert.alert(t('reported'), t('reportSuccess'));
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    } finally {
      setIsReporting(false);
    }
  };

  const handleDelete = () => {
    if (!event) return;
    Alert.alert(t('deleteEvent'), t('deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await eventsApi.deleteEvent(event.id);
            router.back();
          } catch (err: any) {
            Alert.alert(t('error'), err.message || t('error'));
          }
        },
      },
    ]);
  };

  const handleVerify = async () => {
    if (!event) return;
    try {
      await eventsApi.verifyEvent(event.id);
      setEvent({ ...event, isVerified: true });
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
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
  const isOwner = user?.id === event.createdBy;
  const isAdmin = user?.isAdmin;
  const isRegistered = regStatus && !['cancelled', 'rejected'].includes(regStatus);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero section */}
      <View style={[styles.hero, { backgroundColor: typeColor }]}>
        <View style={styles.heroContent}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadges}>
              <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={styles.typeText}>{event.eventType.toUpperCase()}</Text>
              </View>
              {event.isVerified && (
                <View style={[styles.typeBadge, { backgroundColor: 'rgba(76,175,80,0.8)' }]}>
                  <Text style={styles.typeText}>VERIFIED</Text>
                </View>
              )}
              {event.source === 'ai_crawl' && (
                <View style={[styles.typeBadge, { backgroundColor: 'rgba(33,150,243,0.8)' }]}>
                  <Text style={styles.typeText}>AI</Text>
                </View>
              )}
            </View>
            <CountryFlag countryCode={event.countryCode} size={20} />
          </View>
          <Text style={styles.heroTitle}>{event.title}</Text>
          <Text style={styles.heroVenue}>{event.venueName}</Text>
          <Text style={styles.heroCity}>{event.city}</Text>
          {regCounts && event.maxParticipants && (
            <Text style={styles.heroCapacity}>
              {regCounts.approved}/{event.maxParticipants} {t('spotsFilled')}
            </Text>
          )}
        </View>
      </View>

      {/* Unverified warning */}
      {!event.isVerified && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{t('unverifiedWarning')}</Text>
        </View>
      )}

      {/* Action buttons row 1 */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, isBookmarked && styles.actionBtnActive]}
          onPress={handleBookmark}
          disabled={isBookmarking}
        >
          {isBookmarking ? (
            <ActivityIndicator size="small" color={isBookmarked ? '#fff' : colors.primary} />
          ) : (
            <Text style={[styles.actionBtnText, isBookmarked && styles.actionBtnTextActive]}>
              {isBookmarked ? t('bookmarked') : t('bookmark')}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionBtnText}>{t('share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleViewMap}>
          <Text style={styles.actionBtnText}>{t('viewOnMap')}</Text>
        </TouchableOpacity>
      </View>

      {/* Action buttons row 2: Registration, Chat, etc. */}
      <View style={styles.actionRow}>
        {isAuthenticated && !isOwner && (
          <TouchableOpacity
            style={[styles.actionBtn, isRegistered ? styles.actionBtnActive : styles.actionBtnPrimary]}
            onPress={isRegistered ? handleCancelRegistration : handleRegister}
            disabled={isRegistering}
          >
            {isRegistering ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.actionBtnText, (isRegistered || !isRegistered) && styles.actionBtnTextPrimary]}>
                {isRegistered ? t('leave') : t('join')}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {isOwner && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/events/${event.id}/registrations`)}
          >
            <Text style={styles.actionBtnText}>{t('manageRegistrations')}</Text>
          </TouchableOpacity>
        )}

        {isRegistered && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => router.push(`/events/${event.id}/chat`)}
          >
            <Text style={styles.actionBtnTextPrimary}>{t('chat')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={[styles.actionBtnText, { color: colors.error }]}>{t('report')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Registration counts */}
        {regCounts && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>{t('registrations')}</Text>
            <View style={styles.countsRow}>
              <View style={styles.countItem}>
                <Text style={styles.countNumber}>{regCounts.approved}</Text>
                <Text style={styles.countLabel}>{t('approved')}</Text>
              </View>
              <View style={styles.countItem}>
                <Text style={[styles.countNumber, { color: '#E65100' }]}>{regCounts.pending}</Text>
                <Text style={styles.countLabel}>{t('pending')}</Text>
              </View>
              <View style={styles.countItem}>
                <Text style={styles.countNumber}>{regCounts.total}</Text>
                <Text style={styles.countLabel}>{t('total')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Date & Time */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>{t('dateTime')}</Text>
          <Text style={styles.infoValue}>
            {startDate.toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
          <Text style={styles.infoValue}>
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {endDate && ` - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </Text>
          {event.registrationDeadline && (
            <Text style={styles.deadlineText}>
              {t('registrationDeadline')}: {new Date(event.registrationDeadline).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Venue */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>{t('venue')}</Text>
          <Text style={styles.infoValue}>{event.venueName}</Text>
          {event.venueAddress && <Text style={styles.infoSubValue}>{event.venueAddress}</Text>}
        </View>

        {/* Price */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>{t('price')}</Text>
          <Text style={styles.infoValue}>
            {event.price ? `${event.currency || ''} ${event.price}` : t('freeEntry')}
          </Text>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>{t('description')}</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Organizer */}
        {(event.organizerName || event.organizerContact) && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>{t('organizer')}</Text>
            {event.organizerName && <Text style={styles.infoValue}>{event.organizerName}</Text>}
            {event.organizerContact && <Text style={styles.infoSubValue}>{event.organizerContact}</Text>}
            {event.websiteUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(event.websiteUrl!)}>
                <Text style={styles.linkText}>{event.websiteUrl}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Vote Bar */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>{t('communityVote')}</Text>
          <VoteBar eventId={event.id} initialVotes={votes} />
        </View>

        {/* Hotels Nearby */}
        {hotels.length > 0 && (
          <View style={styles.hotelsSection}>
            <Text style={styles.hotelsSectionTitle}>{t('hotelsNearby')}</Text>
            {hotels.map((hotel) => (
              <HotelItem key={hotel.id} hotel={hotel} colors={colors} />
            ))}
          </View>
        )}

        {/* Owner/Admin actions */}
        {(isOwner || isAdmin) && (
          <View style={styles.adminSection}>
            {isAdmin && !event.isVerified && (
              <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
                <Text style={styles.verifyBtnText}>{t('verifyEvent')}</Text>
              </TouchableOpacity>
            )}
            {(isOwner || isAdmin) && (
              <TouchableOpacity style={styles.deleteEventBtn} onPress={handleDelete}>
                <Text style={styles.deleteEventBtnText}>{t('deleteEvent')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('reportEvent')}</Text>
            <Text style={styles.modalLabel}>{t('reason')}</Text>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonItem, reportReason === reason && styles.reasonItemActive]}
                onPress={() => setReportReason(reason)}
              >
                <Text style={[styles.reasonText, reportReason === reason && styles.reasonTextActive]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.modalInput}
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder={t('additionalDetails')}
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowReportModal(false); setReportReason(''); setReportDescription(''); }}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (!reportReason || isReporting) && styles.modalSubmitDisabled]}
                onPress={handleReport}
                disabled={!reportReason || isReporting}
              >
                {isReporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>{t('submit')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { fontSize: 16, color: c.textSecondary, marginTop: 12 },
  errorText: { fontSize: 16, color: c.error, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Hero
  hero: { padding: 24, paddingTop: 32, paddingBottom: 28 },
  heroContent: {},
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroBadges: { flexDirection: 'row', gap: 6 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8, lineHeight: 30 },
  heroVenue: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  heroCity: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  heroCapacity: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8, fontWeight: '600' },

  // Warning
  warningBanner: { backgroundColor: '#FFF3E0', padding: 12, alignItems: 'center' },
  warningText: { fontSize: 12, color: '#E65100', fontWeight: '500' },

  // Action row
  actionRow: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: c.primary,
    alignItems: 'center',
  },
  actionBtnActive: { backgroundColor: c.primary },
  actionBtnPrimary: { backgroundColor: c.primary, borderColor: c.primary },
  actionBtnText: { fontSize: 11, color: c.primary, fontWeight: '600' },
  actionBtnTextActive: { color: '#fff' },
  actionBtnTextPrimary: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Body sections
  body: { padding: 16 },
  infoSection: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: c.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: { fontSize: 16, color: c.text, fontWeight: '500', marginBottom: 2 },
  infoSubValue: { fontSize: 14, color: c.textSecondary, marginTop: 2 },
  descriptionText: { fontSize: 15, color: c.textSecondary, lineHeight: 22 },
  linkText: { fontSize: 14, color: '#2196F3', marginTop: 4 },
  deadlineText: { fontSize: 12, color: '#E65100', marginTop: 6, fontWeight: '500' },

  // Counts
  countsRow: { flexDirection: 'row', gap: 24 },
  countItem: { alignItems: 'center' },
  countNumber: { fontSize: 20, fontWeight: '700', color: c.success },
  countLabel: { fontSize: 11, color: c.textTertiary, marginTop: 2 },

  // Hotels
  hotelsSection: { backgroundColor: c.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  hotelsSectionTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 12 },
  hotelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  hotelInfo: { flex: 1, marginRight: 12 },
  hotelName: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 2 },
  hotelAddress: { fontSize: 12, color: c.textTertiary, marginBottom: 4 },
  hotelMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hotelStar: { fontSize: 12, color: '#DAA520' },
  hotelDistance: { fontSize: 11, color: c.textTertiary, marginLeft: 6 },
  bookBtn: {
    backgroundColor: c.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  bookBtnLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 1 },

  // Admin section
  adminSection: { marginTop: 8, gap: 8 },
  verifyBtn: {
    backgroundColor: c.success,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  verifyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deleteEventBtn: {
    borderWidth: 1.5,
    borderColor: c.error,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  deleteEventBtnText: { color: c.error, fontSize: 14, fontWeight: '600' },

  // Report Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 8 },
  reasonItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 8,
  },
  reasonItemActive: { borderColor: c.primary, backgroundColor: c.primaryLight + '20' },
  reasonText: { fontSize: 14, color: c.text },
  reasonTextActive: { color: c.primary, fontWeight: '600' },
  modalInput: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginTop: 8,
    color: c.text,
    backgroundColor: c.background,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
  modalSubmitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: c.primary,
    alignItems: 'center',
  },
  modalSubmitDisabled: { opacity: 0.5 },
  modalSubmitText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
