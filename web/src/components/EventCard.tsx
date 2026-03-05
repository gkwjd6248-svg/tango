'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDateShort } from '@/lib/utils';
import { CountryFlag } from '@/components/CountryFlag';
import { useTranslation } from '@/lib/i18n';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    eventType: string;
    venueName: string;
    city: string;
    countryCode: string;
    startDatetime: string;
    imageUrls?: string[];
    isVerified?: boolean;
    maxParticipants?: number;
    source?: string;
  };
}

const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  milonga: { bg: 'bg-primary-700', text: 'text-white', label: 'Milonga' },
  festival: { bg: 'bg-purple-700', text: 'text-white', label: 'Festival' },
  workshop: { bg: 'bg-blue-600', text: 'text-white', label: 'Workshop' },
  class: { bg: 'bg-green-600', text: 'text-white', label: 'Class' },
  practica: { bg: 'bg-amber-500', text: 'text-white', label: 'Practica' },
};

export function EventCard({ event }: EventCardProps) {
  const { locale, t } = useTranslation();
  const typeStyle = EVENT_TYPE_STYLES[event.eventType] ?? {
    bg: 'bg-gray-500',
    text: 'text-white',
    label: event.eventType,
  };

  const rawImage = event.imageUrls?.[0] ?? null;
  const imageUrl = rawImage
    ? rawImage.startsWith('http') ? rawImage : `${API_BASE}${rawImage}`
    : null;
  const dateStr = formatDateShort(event.startDatetime, locale);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-white dark:bg-warm-900 rounded-xl overflow-hidden shadow-sm border border-warm-100 dark:border-warm-800
                 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
      aria-label={`${event.title} — ${event.city}, ${event.countryCode}`}
    >
      {/* Image / Placeholder */}
      <div className="relative w-full h-44 bg-gradient-to-br from-primary-700 to-primary-900">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          /* Decorative placeholder with tango silhouette lines */
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-20 h-20 border-4 border-white rounded-full" />
            <div className="absolute w-10 h-10 border-2 border-accent-500 rounded-full" />
          </div>
        )}

        {/* Type badge overlaid on image */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`${typeStyle.bg} ${typeStyle.text} text-xs font-semibold px-2.5 py-1
                        rounded-full uppercase tracking-wide`}
          >
            {typeStyle.label}
          </span>
          {event.source === 'ai_crawl' && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
              {t.events.aiSearch}
            </span>
          )}
        </div>

        {/* Country flag overlaid top-right */}
        <div className="absolute top-3 right-3" aria-hidden="true">
          <CountryFlag code={event.countryCode} size={20} />
        </div>

        {/* Capacity badge */}
        {event.maxParticipants && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5
                             rounded-full backdrop-blur-sm">
              {event.maxParticipants} max
            </span>
          </div>
        )}

        {/* Verification badge */}
        {!event.isVerified && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5
                             rounded-full uppercase tracking-wide">
              {t.events.unverified}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3
          className="text-warm-950 dark:text-warm-100 font-bold text-base leading-snug mb-1 line-clamp-2
                     group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors"
        >
          {event.title}
        </h3>

        <p className="text-warm-500 dark:text-warm-400 text-sm mb-0.5 truncate">{event.venueName}</p>

        <p className="text-warm-400 dark:text-warm-500 text-xs mb-3 truncate flex items-center gap-1">
          {event.city}
          <CountryFlag code={event.countryCode} size={12} />
        </p>

        <p className="text-primary-700 dark:text-primary-400 text-xs font-semibold">{dateStr}</p>
      </div>
    </Link>
  );
}
