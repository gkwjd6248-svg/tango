'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaBookmark } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { EventCard } from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { bookmarksApi, BookmarkedEvent } from '@/lib/api/bookmarks';

function BookmarksContent() {
  const [bookmarks, setBookmarks] = useState<BookmarkedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadBookmarks = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const response = await bookmarksApi.getBookmarks(currentPage, 20);
      if (reset) {
        setBookmarks(response.items);
        setPage(2);
      } else {
        setBookmarks((prev) => [...prev, ...response.items]);
        setPage(currentPage + 1);
      }
      setHasMore(currentPage < response.totalPages);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load bookmarks';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    loadBookmarks(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Page header */}
      <div className="bg-white border-b border-warm-100 sticky top-0 z-20">
        <div className="page-container py-4 flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 rounded-lg text-warm-500 hover:text-warm-950 hover:bg-warm-100 transition-colors"
            aria-label="Back to profile"
          >
            <FaArrowLeft size={16} />
          </Link>
          <h1 className="text-lg font-bold text-warm-950">My Bookmarks</h1>
        </div>
      </div>

      <div className="page-container py-6">
        {/* Initial loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-primary-700 font-semibold text-lg mb-4">{error}</p>
            <button onClick={() => loadBookmarks(true)} className="btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FaBookmark size={48} className="text-warm-200 mb-4" />
            <p className="text-warm-600 font-semibold text-lg">No bookmarked events yet</p>
            <p className="text-warm-400 text-sm mt-2 max-w-xs">
              Browse events to find ones you like and bookmark them for later.
            </p>
            <Link href="/events" className="btn-primary mt-5">
              Browse Events
            </Link>
          </div>
        )}

        {/* Event grid */}
        {bookmarks.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bookmarks.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}

              {isLoadingMore &&
                Array.from({ length: 4 }).map((_, i) => (
                  <EventCardSkeleton key={`skel-more-${i}`} />
                ))}
            </div>

            {hasMore && !isLoadingMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => loadBookmarks(false)}
                  className="btn-secondary px-10"
                >
                  Load More
                </button>
              </div>
            )}

            {!hasMore && bookmarks.length > 0 && (
              <p className="text-center text-warm-400 text-sm mt-8">
                All {bookmarks.length} bookmarks loaded
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function BookmarksPage() {
  return (
    <AuthGuard>
      <BookmarksContent />
    </AuthGuard>
  );
}
