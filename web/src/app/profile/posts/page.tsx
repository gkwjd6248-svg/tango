'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { communityApi, type Post } from '@/lib/api/community';

function MyPostsContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        // The backend /posts endpoint returns posts by the authenticated user
        // when the Authorization header is present and the query param is not set.
        // We rely on the JWT context (set by the axios interceptor) to scope results.
        const response = await communityApi.getPosts({
          page: currentPage,
          limit: 20,
        });
        if (reset) {
          setPosts(response.items);
          setPage(2);
        } else {
          setPosts((prev) => [...prev, ...response.items]);
          setPage(currentPage + 1);
        }
        setHasMore(currentPage < response.totalPages);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load posts';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page],
  );

  useEffect(() => {
    loadPosts(true);
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
          <h1 className="text-lg font-bold text-warm-950">My Posts</h1>
        </div>
      </div>

      <div className="page-container py-6 max-w-2xl">
        {/* Initial loading */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-primary-700 font-semibold text-lg mb-4">{error}</p>
            <button onClick={() => loadPosts(true)} className="btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FaFileAlt size={48} className="text-warm-200 mb-4" />
            <p className="text-warm-600 font-semibold text-lg">You haven&apos;t posted anything yet</p>
            <p className="text-warm-400 text-sm mt-2">
              Share your tango experiences with the community.
            </p>
            <Link href="/community" className="btn-primary mt-5">
              Go to Community
            </Link>
          </div>
        )}

        {/* Post list */}
        {posts.length > 0 && (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {isLoadingMore && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostCardSkeleton key={`skel-more-${i}`} />
                  ))}
                </div>
              )}
            </div>

            {hasMore && !isLoadingMore && (
              <div className="flex justify-center mt-8">
                <button onClick={() => loadPosts(false)} className="btn-secondary px-10">
                  Load More
                </button>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className="text-center text-warm-400 text-sm mt-8">
                All {posts.length} posts loaded
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function MyPostsPage() {
  return (
    <AuthGuard>
      <MyPostsContent />
    </AuthGuard>
  );
}
