'use client';

import { useEffect } from 'react';
import { useDealsStore } from '@/store/useDealsStore';
import { DealCard } from '@/components/DealCard';
import { useTranslation } from '@/lib/i18n';

interface FilterOption {
  key: string;
  labelKey: keyof ReturnType<typeof useTranslation>['t']['deals'];
}

/** Country filter options. 'all' sends no country param; 'US'/'KR' send their code. */
const COUNTRY_OPTIONS: FilterOption[] = [
  { key: 'all', labelKey: 'allCountries' },
  { key: 'US',  labelKey: 'us' },
  { key: 'KR',  labelKey: 'korea' },
  { key: 'GLOBAL', labelKey: 'global' },
];

/** Category filter options. */
const CATEGORY_OPTIONS: FilterOption[] = [
  { key: 'all',         labelKey: 'allCategories' },
  { key: 'shoes',       labelKey: 'shoes' },
  { key: 'clothing',    labelKey: 'clothing' },
  { key: 'accessories', labelKey: 'accessories' },
  { key: 'music',       labelKey: 'music' },
];

// Loading skeleton for deal cards
function DealSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-44 bg-warm-100 dark:bg-warm-800 rounded-t-xl" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-warm-100 dark:bg-warm-800 rounded w-4/5" />
        <div className="h-3 bg-warm-100 dark:bg-warm-800 rounded w-3/5" />
        <div className="h-4 bg-warm-100 dark:bg-warm-800 rounded w-2/5" />
        <div className="h-8 bg-warm-100 dark:bg-warm-800 rounded mt-4" />
      </div>
    </div>
  );
}

export default function DealsPage() {
  const { t } = useTranslation();

  const {
    deals,
    isLoading,
    isLoadingMore,
    error,
    selectedCategory,
    selectedCountry,
    hasMore,
    fetchDeals,
    loadMore,
    setCategory,
    setCountry,
  } = useDealsStore();

  useEffect(() => {
    fetchDeals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-warm-50 dark:bg-[#1A1410]">
      {/* Sticky page header with filter rows */}
      <div className="bg-white dark:bg-warm-900 border-b border-warm-100 dark:border-warm-800 sticky top-0 z-20">
        <div className="page-container py-4 space-y-3">
          <h1 className="text-xl font-bold text-warm-950 dark:text-warm-100">{t.deals.title}</h1>

          {/* Country filter — prominent tab-style row */}
          <div>
            <p className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-2">
              {t.deals.filterByCountry}
            </p>
            <div
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
              role="tablist"
              aria-label={t.deals.filterByCountry}
            >
              {COUNTRY_OPTIONS.map((opt) => {
                const isActive = selectedCountry === opt.key;
                return (
                  <button
                    key={opt.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setCountry(opt.key)}
                    className={`shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-colors border
                      ${
                        isActive
                          ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                          : 'bg-white dark:bg-warm-800 text-warm-700 dark:text-warm-300 border-warm-200 dark:border-warm-700 hover:border-primary-700 hover:text-primary-700'
                      }`}
                  >
                    {t.deals[opt.labelKey] as string}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category filter chips — secondary row */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
            role="tablist"
            aria-label="Filter deals by category"
          >
            {CATEGORY_OPTIONS.map((opt) => {
              const isActive = selectedCategory === opt.key;
              return (
                <button
                  key={opt.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCategory(opt.key)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary-700 text-white shadow-sm'
                        : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
                    }`}
                >
                  {t.deals[opt.labelKey] as string}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="page-container py-6">
        {/* Initial loading: show skeleton grid */}
        {isLoading && deals.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <DealSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && deals.length === 0 && (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <p className="text-primary-700 font-semibold text-lg mb-4">{error}</p>
            <button onClick={fetchDeals} className="btn-primary">
              {t.common.retry}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4" aria-hidden="true">🏷️</div>
            <p className="text-warm-500 dark:text-warm-400 text-lg font-semibold">{t.deals.noDeals}</p>
            <p className="text-warm-400 dark:text-warm-500 text-sm mt-1">{t.deals.noDealsSubtext}</p>
          </div>
        )}

        {/* Deal grid */}
        {deals.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}

              {/* Load-more skeleton appended at end of grid */}
              {isLoadingMore &&
                Array.from({ length: 4 }).map((_, i) => <DealSkeleton key={`skel-more-${i}`} />)}
            </div>

            {/* Load more button */}
            {hasMore && !isLoadingMore && (
              <div className="flex justify-center mt-8">
                <button onClick={loadMore} className="btn-secondary px-10">
                  {t.deals.loadMore}
                </button>
              </div>
            )}

            {/* End of list */}
            {!hasMore && deals.length > 0 && (
              <p className="text-center text-warm-400 dark:text-warm-500 text-sm mt-8">
                {deals.length} deals loaded
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
