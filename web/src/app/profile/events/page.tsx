'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUsers,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { eventsApi, TangoEvent, RegistrationCounts } from '@/lib/api/events';
import { useTranslation } from '@/lib/i18n';
import { formatDateShort } from '@/lib/utils';
import { CountryFlag } from '@/components/CountryFlag';

const EVENT_TYPE_COLORS: Record<string, string> = {
  milonga: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  festival: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  practica: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function MyEvents() {
  const { t, locale } = useTranslation();
  const [events, setEvents] = useState<TangoEvent[]>([]);
  const [countsMap, setCountsMap] = useState<Record<string, RegistrationCounts>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getMyEvents(1, 50);
      setEvents(data.items);

      // Load registration counts for each event in parallel
      const countsEntries = await Promise.all(
        data.items.map(async (ev) => {
          try {
            const counts = await eventsApi.getRegistrationCounts(ev.id);
            return [ev.id, counts] as const;
          } catch {
            return [ev.id, { approved: 0, pending: 0, waitlisted: 0, total: 0 }] as const;
          }
        }),
      );
      setCountsMap(Object.fromEntries(countsEntries));
    } catch {
      setError(t.common.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm(t.events.deleteConfirm)) return;
    setDeletingId(eventId);
    try {
      await eventsApi.deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {
      // Silent fail
    } finally {
      setDeletingId(null);
    }
  };

  const typeLabel = (type: string) => {
    const key = type as keyof typeof t.events;
    return (t.events[key] as string) || type;
  };

  return (
    <div className="page-container py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 text-warm-500 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 text-sm transition-colors"
            >
              <FaArrowLeft size={12} />
              {t.nav.profile}
            </Link>
            <span className="text-warm-300 dark:text-warm-600">/</span>
            <h1 className="text-lg font-bold text-warm-950 dark:text-warm-100">{t.events.myEvents}</h1>
          </div>
          <Link
            href="/events/create"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FaPlus size={10} />
            {t.events.createEvent}
          </Link>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 animate-pulse">
                <div className="h-4 bg-warm-100 dark:bg-warm-800 rounded w-2/3 mb-3" />
                <div className="h-3 bg-warm-50 dark:bg-warm-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-3">{error}</p>
            <button onClick={loadEvents} className="btn-secondary text-sm">
              {t.common.retry}
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <FaCalendarAlt size={32} className="mx-auto text-warm-200 dark:text-warm-700 mb-4" />
            <p className="text-warm-500 dark:text-warm-400 mb-2">{t.events.noMyEvents}</p>
            <Link href="/events/create" className="btn-primary inline-flex items-center gap-2 mt-3">
              <FaPlus size={10} />
              {t.events.createFirstEvent}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const counts = countsMap[event.id];
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 hover:shadow-md transition-all"
                >
                  {/* Top row: title + type badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-semibold text-warm-900 dark:text-warm-100 hover:text-primary-700 dark:hover:text-primary-400 transition-colors truncate"
                        >
                          {event.title}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${EVENT_TYPE_COLORS[event.eventType] || 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400'}`}>
                          {typeLabel(event.eventType)}
                        </span>
                        {event.isVerified ? (
                          <FaCheckCircle size={12} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <FaExclamationTriangle size={12} className="text-amber-400 flex-shrink-0" title={t.events.unverified} />
                        )}
                      </div>
                      <p className="text-xs text-warm-400 mt-1 flex items-center gap-1">
                        <CountryFlag code={event.countryCode} size={12} />
                        {event.city} &bull; {formatDateShort(event.startDatetime, locale)}
                      </p>
                    </div>
                  </div>

                  {/* Counts + Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-50 dark:border-warm-800">
                    {/* Registration counts */}
                    <div className="flex items-center gap-4 text-xs text-warm-500 dark:text-warm-400">
                      <span className="flex items-center gap-1.5">
                        <FaUsers size={11} />
                        {counts ? (
                          <>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {(t.events.approvedCount as string).replace('{{n}}', String(counts.approved))}
                            </span>
                            <span className="text-warm-300 dark:text-warm-600">/</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {(t.events.pendingCount as string).replace('{{n}}', String(counts.pending))}
                            </span>
                          </>
                        ) : (
                          '...'
                        )}
                      </span>
                      {event.maxParticipants && (
                        <span className="text-warm-400">
                          max {event.maxParticipants}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events/${event.id}/registrations`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400
                                   hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        {t.events.manageRegistrations}
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="p-2 rounded-lg text-warm-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors
                                   disabled:opacity-50"
                        aria-label={t.events.deleteEvent}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyEventsPage() {
  return (
    <AuthGuard>
      <MyEvents />
    </AuthGuard>
  );
}
