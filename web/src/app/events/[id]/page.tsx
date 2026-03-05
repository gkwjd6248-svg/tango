'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaBookmark,
  FaRegBookmark,
  FaShare,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTicketAlt,
  FaStar,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaTrash,
  FaCheck,
  FaFlag,
  FaUserPlus,
  FaUsers,
  FaComments,
} from 'react-icons/fa';
import { eventsApi, TangoEvent, EventRegistration, RegistrationCounts } from '@/lib/api/events';
import { bookmarksApi } from '@/lib/api/bookmarks';
import { dealsApi, Hotel } from '@/lib/api/deals';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/lib/utils';
import { CountryFlag } from '@/components/CountryFlag';
import { useTranslation, Locale } from '@/lib/i18n';
import VoteBar from '@/components/VoteBar';

// ─── Country → locale suggestion ─────────────────────────────────────────────

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  es: 'Español',
};

function suggestLocaleForCountry(countryCode: string): Locale | null {
  if (countryCode === 'KR') return 'ko';
  if (['AR', 'ES', 'MX', 'CL', 'UY', 'CO', 'PE'].includes(countryCode)) return 'es';
  return null; // no suggestion, keep current
}

// ─── Event type style map ─────────────────────────────────────────────────────

const EVENT_TYPE_STYLES: Record<
  string,
  { bg: string; text: string; heroBg: string; label: string }
> = {
  milonga: {
    bg: 'bg-primary-700',
    text: 'text-white',
    heroBg: 'from-primary-800 to-primary-900',
    label: 'Milonga',
  },
  festival: {
    bg: 'bg-purple-700',
    text: 'text-white',
    heroBg: 'from-purple-800 to-purple-900',
    label: 'Festival',
  },
  workshop: {
    bg: 'bg-blue-600',
    text: 'text-white',
    heroBg: 'from-blue-700 to-blue-900',
    label: 'Workshop',
  },
  class: {
    bg: 'bg-green-600',
    text: 'text-white',
    heroBg: 'from-green-700 to-green-900',
    label: 'Class',
  },
  practica: {
    bg: 'bg-amber-500',
    text: 'text-white',
    heroBg: 'from-amber-600 to-amber-800',
    label: 'Practica',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 flex gap-4">
      <div
        className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/50 flex items-center justify-center
                   flex-shrink-0 text-primary-700 dark:text-primary-400"
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-warm-900 dark:text-warm-100 text-sm leading-snug">{children}</div>
      </div>
    </div>
  );
}

function HotelCard({ hotel, bookLabel }: { hotel: Hotel; bookLabel: string }) {
  return (
    <div
      className="flex items-center gap-4 py-4 border-b border-warm-100 dark:border-warm-800
                 last:border-0"
    >
      {/* Hotel image or placeholder */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100 dark:bg-warm-800">
        {hotel.imageUrl ? (
          <Image
            src={hotel.imageUrl}
            alt={hotel.name}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-warm-300">
            <FaMapMarkerAlt size={20} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-warm-900 dark:text-warm-100 truncate">{hotel.name}</p>
        <p className="text-xs text-warm-400 dark:text-warm-500 truncate">{hotel.address}</p>

        {/* Stars */}
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }, (_, i) => (
            <FaStar
              key={i}
              size={10}
              className={i < hotel.starRating ? 'text-accent-400' : 'text-warm-200'}
            />
          ))}
          {hotel.distanceKm !== undefined && (
            <span className="text-xs text-warm-400 dark:text-warm-500 ml-2">
              {hotel.distanceKm.toFixed(1)} km away
            </span>
          )}
        </div>
      </div>

      {/* Price + CTA */}
      <a
        href={hotel.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-center"
        aria-label={`Book ${hotel.name}`}
      >
        <p className="text-primary-700 dark:text-primary-400 font-bold text-sm">
          {hotel.currency} {hotel.price.toFixed(0)}
        </p>
        <span
          className="inline-block mt-1 px-3 py-1.5 rounded-lg bg-primary-700 text-white
                     text-xs font-semibold hover:bg-primary-600 transition-colors"
        >
          {bookLabel}
        </span>
      </a>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 sm:h-80 bg-gray-200 dark:bg-warm-800" />
      <div className="page-container py-8 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-warm-800 rounded w-2/3" />
        <div className="h-4 bg-gray-100 dark:bg-warm-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-warm-800 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 dark:bg-warm-800 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { locale, setLocale, t } = useTranslation();

  const [event, setEvent] = useState<TangoEvent | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Registration state
  const [myRegistration, setMyRegistration] = useState<EventRegistration | null>(null);
  const [regCounts, setRegCounts] = useState<RegistrationCounts | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Report & Verify state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const suggestedLocale = event ? suggestLocaleForCountry(event.countryCode) : null;
  const showLocaleBanner =
    suggestedLocale !== null && suggestedLocale !== locale && !bannerDismissed;

  useEffect(() => {
    if (!id) return;
    loadEventDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEventDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventData, bookmarkData, countsData, regStatusData] = await Promise.all([
        eventsApi.getEvent(id as string),
        isAuthenticated
          ? bookmarksApi.checkBookmark(id as string).catch(() => ({ bookmarked: false }))
          : Promise.resolve({ bookmarked: false }),
        eventsApi.getRegistrationCounts(id as string).catch(() => null),
        isAuthenticated
          ? eventsApi.getMyRegistrationStatus(id as string).catch(() => ({ registration: null }))
          : Promise.resolve({ registration: null }),
      ]);

      setEvent(eventData);
      setIsBookmarked(bookmarkData.bookmarked);
      setRegCounts(countsData);
      setMyRegistration(regStatusData?.registration ?? null);

      // Load hotels in background after event data arrives
      if (eventData.latitude && eventData.longitude) {
        dealsApi
          .getHotelsNearEvent(id as string, eventData.latitude, eventData.longitude)
          .then(setHotels)
          .catch(() => void 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load event';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
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
    const shareData = {
      title: event.title,
      text: `${event.title} — ${event.venueName}, ${event.city}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => void 0);
      // Could show a toast here
    }
  };

  const handleViewMap = () => {
    if (!event) return;
    const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const canVerify = event && isAuthenticated && user && user.isAdmin === true && !event.isVerified;

  const handleVerify = async () => {
    if (!event) return;
    try {
      const updated = await eventsApi.verifyEvent(event.id);
      setEvent(updated);
    } catch {
      // Silent fail
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !reportReason || isReporting) return;
    setIsReporting(true);
    try {
      await eventsApi.reportEvent(event.id, {
        reason: reportReason,
        description: reportDescription || undefined,
      });
      setReportSuccess(true);
    } catch {
      // Silent fail
    } finally {
      setIsReporting(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (!event) return;
    setIsRegistering(true);
    try {
      const reg = await eventsApi.registerForEvent(event.id);
      setMyRegistration(reg);
      const counts = await eventsApi.getRegistrationCounts(event.id);
      setRegCounts(counts);
    } catch {
      // Silent fail
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event) return;
    try {
      const reg = await eventsApi.cancelRegistration(event.id);
      setMyRegistration(reg);
      const counts = await eventsApi.getRegistrationCounts(event.id);
      setRegCounts(counts);
    } catch {
      // Silent fail
    }
  };

  const isDeadlinePassed = event?.registrationDeadline
    ? new Date() > new Date(event.registrationDeadline)
    : false;
  const isFull = event?.maxParticipants != null && regCounts != null
    && regCounts.approved >= event.maxParticipants;
  const isOwnEvent = event && isAuthenticated && user && event.createdBy === user.id;

  const canDelete = event && isAuthenticated && user && (
    event.createdBy === user.id || user.isAdmin === true
  );

  const handleDelete = async () => {
    if (!event || isDeleting) return;
    setIsDeleting(true);
    try {
      await eventsApi.deleteEvent(event.id);
      router.push('/events');
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return <EventDetailSkeleton />;

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-primary-700 font-semibold text-lg mb-3">
          {error ?? 'Event not found'}
        </p>
        <button onClick={loadEventDetail} className="btn-primary mr-3">
          Try again
        </button>
        <Link href="/events" className="btn-secondary">
          Back to events
        </Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const typeStyle = EVENT_TYPE_STYLES[event.eventType] ?? {
    bg: 'bg-warm-500',
    text: 'text-white',
    heroBg: 'from-warm-700 to-warm-900',
    label: event.eventType,
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
  const startDate = new Date(event.startDatetime);
  const endDate = event.endDatetime ? new Date(event.endDatetime) : null;
  const rawImage = event.imageUrls?.[0] ?? null;
  const imageUrl = rawImage
    ? rawImage.startsWith('http') ? rawImage : `${API_BASE}${rawImage}`
    : null;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className={`relative bg-gradient-to-br ${typeStyle.heroBg} text-white overflow-hidden`}
        aria-label={`${event.title} hero`}
      >
        {imageUrl && (
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover opacity-25"
              priority
            />
          </div>
        )}

        <div className="relative z-10 page-container py-12 sm:py-16">
          {/* Back link */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white
                       text-sm mb-6 transition-colors"
            aria-label="Back to events"
          >
            <FaArrowLeft size={12} />
            {t.events.allEvents}
          </Link>

          {/* Type badge + AI badge + flag + verification */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                         bg-white/20 text-white"
            >
              {typeStyle.label}
            </span>
            {event.source === 'ai_crawl' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                               bg-blue-500/80 text-white">
                {t.events.aiSearch}
              </span>
            )}
            <CountryFlag code={event.countryCode} size={24} />
            {!event.isVerified ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                               bg-amber-500/80 text-white">
                {t.events.unverified}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                               bg-green-600/80 text-white">
                {t.events.verified}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3">
            {event.title}
          </h1>
          <p className="text-white/80 text-base">
            {event.venueName} &bull; {event.city}
          </p>

          {/* Capacity badge */}
          {event.maxParticipants && regCounts && (
            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1.5">
                <FaUsers size={11} />
                {t.events.spotsFilled.replace('{{n}}', String(regCounts.approved)).replace('{{max}}', String(event.maxParticipants))}
              </span>
              {isFull && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/80 text-white">
                  {t.events.eventFull}
                </span>
              )}
            </div>
          )}

          {/* Registration deadline */}
          {event.registrationDeadline && (
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isDeadlinePassed ? 'bg-red-500/80 text-white' : 'bg-white/20 text-white'
              }`}>
                {isDeadlinePassed
                  ? t.events.registrationDeadlinePassed
                  : `${t.events.registrationDeadline}: ${new Date(event.registrationDeadline).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                }
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Locale suggestion banner ─────────────────────────────── */}
      {showLocaleBanner && suggestedLocale && (
        <div className="bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800">
          <div className="page-container py-2.5 flex items-center justify-between gap-3 text-sm">
            <p className="text-primary-800 dark:text-primary-300">
              {t.events.thisEventIn}{' '}
              <span className="font-semibold inline-flex items-center gap-1"><CountryFlag code={event.countryCode} size={14} /> {event.countryCode}</span>.
              {' '}{t.events.switchTo}{' '}
              <span className="font-semibold">{LOCALE_LABELS[suggestedLocale]}</span>?
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setLocale(suggestedLocale)}
                className="px-3 py-1 rounded-lg bg-primary-700 text-white text-xs font-semibold
                           hover:bg-primary-600 transition-colors"
              >
                {t.events.switchTo} {LOCALE_LABELS[suggestedLocale]}
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="px-3 py-1 rounded-lg border border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400 text-xs
                           font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              >
                {t.events.dismiss}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unverified warning banner ──────────────────────────────── */}
      {!event.isVerified && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
          <div className="page-container py-2.5 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="font-medium">{t.events.unverifiedBanner}</span>
          </div>
        </div>
      )}

      {/* ── Action bar ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-warm-900 border-b border-warm-100 dark:border-warm-800 sticky top-16 z-20">
        <div className="page-container py-3 flex items-center gap-3 overflow-x-auto scrollbar-thin">
          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            disabled={isBookmarking}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this event'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        border transition-all flex-shrink-0
                        ${
                          isBookmarked
                            ? 'bg-primary-700 text-white border-primary-700'
                            : 'border-primary-700 text-primary-700 dark:text-primary-400 dark:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isBookmarked ? (
              <FaBookmark size={13} />
            ) : (
              <FaRegBookmark size={13} />
            )}
            {isBookmarked ? t.events.bookmarked : t.events.bookmark}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:border-primary-700
                       hover:text-primary-700 transition-all flex-shrink-0"
            aria-label="Share this event"
          >
            <FaShare size={13} />
            {t.events.share}
          </button>

          {/* View on Map */}
          {event.latitude && event.longitude && (
            <button
              onClick={handleViewMap}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:border-primary-700
                         hover:text-primary-700 transition-all flex-shrink-0"
              aria-label="View venue on Google Maps"
            >
              <FaMapMarkerAlt size={13} />
              {t.events.viewOnMap}
            </button>
          )}

          {/* External website */}
          {event.websiteUrl && (
            <a
              href={event.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:border-primary-700
                         hover:text-primary-700 transition-all flex-shrink-0"
            >
              <FaExternalLinkAlt size={11} />
              {t.events.officialSite}
            </a>
          )}

          {/* Join / Leave button */}
          {!isOwnEvent && (!myRegistration || myRegistration.status === 'cancelled') ? (
            <button
              onClick={handleRegister}
              disabled={isRegistering || isDeadlinePassed || isFull}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium
                         bg-primary-700 text-white hover:bg-primary-600
                         transition-all flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaUserPlus size={13} />
              {isRegistering ? t.common.loading : t.events.join}
            </button>
          ) : !isOwnEvent && myRegistration && myRegistration.status !== 'cancelled' ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <FaCheck size={10} />
                {t.events.joined}
              </span>
              <button
                onClick={handleCancelRegistration}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                {t.events.leaveEvent}
              </button>
            </div>
          ) : null}

          {/* Manage Registrations (creator) */}
          {isOwnEvent && (
            <Link
              href={`/events/${event.id}/registrations`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         border border-primary-700 dark:border-primary-500 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30
                         transition-all flex-shrink-0"
            >
              <FaUsers size={13} />
              {t.events.manageRegistrations}
            </Link>
          )}

          {/* Party Chat — visible to registered users and event creator */}
          {isAuthenticated && (
            isOwnEvent || (myRegistration && ['approved', 'pending', 'waitlisted'].includes(myRegistration.status))
          ) && (
            <Link
              href={`/events/${event.id}/chat`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         bg-primary-700 text-white hover:bg-primary-600
                         transition-all flex-shrink-0"
            >
              <FaComments size={13} />
              {t.events.partyChat}
            </Link>
          )}

          {/* Report */}
          <button
            onClick={() => {
              if (!isAuthenticated) { router.push('/auth/login'); return; }
              setShowReportModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:border-red-400
                       hover:text-red-500 dark:hover:text-red-400 transition-all flex-shrink-0"
            aria-label={t.events.report}
          >
            <FaFlag size={13} />
            {t.events.report}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: main info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Date & Time */}
            <InfoCard icon={<FaCalendarAlt size={16} />} label={t.events.startDate}>
              <p className="font-semibold">
                {startDate.toLocaleDateString(locale, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-warm-500 dark:text-warm-400 mt-0.5">
                {startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                {endDate && (
                  <>
                    {' — '}
                    {endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </>
                )}
              </p>
            </InfoCard>

            {/* Venue */}
            <InfoCard icon={<FaMapMarkerAlt size={16} />} label={t.events.venue}>
              <p className="font-semibold">{event.venueName}</p>
              {/* TangoEvent uses `address` (not venueAddress) */}
              {event.address && <p className="text-warm-500 dark:text-warm-400 mt-0.5">{event.address}</p>}
              <p className="text-warm-500 dark:text-warm-400 mt-0.5 flex items-center gap-1">
                {event.city}
                <CountryFlag code={event.countryCode} size={14} />
              </p>
            </InfoCard>

            {/* Price */}
            <InfoCard icon={<FaTicketAlt size={16} />} label={t.events.entryFee}>
              {event.entryFee && event.entryFee > 0 ? (
                <p className="font-semibold">
                  {event.currency ?? ''} {event.entryFee}
                </p>
              ) : (
                <p className="font-semibold text-green-600 dark:text-green-400">{t.events.free}</p>
              )}
            </InfoCard>

            {/* Description */}
            {event.description && (
              <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5">
                <p className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-3">
                  {t.events.aboutEvent}
                </p>
                <p className="text-warm-700 dark:text-warm-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Organizer */}
            {(event.organizerName || event.organizerContact) && (
              <div className="bg-warm-50 dark:bg-warm-800 rounded-xl border border-warm-100 dark:border-warm-700 p-4">
                <p className="text-[10px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wider mb-1">
                  {t.events.organizer}
                </p>
                {event.organizerName && (
                  <p className="text-warm-800 dark:text-warm-200 font-medium text-sm">{event.organizerName}</p>
                )}
                {event.organizerContact && (
                  <p className="text-warm-600 dark:text-warm-400 text-sm mt-0.5">{event.organizerContact}</p>
                )}
              </div>
            )}

            {/* Admin Verify Button */}
            {canVerify && (
              <button
                onClick={handleVerify}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all"
              >
                <FaCheck size={12} />
                {t.events.verifyEvent}
              </button>
            )}

            {/* Vote Bar */}
            <VoteBar
              eventId={event.id}
              onLoginRequired={() => router.push('/auth/login')}
            />

            {/* Delete Button */}
            {canDelete && (
              <div className="pt-2">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30
                               transition-all"
                    aria-label={t.events.deleteEvent}
                  >
                    <FaTrash size={12} />
                    {t.events.deleteEvent}
                  </button>
                ) : (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      {t.events.deleteConfirm}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium
                                   hover:bg-red-700 transition-colors disabled:opacity-60
                                   disabled:cursor-not-allowed"
                      >
                        {isDeleting ? t.common.loading : t.common.confirm}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg border border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400
                                   text-sm font-medium hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                      >
                        {t.common.back}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column: map placeholder + hotels */}
          <div className="space-y-4">
            {/* Map placeholder */}
            {event.latitude && event.longitude && (
              <div
                className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden
                           cursor-pointer group"
                onClick={handleViewMap}
                role="button"
                aria-label="View venue on map"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleViewMap()}
              >
                <div
                  className="h-48 bg-gradient-to-br from-green-50 dark:from-green-900/30 to-green-100 dark:to-green-900/20
                             flex flex-col items-center justify-center gap-3 relative
                             group-hover:from-green-100 dark:group-hover:from-green-900/40 group-hover:to-green-200 dark:group-hover:to-green-900/30
                             transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full bg-primary-700 flex items-center
                               justify-center shadow-lg"
                  >
                    <FaMapMarkerAlt className="text-white" size={20} />
                  </div>
                  <p className="text-warm-600 dark:text-warm-400 text-sm font-medium">
                    {event.venueName}
                  </p>
                  <p className="text-xs text-warm-400 dark:text-warm-500">{t.events.clickToOpenMaps}</p>
                  <div
                    className="absolute bottom-2 right-2 bg-white/80 dark:bg-warm-900/80 rounded px-2 py-0.5
                               text-[10px] text-warm-500 dark:text-warm-400 font-mono"
                  >
                    {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* Hotels Nearby */}
            {hotels.length > 0 && (
              <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5">
                <h2 className="text-sm font-bold text-warm-900 dark:text-warm-100 mb-1">{t.events.nearbyHotels}</h2>
                <p className="text-xs text-warm-400 dark:text-warm-500 mb-4">
                  {t.events.affiliateNote}
                </p>
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} bookLabel={t.events.book} />
                ))}
              </div>
            )}

            {/* Hotels empty state */}
            {hotels.length === 0 && event.latitude && event.longitude && (
              <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5">
                <h2 className="text-sm font-bold text-warm-900 dark:text-warm-100 mb-2">{t.events.nearbyHotels}</h2>
                <p className="text-xs text-warm-400 dark:text-warm-500 mb-3">
                  {t.events.noHotelsYet}
                </p>
                <a
                  href={`https://www.booking.com/searchresults.html?latitude=${event.latitude}&longitude=${event.longitude}&checkin=${new Date(event.startDatetime).toISOString().split('T')[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs w-full justify-center"
                >
                  {t.events.searchHotelsOnBooking}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Report Modal ─────────────────────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-warm-900 rounded-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-warm-950 dark:text-warm-100 mb-4">{t.events.reportEvent}</h3>
            {reportSuccess ? (
              <div>
                <p className="text-green-600 dark:text-green-400 mb-4">{t.events.reportSuccess}</p>
                <button
                  onClick={() => { setShowReportModal(false); setReportSuccess(false); setReportReason(''); setReportDescription(''); }}
                  className="btn-primary w-full justify-center"
                >
                  {t.common.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleReport}>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 dark:border-warm-700 px-4 py-2.5 text-sm bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-100
                             focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
                  required
                >
                  <option value="">{t.events.selectReportReason}</option>
                  <option value="spam">{t.events.reportReasonSpam}</option>
                  <option value="misleading">{t.events.reportReasonMisleading}</option>
                  <option value="duplicate">{t.events.reportReasonDuplicate}</option>
                  <option value="inappropriate">{t.events.reportReasonInappropriate}</option>
                  <option value="other">{t.events.reportReasonOther}</option>
                </select>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder={t.events.reportDescriptionPlaceholder}
                  className="mt-3 w-full rounded-lg border border-warm-200 dark:border-warm-700 px-4 py-2.5 text-sm
                             bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-100
                             focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
                             resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowReportModal(false); setReportReason(''); setReportDescription(''); }}
                    className="btn-secondary flex-1 justify-center"
                  >
                    {t.community.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!reportReason || isReporting}
                    className="btn-primary flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isReporting ? t.common.loading : t.events.submitReport}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
