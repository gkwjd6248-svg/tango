'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { FaGlobeAmericas, FaPlus, FaTimes } from 'react-icons/fa';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

const COUNTRY_SCOPES = [
  { code: '', label: 'All Countries' },
  { code: 'AR', label: 'Argentina' },
  { code: 'KR', label: 'South Korea' },
  { code: 'JP', label: 'Japan' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'TR', label: 'Turkey' },
  { code: 'FI', label: 'Finland' },
];

const POST_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'question', label: 'Question' },
  { value: 'tip', label: 'Tip' },
  { value: 'event_share', label: 'Event' },
];

export default function CommunityPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const {
    posts,
    isLoading,
    isLoadingMore,
    error,
    page,
    totalPages,
    countryScope,
    fetchPosts,
    loadMore,
    setCountryScope,
    createPost,
  } = useCommunityStore();

  const [showCompose, setShowCompose] = useState(false);
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showCompose && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showCompose]);

  const handleScopeChange = (code: string) => {
    setCountryScope(code || undefined);
    fetchPosts(code || undefined);
  };

  const handleSubmitPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!postText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createPost({
        contentText: postText.trim(),
        postType,
        countryScope: countryScope || undefined,
      });
      setPostText('');
      setShowCompose(false);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to create post';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMore = page < totalPages;

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Page header */}
      <div className="bg-white border-b border-warm-100">
        <div className="page-container py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-warm-950">{t.community.title}</h1>
              <p className="text-warm-500 text-sm mt-0.5">{t.community.subtitle}</p>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => setShowCompose((v) => !v)}
                className="btn-primary gap-2 flex-shrink-0"
                aria-label={t.community.newPost}
              >
                {showCompose ? (
                  <>
                    <FaTimes size={13} />
                    Cancel
                  </>
                ) : (
                  <>
                    <FaPlus size={13} />
                    {t.community.newPost}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Country scope filter */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
            role="group"
            aria-label="Filter by country"
          >
            <FaGlobeAmericas className="flex-shrink-0 text-warm-400 self-center" size={14} />
            {COUNTRY_SCOPES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => handleScopeChange(code)}
                className={clsx(
                  'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  (countryScope ?? '') === code
                    ? 'bg-primary-700 text-white'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200',
                )}
                aria-pressed={(countryScope ?? '') === code}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compose box */}
      {showCompose && isAuthenticated && (
        <div className="bg-white border-b border-warm-100 shadow-sm">
          <div className="page-container py-4 max-w-2xl">
            <form onSubmit={handleSubmitPost} className="space-y-3">
              {/* Post type selector */}
              <div className="flex gap-2 flex-wrap">
                {POST_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPostType(value)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      postType === value
                        ? 'bg-primary-700 text-white'
                        : 'bg-warm-100 text-warm-600 hover:bg-warm-200',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder={t.community.writePlaceholder}
                rows={4}
                className="input-field resize-none"
                maxLength={2000}
                required
                aria-label="Post content"
              />

              {submitError && (
                <p role="alert" className="text-sm text-red-600">
                  {submitError}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-warm-400">
                  {postText.length}/2000
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompose(false);
                      setPostText('');
                      setSubmitError(null);
                    }}
                    className="btn-ghost text-warm-600"
                  >
                    {t.community.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !postText.trim()}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Posting...' : t.community.post}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post feed */}
      <div className="page-container py-6 max-w-2xl">
        {/* Not authenticated prompt */}
        {!isAuthenticated && (
          <div className="card p-4 mb-5 flex items-center justify-between gap-4 bg-primary-50 border-primary-100">
            <p className="text-sm text-warm-700">
              Sign in to post, like, and translate community posts.
            </p>
            <a href="/auth/login" className="btn-primary flex-shrink-0 text-xs px-3 py-1.5">
              Sign In
            </a>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && posts.length === 0 && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-primary-700 font-semibold mb-2">{t.common.error}</p>
            <p className="text-warm-500 text-sm mb-5">{error}</p>
            <button onClick={() => fetchPosts()} className="btn-primary">
              {t.common.retry}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && posts.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
              <FaGlobeAmericas size={28} className="text-warm-300" />
            </div>
            <h2 className="text-warm-700 font-semibold text-xl mb-2">
              {t.community.noPosts}
            </h2>
            <p className="text-warm-400 text-sm">
              {t.community.noPostsSubtext}
            </p>
          </div>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Load more skeleton while fetching */}
            {isLoadingMore && (
              <div className="space-y-4 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <PostCardSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}

            {/* Load more button */}
            {hasMore && !isLoadingMore && (
              <div className="text-center mt-8">
                <button onClick={loadMore} className="btn-secondary px-10">
                  {t.community.loadMore}
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
