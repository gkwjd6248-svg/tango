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
} from 'react-icons/fa';
import { eventsApi, TangoEvent } from '@/lib/api/events';
import { bookmarksApi } from '@/lib/api/bookmarks';
import { dealsApi, Hotel } from '@/lib/api/deals';
import { useAuthStore } from '@/store/useAuthStore';
import { countryCodeToFlag, formatDate } from '@/lib/utils';

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
    <div className="bg-white rounded-xl border border-warm-100 p-5 flex gap-4">
      <div
        className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center
                   flex-shrink-0 text-primary-700"
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-warm-900 text-sm leading-snug">{children}</div>
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <div
      className="flex items-center gap-4 py-4 border-b border-warm-100
                 last:border-0"
    >
      {/* Hotel image or placeholder */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100">
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
        <p className="font-semibold text-sm text-warm-900 truncate">{hotel.name}</p>
        <p className="text-xs text-warm-400 truncate">{hotel.address}</p>

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
            <span className="text-xs text-warm-400 ml-2">
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
        <p className="text-primary-700 font-bold text-sm">
          {hotel.currency} {hotel.price.toFixed(0)}
        </p>
        <span
          className="inline-block mt-1 px-3 py-1.5 rounded-lg bg-primary-700 text-white
                     text-xs font-semibold hover:bg-primary-600 transition-colors"
        >
          Book
        </span>
      </a>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 sm:h-80 bg-gray-200" />
      <div className="page-container py-8 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [event, setEvent] = useState<TangoEvent | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadEventDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEventDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventData, bookmarkData] = await Promise.all([
        eventsApi.getEvent(id as string),
        isAuthenticated
          ? bookmarksApi.checkBookmark(id as string).catch(() => ({ bookmarked: false }))
          : Promise.resolve({ bookmarked: false }),
      ]);

      setEvent(eventData);
      setIsBookmarked(bookmarkData.bookmarked);

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

  const flag = countryCodeToFlag(event.countryCode);
  const startDate = new Date(event.startDatetime);
  const endDate = event.endDatetime ? new Date(event.endDatetime) : null;
  const imageUrl = event.imageUrls?.[0] ?? null;

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
            All events
          </Link>

          {/* Type badge + flag */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                         bg-white/20 text-white"
            >
              {typeStyle.label}
            </span>
            {flag && (
              <span className="text-2xl" aria-label={event.countryCode}>
                {flag}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3">
            {event.title}
          </h1>
          <p className="text-white/80 text-base">
            {event.venueName} &bull; {event.city}
          </p>
        </div>
      </section>

      {/* ── Action bar ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-warm-100 sticky top-16 z-20">
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
                            : 'border-primary-700 text-primary-700 hover:bg-primary-50'
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isBookmarked ? (
              <FaBookmark size={13} />
            ) : (
              <FaRegBookmark size={13} />
            )}
            {isBookmarked ? 'Saved' : 'Save event'}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       border border-warm-200 text-warm-700 hover:border-primary-700
                       hover:text-primary-700 transition-all flex-shrink-0"
            aria-label="Share this event"
          >
            <FaShare size={13} />
            Share
          </button>

          {/* View on Map */}
          {event.latitude && event.longitude && (
            <button
              onClick={handleViewMap}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         border border-warm-200 text-warm-700 hover:border-primary-700
                         hover:text-primary-700 transition-all flex-shrink-0"
              aria-label="View venue on Google Maps"
            >
              <FaMapMarkerAlt size={13} />
              View on map
            </button>
          )}

          {/* External website */}
          {event.websiteUrl && (
            <a
              href={event.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         border border-warm-200 text-warm-700 hover:border-primary-700
                         hover:text-primary-700 transition-all flex-shrink-0"
            >
              <FaExternalLinkAlt size={11} />
              Official site
            </a>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: main info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Date & Time */}
            <InfoCard icon={<FaCalendarAlt size={16} />} label="Date & Time">
              <p className="font-semibold">
                {startDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-warm-500 mt-0.5">
                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {endDate && (
                  <>
                    {' — '}
                    {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </>
                )}
              </p>
            </InfoCard>

            {/* Venue */}
            <InfoCard icon={<FaMapMarkerAlt size={16} />} label="Venue">
              <p className="font-semibold">{event.venueName}</p>
              {/* TangoEvent uses `address` (not venueAddress) */}
              {event.address && <p className="text-warm-500 mt-0.5">{event.address}</p>}
              <p className="text-warm-500 mt-0.5">
                {event.city}
                {flag && <span className="ml-1">{flag}</span>}
              </p>
            </InfoCard>

            {/* Price */}
            <InfoCard icon={<FaTicketAlt size={16} />} label="Entry Fee">
              {event.entryFee && event.entryFee > 0 ? (
                <p className="font-semibold">
                  {event.currency ?? ''} {event.entryFee}
                </p>
              ) : (
                <p className="font-semibold text-green-600">Free entry</p>
              )}
            </InfoCard>

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-xl border border-warm-100 p-5">
                <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wider mb-3">
                  About this event
                </p>
                <p className="text-warm-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Organizer */}
            {event.organizerName && (
              <div className="bg-warm-50 rounded-xl border border-warm-100 p-4">
                <p className="text-[10px] font-bold text-warm-500 uppercase tracking-wider mb-1">
                  Organizer
                </p>
                <p className="text-warm-800 font-medium text-sm">{event.organizerName}</p>
              </div>
            )}
          </div>

          {/* Right column: map placeholder + hotels */}
          <div className="space-y-4">
            {/* Map placeholder */}
            {event.latitude && event.longitude && (
              <div
                className="bg-white rounded-xl border border-warm-100 overflow-hidden
                           cursor-pointer group"
                onClick={handleViewMap}
                role="button"
                aria-label="View venue on map"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleViewMap()}
              >
                <div
                  className="h-48 bg-gradient-to-br from-green-50 to-green-100
                             flex flex-col items-center justify-center gap-3 relative
                             group-hover:from-green-100 group-hover:to-green-200
                             transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full bg-primary-700 flex items-center
                               justify-center shadow-lg"
                  >
                    <FaMapMarkerAlt className="text-white" size={20} />
                  </div>
                  <p className="text-warm-600 text-sm font-medium">
                    {event.venueName}
                  </p>
                  <p className="text-xs text-warm-400">Click to open in Maps</p>
                  <div
                    className="absolute bottom-2 right-2 bg-white/80 rounded px-2 py-0.5
                               text-[10px] text-warm-500 font-mono"
                  >
                    {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* Hotels Nearby */}
            {hotels.length > 0 && (
              <div className="bg-white rounded-xl border border-warm-100 p-5">
                <h2 className="text-sm font-bold text-warm-900 mb-1">Hotels Nearby</h2>
                <p className="text-xs text-warm-400 mb-4">
                  Affiliate links — booking supports this platform
                </p>
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
