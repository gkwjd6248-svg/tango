'use client';

import { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaGlobe } from 'react-icons/fa';
import { communityApi, Post } from '@/lib/api/community';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { CountryFlag } from '@/components/CountryFlag';
import { useCommunityStore } from '@/store/useCommunityStore';

interface PostCardProps {
  post: Post;
  onUpdated?: (updated: Post) => void;
}

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'text-warm-500 dark:text-warm-400 bg-warm-100 dark:bg-warm-800' },
  question: { label: 'Question', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
  event_share: { label: 'Event', color: 'text-primary-700 dark:text-primary-400 bg-red-50 dark:bg-primary-900/30' },
  video: { label: 'Video', color: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
};

export function PostCard({ post, onUpdated: _onUpdated }: PostCardProps) {
  const { updatePostLike, updatePostTranslation } = useCommunityStore();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(
    post.translatedText ?? null,
  );

  const hasCountry = !!post.user.countryCode;
  const initials = getInitials(post.user.nickname);
  const timeAgo = formatRelativeTime(post.createdAt);
  const postTypeInfo = POST_TYPE_LABELS[post.postType] ?? POST_TYPE_LABELS.general;

  const displayText =
    showTranslated && translatedText ? translatedText : post.contentText;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const result = await communityApi.toggleLike('post', post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      updatePostLike(post.id, result.liked, result.likeCount);
    } catch {
      // Silent fail — no optimistic update applied
    } finally {
      setIsLiking(false);
    }
  };

  const handleTranslate = async () => {
    // Toggle off if translation is already loaded
    if (translatedText) {
      setShowTranslated((prev) => !prev);
      return;
    }

    setIsTranslating(true);
    try {
      // Detect browser language; fall back to English
      const targetLanguage =
        (typeof navigator !== 'undefined' ? navigator.language : 'en').split('-')[0] || 'en';
      const result = await communityApi.translatePost(post.id, targetLanguage);
      setTranslatedText(result.translatedText);
      setShowTranslated(true);
      updatePostTranslation(post.id, result.translatedText);
    } catch {
      // Silent fail
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <article className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 shadow-sm p-5 mb-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center
                     flex-shrink-0 select-none"
          aria-hidden="true"
        >
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>

        {/* Name and meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-warm-950 dark:text-warm-100 text-sm leading-tight truncate">
              {post.user.nickname}
            </span>
            {hasCountry && (
              <CountryFlag code={post.user.countryCode} size={16} />
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${postTypeInfo.color}`}
            >
              {postTypeInfo.label}
            </span>
          </div>
          <time className="text-xs text-warm-400 dark:text-warm-500" dateTime={post.createdAt}>
            {timeAgo}
          </time>
        </div>
      </div>

      {/* Post content */}
      <div className="mb-3">
        <p className="text-warm-950 dark:text-warm-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
        </p>

        {showTranslated && translatedText && (
          <p className="text-[10px] text-accent-500 dark:text-accent-400 italic mt-1">Translated text</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-warm-100 dark:border-warm-800 pt-3">
        <div className="flex items-center gap-4">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            className={`flex items-center gap-1.5 text-sm transition-colors
                        ${liked ? 'text-primary-700 dark:text-primary-400' : 'text-warm-500 dark:text-warm-400 hover:text-primary-700 dark:hover:text-primary-400'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {liked ? (
              <FaHeart className="text-primary-700 dark:text-primary-400" size={14} />
            ) : (
              <FaRegHeart size={14} />
            )}
            <span className="font-medium">{likeCount}</span>
          </button>

          {/* Comment count (display only) */}
          <div
            className="flex items-center gap-1.5 text-sm text-warm-500 dark:text-warm-400"
            aria-label={`${post.commentCount} comments`}
          >
            <FaComment size={13} />
            <span className="font-medium">{post.commentCount}</span>
          </div>

          {/* Translate button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            aria-label={showTranslated ? 'Show original text' : 'Translate post'}
            className="flex items-center gap-1.5 text-sm text-warm-500 dark:text-warm-400 hover:text-primary-700 dark:hover:text-primary-400
                       transition-colors ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGlobe size={13} />
            <span className="text-xs font-medium">
              {isTranslating
                ? 'Translating...'
                : showTranslated && translatedText
                ? 'Show original'
                : 'Translate'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
