'use client';

import { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaGlobe } from 'react-icons/fa';
import { communityApi, Post } from '@/lib/api/community';
import { countryCodeToFlag, formatRelativeTime, getInitials } from '@/lib/utils';
import { useCommunityStore } from '@/store/useCommunityStore';

interface PostCardProps {
  post: Post;
  onUpdated?: (updated: Post) => void;
}

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'text-gray-500 bg-gray-100' },
  question: { label: 'Question', color: 'text-blue-700 bg-blue-50' },
  event_share: { label: 'Event', color: 'text-[#8B0000] bg-red-50' },
  video: { label: 'Video', color: 'text-purple-700 bg-purple-50' },
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

  const flag = countryCodeToFlag(post.user.countryCode);
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
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center
                     flex-shrink-0 select-none"
          aria-hidden="true"
        >
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>

        {/* Name and meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[#1A1A1A] text-sm leading-tight truncate">
              {post.user.nickname}
            </span>
            {flag && (
              <span className="text-base leading-none" aria-label={post.user.countryCode}>
                {flag}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${postTypeInfo.color}`}
            >
              {postTypeInfo.label}
            </span>
          </div>
          <time className="text-xs text-gray-400" dateTime={post.createdAt}>
            {timeAgo}
          </time>
        </div>
      </div>

      {/* Post content */}
      <div className="mb-3">
        <p className="text-[#1A1A1A] text-sm leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
        </p>

        {showTranslated && translatedText && (
          <p className="text-[10px] text-[#D4A017] italic mt-1">Translated text</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center gap-4">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            className={`flex items-center gap-1.5 text-sm transition-colors
                        ${liked ? 'text-[#8B0000]' : 'text-gray-500 hover:text-[#8B0000]'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {liked ? (
              <FaHeart className="text-[#8B0000]" size={14} />
            ) : (
              <FaRegHeart size={14} />
            )}
            <span className="font-medium">{likeCount}</span>
          </button>

          {/* Comment count (display only) */}
          <div
            className="flex items-center gap-1.5 text-sm text-gray-500"
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
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#8B0000]
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
