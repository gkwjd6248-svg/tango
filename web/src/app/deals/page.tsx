'use client';

import { useEffect } from 'react';
import { useDealsStore } from '@/store/useDealsStore';
import { DealCard } from '@/components/DealCard';

interface Category {
  key: string;
  label: string;
}

const CATEGORIES: Category[] = [
  { key: 'all', label: 'All' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'music', label: 'Music' },
];

// Loading skeleton for deal cards
function DealSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-44 bg-warm-100 rounded-t-xl" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-warm-100 rounded w-4/5" />
        <div className="h-3 bg-warm-100 rounded w-3/5" />
        <div className="h-4 bg-warm-100 rounded w-2/5" />
        <div className="h-8 bg-warm-100 rounded mt-4" />
      </div>
    </div>
  );
}

export default function DealsPage() {
  const {
    deals,
    isLoading,
    isLoadingMore,
    error,
    selectedCategory,
    hasMore,
    fetchDeals,
    loadMore,
    setCategory,
  } = useDealsStore();

  useEffect(() => {
    fetchDeals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Page header */}
      <div className="bg-white border-b border-warm-100 sticky top-0 z-20">
        <div className="page-container py-4">
          <h1 className="text-xl font-bold text-warm-950 mb-3">Tango Deals &amp; Offers</h1>

          {/* Category filter chips */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
            role="tablist"
            aria-label="Filter deals by category"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                role="tab"
                aria-selected={selectedCategory === cat.key}
                onClick={() => setCategory(cat.key)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${
                    selectedCategory === cat.key
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                  }`}
              >
                {cat.label}
              </button>
            ))}
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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-primary-700 font-semibold text-lg mb-4">{error}</p>
            <button onClick={fetchDeals} className="btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🏷️</div>
            <p className="text-warm-500 text-lg font-semibold">No deals found</p>
            <p className="text-warm-400 text-sm mt-1">Try a different category</p>
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
                  Load More Deals
                </button>
              </div>
            )}

            {/* End of list */}
            {!hasMore && deals.length > 0 && (
              <p className="text-center text-warm-400 text-sm mt-8">
                All deals loaded — {deals.length} in total
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
