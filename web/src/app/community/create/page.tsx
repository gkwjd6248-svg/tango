'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Types & constants ────────────────────────────────────────────────────────

type PostType = 'general' | 'question' | 'event_share' | 'video';
type CountryScope = 'global' | 'my_country';

interface PostTypeOption {
  value: PostType;
  label: string;
  description: string;
}

interface ScopeOption {
  value: CountryScope;
  label: string;
}

const POST_TYPES: PostTypeOption[] = [
  {
    value: 'general',
    label: 'General',
    description: 'Share thoughts, stories, or anything on your mind',
  },
  {
    value: 'question',
    label: 'Question',
    description: 'Ask the community for advice or information',
  },
  {
    value: 'event_share',
    label: 'Event Share',
    description: 'Share an upcoming event or milonga',
  },
  {
    value: 'video',
    label: 'Video',
    description: 'Share a video link or performance',
  },
];

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: 'global', label: 'Global — visible to everyone worldwide' },
  { value: 'my_country', label: 'My Country — visible to dancers in your country' },
];

const MAX_CHARS = 2000;

// ─── Inner form (rendered after auth guard passes) ────────────────────────────

function CreatePostForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createPost } = useCommunityStore();

  const [contentText, setContentText] = useState('');
  const [postType, setPostType] = useState<PostType>('general');
  const [scope, setScope] = useState<CountryScope>('global');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = contentText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = contentText.trim().length > 0 && !isOverLimit && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const trimmed = contentText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Resolve country scope: use user's countryCode for "my_country", or undefined for global
      const resolvedCountryScope =
        scope === 'my_country' && user?.countryCode ? user.countryCode : undefined;

      await createPost({
        contentText: trimmed,
        postType,
        countryScope: resolvedCountryScope,
      });

      // Redirect to the community feed on success
      router.push('/community');
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create post. Please try again.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container py-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/community"
            className="flex items-center gap-2 text-warm-500 hover:text-warm-800
                       text-sm transition-colors"
            aria-label="Back to community"
          >
            <FaArrowLeft size={12} />
            Community
          </Link>
          <span className="text-warm-300" aria-hidden="true">
            /
          </span>
          <h1 className="text-lg font-bold text-warm-950">Write a Post</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Content area ──────────────────────────────────── */}
          <section className="bg-white rounded-xl border border-warm-100 p-5 mb-4">
            <label
              htmlFor="post-content"
              className="block text-xs font-bold text-primary-700 uppercase tracking-wider mb-3"
            >
              Your Post
            </label>

            <textarea
              id="post-content"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="What's on your mind? Share news, ask a question, or talk tango..."
              rows={8}
              className={`w-full resize-none rounded-lg border px-4 py-3 text-sm
                         text-warm-900 placeholder:text-warm-300 leading-relaxed
                         focus:outline-none focus:ring-2 transition-all
                         ${
                           isOverLimit
                             ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                             : 'border-warm-200 focus:ring-primary-700/20 focus:border-primary-700'
                         }`}
              maxLength={MAX_CHARS + 50} // soft over-limit allowed to show warning
              aria-required="true"
              aria-describedby="char-count"
              autoFocus
            />

            {/* Character counter */}
            <div className="flex justify-end mt-2">
              <span
                id="char-count"
                className={`text-xs font-medium ${
                  isOverLimit
                    ? 'text-red-500'
                    : charCount > MAX_CHARS * 0.9
                    ? 'text-amber-500'
                    : 'text-warm-400'
                }`}
                aria-live="polite"
              >
                {charCount}/{MAX_CHARS}
              </span>
            </div>
          </section>

          {/* ── Post type selector ───────────────────────────── */}
          <section className="bg-white rounded-xl border border-warm-100 p-5 mb-4">
            <fieldset>
              <legend className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-3">
                Post Type
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POST_TYPES.map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                                transition-all
                                ${
                                  postType === value
                                    ? 'border-primary-700 bg-primary-50'
                                    : 'border-warm-200 hover:border-warm-400'
                                }`}
                  >
                    <input
                      type="radio"
                      name="post-type"
                      value={value}
                      checked={postType === value}
                      onChange={() => setPostType(value)}
                      className="mt-0.5 accent-primary-700 flex-shrink-0"
                    />
                    <div>
                      <span
                        className={`block text-sm font-semibold ${
                          postType === value ? 'text-primary-700' : 'text-warm-800'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-warm-400 leading-snug">{description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          {/* ── Country scope selector ───────────────────────── */}
          <section className="bg-white rounded-xl border border-warm-100 p-5 mb-6">
            <fieldset>
              <legend className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-3">
                Audience
              </legend>

              <div className="space-y-2">
                {SCOPE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                                transition-all
                                ${
                                  scope === value
                                    ? 'border-primary-700 bg-primary-50'
                                    : 'border-warm-200 hover:border-warm-400'
                                }
                                ${
                                  value === 'my_country' && !user?.countryCode
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={value}
                      checked={scope === value}
                      onChange={() => setScope(value)}
                      disabled={value === 'my_country' && !user?.countryCode}
                      className="accent-primary-700 flex-shrink-0"
                    />
                    <span
                      className={`text-sm ${
                        scope === value ? 'text-primary-700 font-semibold' : 'text-warm-700'
                      }`}
                    >
                      {label}
                      {value === 'my_country' && user?.countryCode && (
                        <span className="ml-1 text-warm-400">({user.countryCode})</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>

              {scope === 'my_country' && !user?.countryCode && (
                <p className="mt-2 text-xs text-amber-600">
                  Set your country in your profile to use this option.
                </p>
              )}
            </fieldset>
          </section>

          {/* Error message */}
          {error && (
            <p
              role="alert"
              className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200
                         text-red-700 text-sm"
            >
              {error}
            </p>
          )}

          {/* Over-limit warning */}
          {isOverLimit && (
            <p role="alert" className="mb-4 text-red-600 text-sm font-medium">
              Your post is {charCount - MAX_CHARS} character{charCount - MAX_CHARS !== 1 ? 's' : ''}{' '}
              over the {MAX_CHARS.toLocaleString()} character limit.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/community"
              className="btn-secondary flex-1 justify-center"
              aria-label="Cancel and go back"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary flex-[2] justify-center"
              aria-label="Publish your post"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
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
                  Publishing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FaCheck size={13} />
                  Publish Post
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page — wrapped with AuthGuard ───────────────────────────────────────────

export default function CreatePostPage() {
  return (
    <AuthGuard>
      <CreatePostForm />
    </AuthGuard>
  );
}
