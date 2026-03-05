'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaTimes, FaUsers } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { eventsApi, EventRegistration, TangoEvent, RegistrationCounts } from '@/lib/api/events';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';

const STATUS_FILTERS = ['', 'pending', 'approved', 'rejected', 'waitlisted', 'cancelled'] as const;

function RegistrationManagement() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation();

  const [event, setEvent] = useState<TangoEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<RegistrationCounts | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventData, regData, countsData] = await Promise.all([
        eventsApi.getEvent(id as string),
        eventsApi.getEventRegistrations(id as string, {
          status: statusFilter || undefined,
        }),
        eventsApi.getRegistrationCounts(id as string),
      ]);
      setEvent(eventData);
      setRegistrations(regData.items);
      setTotal(regData.total);
      setCounts(countsData);
    } catch {
      setError('Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (registrationId: string, status: 'approved' | 'rejected') => {
    try {
      await eventsApi.updateRegistrationStatus(id as string, registrationId, { status });
      loadData();
    } catch {
      // Silent fail
    }
  };

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/events/${id}`}
            className="flex items-center gap-2 text-warm-500 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 text-sm transition-colors"
          >
            <FaArrowLeft size={12} />
            {t.common.back}
          </Link>
          <span className="text-warm-300 dark:text-warm-600">/</span>
          <h1 className="text-lg font-bold text-warm-950 dark:text-warm-100">{t.events.manageRegistrations}</h1>
        </div>

        {/* Event summary + counts */}
        {event && counts && (
          <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 mb-6">
            <h2 className="font-bold text-warm-900 dark:text-warm-100 mb-2">{event.title}</h2>
            <div className="flex items-center gap-4 text-sm text-warm-600 dark:text-warm-400">
              <span className="flex items-center gap-1.5">
                <FaUsers size={12} />
                {counts.approved} {t.events.regStatus_approved}
              </span>
              <span>{counts.pending} {t.events.regStatus_pending}</span>
              <span>{counts.waitlisted} {t.events.regStatus_waitlisted}</span>
              {event.maxParticipants && (
                <span className="font-semibold text-primary-700 dark:text-primary-400">
                  / {event.maxParticipants} max
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                ${statusFilter === f
                  ? 'bg-primary-700 text-white'
                  : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-700'
                }`}
            >
              {f === '' ? 'All' : statusLabel(f)} {f === '' ? `(${total})` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-warm-400">{t.common.loading}</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 dark:text-red-400">{error}</div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12 text-warm-400">{t.events.noRegistrations}</div>
        ) : (
          <div className="space-y-3">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-4 flex items-center gap-4"
              >
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-warm-900 dark:text-warm-100">
                    {(reg as any).user?.nickname || reg.userId.slice(0, 8)}
                  </p>
                  {(reg as any).user?.email && (
                    <p className="text-xs text-warm-400">{(reg as any).user.email}</p>
                  )}
                  {reg.message && (
                    <p className="text-xs text-warm-500 dark:text-warm-400 mt-1 italic">&ldquo;{reg.message}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-warm-300 dark:text-warm-600 mt-1">
                    {formatDate(reg.createdAt, locale)}
                  </p>
                </div>

                {/* Status */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(reg.status)}`}>
                  {statusLabel(reg.status)}
                </span>

                {/* Actions */}
                {(reg.status === 'pending' || reg.status === 'waitlisted') && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(reg.id, 'approved')}
                      className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center
                                 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                      aria-label={t.events.approveRegistration}
                    >
                      <FaCheck size={12} />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(reg.id, 'rejected')}
                      className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center
                                 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      aria-label={t.events.rejectRegistration}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegistrationsPage() {
  return (
    <AuthGuard>
      <RegistrationManagement />
    </AuthGuard>
  );
}
