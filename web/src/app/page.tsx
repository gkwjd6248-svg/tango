'use client';

/**
 * Home — 3D interactive globe landing page.
 *
 * Architecture:
 * - Server component shell is not possible here because we need client-side
 *   state (event counts, i18n). The page is therefore a Client Component.
 * - The Globe itself is dynamically imported with ssr: false to avoid WebGL
 *   errors during server-side rendering.
 * - Event counts per country are fetched once on mount from the events API.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { eventsApi } from '@/lib/api/events';
import { CountryFlag } from '@/components/CountryFlag';
import type { CountryEventCount } from '@/components/TangoGlobe';

// ---------------------------------------------------------------------------
// Dynamic import — SSR disabled because react-globe.gl needs browser WebGL
// ---------------------------------------------------------------------------

const TangoGlobe = dynamic(() => import('@/components/TangoGlobe'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full flex items-center justify-center rounded-3xl"
      style={{
        height: 'clamp(320px, 60vh, 660px)',
        background: 'radial-gradient(circle, rgba(42,0,0,0.5) 0%, transparent 70%)',
      }}
      aria-label="Loading globe"
      role="img"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-full border-2 border-accent-500/40 border-t-accent-500 animate-spin"
          aria-hidden="true"
        />
        <span className="text-warm-400 dark:text-warm-500 text-sm">Loading globe...</span>
      </div>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Country meta — full names and flag emoji for the event legend
// ---------------------------------------------------------------------------

const COUNTRY_META: Record<string, string> = {
  AR: 'Argentina',
  JP: 'Japan',
  KR: 'South Korea',
  TR: 'Turkey',
  DE: 'Germany',
  FR: 'France',
  US: 'United States',
  MX: 'Mexico',
  IT: 'Italy',
  ES: 'Spain',
  GB: 'United Kingdom',
  FI: 'Finland',
  NL: 'Netherlands',
  PL: 'Poland',
  PT: 'Portugal',
  BG: 'Bulgaria',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single stat pill in the stats bar */
function StatPill({ value, label }: { value: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl sm:text-3xl font-bold text-accent-400 tabular-nums">
        {value}
      </span>
      {label && (
        <span className="text-xs text-warm-400 uppercase tracking-wider">{label}</span>
      )}
    </div>
  );
}

/** Country legend card — links to filtered events page */
function CountryCard({
  code,
  count,
}: {
  code: string;
  count: number;
}) {
  const name = COUNTRY_META[code];
  if (!name) return null;

  return (
    <Link
      href={`/events?country=${code}`}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg
                 bg-primary-900/60 border border-primary-800/50
                 hover:border-accent-500/40 hover:bg-primary-800/60
                 transition-all duration-150 group"
      aria-label={`${name}: ${count} events`}
    >
      <CountryFlag code={code} size={20} />
      <div className="min-w-0">
        <div className="text-xs font-medium text-warm-200 truncate group-hover:text-accent-300 transition-colors">
          {name}
        </div>
        <div className="text-xs text-warm-500">
          {count} event{count !== 1 ? 's' : ''}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { t } = useTranslation();

  const [eventCounts, setEventCounts] = useState<CountryEventCount[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Measure the globe container so we can pass exact pixel dimensions to the canvas
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const [globeDimensions, setGlobeDimensions] = useState({ width: 800, height: 500 });

  // Fetch aggregate event counts per country on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      try {
        // Fetch all events with a generous limit to count per country.
        // In a real app this would be a dedicated /events/stats endpoint.
        const data = await eventsApi.getEvents({ limit: 200, page: 1 });
        if (cancelled) return;

        // Aggregate by country code
        const counts = new Map<string, number>();
        for (const event of data.items) {
          const code = event.countryCode?.toUpperCase();
          if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
        }

        const result: CountryEventCount[] = Array.from(counts.entries()).map(
          ([countryCode, count]) => ({ countryCode, count }),
        );

        setEventCounts(result);
        setTotalEvents(data.total);
      } catch {
        // Non-critical: the globe still renders; just without highlights
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  // Track globe container size for responsive canvas dimensions
  useEffect(() => {
    const el = globeContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setGlobeDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(el);
    setGlobeDimensions({
      width: Math.floor(el.clientWidth),
      height: Math.floor(el.clientHeight),
    });
    return () => observer.disconnect();
  }, []);

  const activeCountryCodes = eventCounts
    .filter((ec) => COUNTRY_META[ec.countryCode])
    .sort((a, b) => b.count - a.count);

  const countryCount = activeCountryCodes.length;
  const globeHeight = 'clamp(320px, 60vh, 660px)';

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, #2A0000 0%, #1A0000 40%, #0d0a06 100%)',
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Hero section                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="page-container pt-8 pb-4 sm:pt-12 sm:pb-6 text-center">
        {/* Decorative diamond icon */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                     bg-primary-800/60 border border-primary-700/40
                     text-accent-400 text-sm font-medium mb-6"
          aria-hidden="true"
        >
          <span className="text-accent-400 text-lg">♦</span>
          <span className="uppercase tracking-wider text-xs">Tango Community</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto mb-4">
          {t.home.title}
        </h1>

        <p className="text-warm-400 text-base sm:text-lg max-w-xl mx-auto mb-3">
          {t.home.subtitle}
        </p>

        <p className="text-warm-600 dark:text-warm-400 text-sm">
          {t.home.clickCountry}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Globe                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="w-full px-0 sm:px-4 flex items-center justify-center"
        aria-label="Interactive 3D globe showing countries with tango events"
      >
        <div
          ref={globeContainerRef}
          className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden"
          style={{ height: globeHeight }}
        >
          <TangoGlobe
            eventCounts={eventCounts}
            width={globeDimensions.width || undefined}
            height={globeDimensions.height || 500}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stats bar                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="page-container py-6 sm:py-8">
        <div
          className="flex items-center justify-center gap-8 sm:gap-16
                     py-5 px-6 rounded-2xl
                     bg-primary-900/50 border border-primary-800/40
                     max-w-sm mx-auto sm:max-w-md"
        >
          {!loading ? (
            <>
              <StatPill
                value={String(totalEvents || eventCounts.reduce((s, e) => s + e.count, 0))}
                label={t.home.eventsLabel}
              />
              <div className="w-px h-10 bg-primary-700/50" aria-hidden="true" />
              <StatPill
                value={String(countryCount)}
                label={t.home.countriesLabel}
              />
            </>
          ) : (
            <div className="flex gap-8 sm:gap-16">
              {[0, 1].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="h-8 w-12 bg-primary-800/60 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-primary-800/40 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Country legend                                                       */}
      {/* ------------------------------------------------------------------ */}
      {activeCountryCodes.length > 0 && (
        <section className="page-container pb-6 sm:pb-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wider text-center mb-4">
              {t.home.clickCountry}
            </h2>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {activeCountryCodes.map((ec) => (
                <CountryCard key={ec.countryCode} code={ec.countryCode} count={ec.count} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Quick navigation CTA buttons                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="page-container pb-12 sm:pb-16">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2
                       w-full sm:w-auto px-7 py-3 rounded-xl
                       bg-accent-500 hover:bg-accent-400 active:bg-accent-600
                       text-warm-950 font-semibold text-sm
                       transition-colors duration-150 shadow-lg shadow-accent-600/20"
          >
            <span aria-hidden="true">♦</span>
            {t.home.browseAll}
          </Link>

          <Link
            href="/community"
            className="inline-flex items-center justify-center gap-2
                       w-full sm:w-auto px-7 py-3 rounded-xl
                       bg-primary-800/60 hover:bg-primary-700/60
                       border border-primary-700/50 hover:border-primary-600/60
                       text-warm-200 font-medium text-sm
                       transition-colors duration-150"
          >
            {t.home.community}
          </Link>

          <Link
            href="/deals"
            className="inline-flex items-center justify-center gap-2
                       w-full sm:w-auto px-7 py-3 rounded-xl
                       bg-primary-800/60 hover:bg-primary-700/60
                       border border-primary-700/50 hover:border-primary-600/60
                       text-warm-200 font-medium text-sm
                       transition-colors duration-150"
          >
            {t.home.deals}
          </Link>
        </div>

      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Color-legend note                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="page-container pb-8 sm:pb-12">
        <div className="max-w-md mx-auto flex items-center justify-center gap-6 text-xs text-warm-600 dark:text-warm-400">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: '#D4A017' }}
              aria-hidden="true"
            />
            <span>Has tango events</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: 'rgba(63,51,24,0.6)' }}
              aria-hidden="true"
            />
            <span>No events yet</span>
          </div>
        </div>
      </section>
    </div>
  );
}
