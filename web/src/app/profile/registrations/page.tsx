'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { eventsApi, EventRegistration } from '@/lib/api/events';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';

function MyRegistrations() {
  const { t, locale } = useTranslation();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    eventsApi.getMyRegistrations()
      .then((data) => {
        setRegistrations(data.items);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const statusLabel = (s: string) => {
    const key = `regStatus_${s}` as keyof typeof t.events;
    return (t.events[key] as string) || s;
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'waitlisted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled': return 'bg-warm-100 dark:bg-warm-800 text-warm-500 dark:text-warm-400';
      default: return 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300';
    }
  };

  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-warm-500 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 text-sm transition-colors"
          >
            <FaArrowLeft size={12} />
            {t.nav.profile}
          </Link>
          <span className="text-warm-300 dark:text-warm-600">/</span>
          <h1 className="text-lg font-bold text-warm-950 dark:text-warm-100">{t.events.myRegistrations}</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-warm-400">{t.common.loading}</div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16">
            <FaCalendarAlt size={32} className="mx-auto text-warm-200 dark:text-warm-700 mb-4" />
            <p className="text-warm-500 dark:text-warm-400 mb-2">{t.events.noRegistrations}</p>
            <Link href="/events" className="btn-primary inline-flex">
              {t.events.title}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/events/${reg.eventId}`}
                className="block bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-4
                           hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-warm-900 dark:text-warm-100 truncate">
                      {(reg as any).event?.title || `Event ${reg.eventId.slice(0, 8)}`}
                    </p>
                    {(reg as any).event?.city && (
                      <p className="text-xs text-warm-400 mt-0.5">
                        {(reg as any).event.city} &bull;{' '}
                        {(reg as any).event.startDatetime
                          ? formatDate((reg as any).event.startDatetime, locale)
                          : ''}
                      </p>
                    )}
                    <p className="text-[10px] text-warm-300 dark:text-warm-600 mt-1">
                      Registered {formatDate(reg.createdAt, locale)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${statusColor(reg.status)}`}>
                    {statusLabel(reg.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyRegistrationsPage() {
  return (
    <AuthGuard>
      <MyRegistrations />
    </AuthGuard>
  );
}
