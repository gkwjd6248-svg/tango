'use client';

import Link from 'next/link';
import Image from 'next/image';
import { countryCodeToFlag, formatDateShort } from '@/lib/utils';

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
  };
}

const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  milonga: { bg: 'bg-[#8B0000]', text: 'text-white', label: 'Milonga' },
  festival: { bg: 'bg-purple-700', text: 'text-white', label: 'Festival' },
  workshop: { bg: 'bg-blue-600', text: 'text-white', label: 'Workshop' },
  class: { bg: 'bg-green-600', text: 'text-white', label: 'Class' },
  practica: { bg: 'bg-amber-500', text: 'text-white', label: 'Practica' },
};

export function EventCard({ event }: EventCardProps) {
  const typeStyle = EVENT_TYPE_STYLES[event.eventType] ?? {
    bg: 'bg-gray-500',
    text: 'text-white',
    label: event.eventType,
  };

  const imageUrl = event.imageUrls?.[0] ?? null;
  const flag = countryCodeToFlag(event.countryCode);
  const dateStr = formatDateShort(event.startDatetime);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100
                 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
      aria-label={`${event.title} — ${event.city}, ${event.countryCode}`}
    >
      {/* Image / Placeholder */}
      <div className="relative w-full h-44 bg-gradient-to-br from-[#8B0000] to-[#5a0000]">
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
            <div className="absolute w-10 h-10 border-2 border-[#D4A017] rounded-full" />
          </div>
        )}

        {/* Type badge overlaid on image */}
        <div className="absolute top-3 left-3">
          <span
            className={`${typeStyle.bg} ${typeStyle.text} text-xs font-semibold px-2.5 py-1
                        rounded-full uppercase tracking-wide`}
          >
            {typeStyle.label}
          </span>
        </div>

        {/* Country flag overlaid top-right */}
        <div className="absolute top-3 right-3 text-xl leading-none" aria-hidden="true">
          {flag}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3
          className="text-[#1A1A1A] font-bold text-base leading-snug mb-1 line-clamp-2
                     group-hover:text-[#8B0000] transition-colors"
        >
          {event.title}
        </h3>

        <p className="text-gray-500 text-sm mb-0.5 truncate">{event.venueName}</p>

        <p className="text-gray-400 text-xs mb-3 truncate">
          {event.city}
          {flag && (
            <span className="ml-1" aria-hidden="true">
              {flag}
            </span>
          )}
        </p>

        <p className="text-[#8B0000] text-xs font-semibold">{dateStr}</p>
      </div>
    </Link>
  );
}
