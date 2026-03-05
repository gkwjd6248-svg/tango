'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaSearch, FaFilter, FaTimes, FaPlus } from 'react-icons/fa';
import { EventCard } from '@/components/EventCard';
import { EventGridSkeleton } from '@/components/EventCardSkeleton';
import { useEventsStore } from '@/store/useEventsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n';

// ─── Types & constants ────────────────────────────────────────────────────────

type EventTypeFilter =
  | 'all'
  | 'milonga'
  | 'festival'
  | 'workshop'
  | 'class'
  | 'practica';

// Country codes for building localized options
const COUNTRY_CODES = ['AR', 'KR', 'JP', 'DE', 'FR', 'IT', 'ES', 'US', 'GB', 'FI'] as const;

const COUNTRY_KEY_MAP: Record<string, string> = {
  AR: 'countryAR', KR: 'countryKR', JP: 'countryJP', DE: 'countryDE',
  FR: 'countryFR', IT: 'countryIT', ES: 'countryES', US: 'countryUS',
  GB: 'countryGB', FI: 'countryFI',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventsPage() {
  return (
    <Suspense fallback={<EventGridSkeleton count={9} />}>
      <EventsContent />
    </Suspense>
  );
}

function EventsContent() {
  const {
    events,
    isLoading,
    isLoadingMore,
    error,
    total,
    page,
    totalPages,
    fetchEvents,
    loadMore,
  } = useEventsStore();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  const eventTypeOptions: { value: EventTypeFilter; label: string }[] = [
    { value: 'all', label: t.events.all },
    { value: 'milonga', label: t.events.milonga },
    { value: 'festival', label: t.events.festival },
    { value: 'workshop', label: t.events.workshop },
    { value: 'class', label: t.events.class },
    { value: 'practica', label: t.events.practica },
  ];

  const countryOptions = [
    { code: '', label: t.events.allCountries },
    ...COUNTRY_CODES.map((code) => ({
      code,
      label: (t.events as Record<string, string>)[COUNTRY_KEY_MAP[code]] ?? code,
    })),
  ];

  const searchParams = useSearchParams();

  // Read initial country from URL query param (e.g. /events?country=AR)
  const initialCountry = searchParams.get('country') ?? '';

  // Local filter state — applied on search or pill click
  const [cityInput, setCityInput] = useState('');
  const [countryCode, setCountryCode] = useState(initialCountry);
  const [eventType, setEventType] = useState<EventTypeFilter>('all');

  // Initial load on mount — apply URL country filter if present
  useEffect(() => {
    fetchEvents({
      countryCode: initialCountry || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(
    (overrides?: Partial<{ city: string; country: string; type: EventTypeFilter }>) => {
      const city = overrides?.city ?? cityInput;
      const country = overrides?.country ?? countryCode;
      const type = overrides?.type ?? eventType;
      fetchEvents({
        city: city.trim() || undefined,
        countryCode: country || undefined,
        eventType: type === 'all' ? undefined : type,
      });
    },
    [cityInput, countryCode, eventType, fetchEvents],
  );

  const handleSearch = () => applyFilters();

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyFilters();
  };

  const handleEventTypeChange = (type: EventTypeFilter) => {
    setEventType(type);
    applyFilters({ type });
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    applyFilters({ country: code });
  };

  const clearFilters = () => {
    setCityInput('');
    setCountryCode('');
    setEventType('all');
    fetchEvents({});
  };

  const hasActiveFilters = cityInput.trim() !== '' || countryCode !== '' || eventType !== 'all';
  const hasMore = page < totalPages;

  return (
    <>
      {/* ── Hero / Search ──────────────────────────────────────────── */}
      <section
        className="relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900
                   text-white py-14 sm:py-20 overflow-hidden"
        aria-label="Event search"
      >
        {/* Decorative background blobs */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-80 h-80
                     rounded-full bg-accent-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64
                     rounded-full bg-white/5 blur-2xl"
          aria-hidden="true"
        />

        <div className="page-container relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-2">
            {t.events.searchTitle}
            <span className="block text-accent-400">{t.events.searchTitleHighlight}</span>
          </h1>
          <p className="text-primary-200 text-sm sm:text-base mb-8 max-w-lg">
            {t.events.searchSubtitle}
          </p>

          {/* Create event CTA — visible to authenticated users */}
          {isAuthenticated && (
            <div className="mb-5">
              <Link
                href="/events/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                           bg-accent-500 text-warm-950 font-semibold text-sm
                           hover:bg-accent-400 active:bg-accent-600
                           transition-colors"
                aria-label={t.events.createEvent}
              >
                <FaPlus size={12} />
                {t.events.createEvent}
              </Link>
            </div>
          )}

          {/* Search controls */}
          <div
            className="flex flex-col sm:flex-row gap-3 max-w-2xl"
            role="search"
            aria-label="Filter events"
          >
            {/* City search */}
            <div className="relative flex-1">
              <FaSearch
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-300"
                size={13}
                aria-hidden="true"
              />
              <input
                type="search"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={handleCityKeyDown}
                placeholder={t.events.cityPlaceholder}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20
                           text-white placeholder:text-primary-300
                           focus:outline-none focus:ring-2 focus:ring-accent-400/60
                           focus:border-accent-400 transition-all"
                aria-label="Search by city"
              />
            </div>

            {/* Country dropdown */}
            <select
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white
                         focus:outline-none focus:ring-2 focus:ring-accent-400/60
                         focus:border-accent-400 transition-all cursor-pointer"
              aria-label="Filter by country"
            >
              {countryOptions.map(({ code, label }) => (
                <option key={code} value={code} className="bg-primary-800 text-white">
                  {label}
                </option>
              ))}
            </select>

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                         bg-accent-500 text-warm-950 font-semibold
                         hover:bg-accent-400 active:bg-accent-600
                         transition-colors flex-shrink-0"
              aria-label="Apply search filters"
            >
              <FaFilter size={13} />
              {t.events.search}
            </button>
          </div>
        </div>
      </section>

      {/* ── Type Filter Pills ─────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white dark:bg-warm-900 border-b border-warm-100 dark:border-warm-800 shadow-sm">
        <div className="page-container py-3">
          <div
            className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-0.5"
            role="group"
            aria-label="Filter by event type"
          >
            {eventTypeOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleEventTypeChange(value)}
                aria-pressed={eventType === value}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium
                            border transition-all duration-150
                            ${
                              eventType === value
                                ? 'bg-primary-700 text-white border-primary-700'
                                : 'bg-white dark:bg-warm-800 text-warm-700 dark:text-warm-300 border-warm-200 dark:border-warm-700 hover:border-primary-700 hover:text-primary-700'
                            }`}
              >
                {label}
              </button>
            ))}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full
                           text-sm font-medium border border-warm-200 dark:border-warm-700 text-warm-500 dark:text-warm-400
                           hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-all ml-2"
                aria-label="Clear all filters"
              >
                <FaTimes size={10} />
                {t.events.clearFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Events Grid ───────────────────────────────────────────── */}
      <section className="page-container py-8" aria-live="polite" aria-label="Events">
        {/* Result meta */}
        {!isLoading && !error && (
          <p className="text-sm text-warm-500 dark:text-warm-400 mb-5">
            {total === 0
              ? t.events.noEventsFound
              : t.events.showingResults.replace('{{n}}', String(events.length)).replace('{{total}}', String(total))}
          </p>
        )}

        {/* Loading skeleton */}
        {isLoading && <EventGridSkeleton count={9} />}

        {/* Error */}
        {!isLoading && error && (
          <div className="text-center py-20">
            <p className="text-primary-700 font-semibold text-lg mb-2">
              {t.events.failedToLoad}
            </p>
            <p className="text-warm-400 dark:text-warm-500 text-sm mb-6">{error}</p>
            <button onClick={() => fetchEvents({})} className="btn-primary">
              {t.common.retry}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && events.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-5"
              aria-hidden="true"
            >
              <span className="text-4xl select-none">💃</span>
            </div>
            <h2 className="text-warm-700 dark:text-warm-300 font-semibold text-xl mb-2">{t.events.noEventsFound}</h2>
            <p className="text-warm-400 dark:text-warm-500 text-sm max-w-xs">
              {t.events.tryAdjusting}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary mt-5">
                {t.events.clearFilters}
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Load More */}
        {!isLoading && !error && hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="btn-secondary px-8 py-3 min-w-[160px]"
              aria-label="Load more events"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t.common.loading}
                </span>
              ) : (
                t.events.loadMoreEvents
              )}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
