'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaThumbsUp, FaThumbsDown, FaRegThumbsUp, FaRegThumbsDown } from 'react-icons/fa';
import { eventsApi, VoteResult } from '@/lib/api/events';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation, interpolate } from '@/lib/i18n';

interface VoteBarProps {
  eventId: string;
  onLoginRequired?: () => void;
}

export default function VoteBar({ eventId, onLoginRequired }: VoteBarProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useTranslation();

  const [votes, setVotes] = useState<VoteResult>({ likes: 0, dislikes: 0, userVote: null });
  const [isVoting, setIsVoting] = useState(false);

  const loadVotes = useCallback(async () => {
    try {
      const data = await eventsApi.getEventVotes(eventId, user?.id);
      setVotes(data);
    } catch {
      // Silent fail
    }
  }, [eventId, user?.id]);

  useEffect(() => {
    loadVotes();
  }, [loadVotes]);

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    try {
      const result = await eventsApi.voteEvent(eventId, voteType);
      setVotes(result);
    } catch {
      // Silent fail
    } finally {
      setIsVoting(false);
    }
  };

  const total = votes.likes + votes.dislikes;
  const pct = total > 0 ? Math.round((votes.likes / total) * 100) : 0;
  const likePct = total > 0 ? (votes.likes / total) * 100 : 50;

  return (
    <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5">
      <p className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-3">
        {t.events.votes}
      </p>

      {/* Vote buttons + counts */}
      <div className="flex items-center gap-4 mb-3">
        {/* Like button */}
        <button
          onClick={() => handleVote('like')}
          disabled={isVoting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      border transition-all disabled:opacity-60 disabled:cursor-not-allowed
                      ${
                        votes.userVote === 'like'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-300 hover:border-green-500 hover:text-green-600'
                      }`}
          aria-label={t.events.like}
        >
          {votes.userVote === 'like' ? <FaThumbsUp size={14} /> : <FaRegThumbsUp size={14} />}
          {votes.likes}
        </button>

        {/* Dislike button */}
        <button
          onClick={() => handleVote('dislike')}
          disabled={isVoting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      border transition-all disabled:opacity-60 disabled:cursor-not-allowed
                      ${
                        votes.userVote === 'dislike'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-300 hover:border-red-400 hover:text-red-500'
                      }`}
          aria-label={t.events.dislike}
        >
          {votes.userVote === 'dislike' ? <FaThumbsDown size={14} /> : <FaRegThumbsDown size={14} />}
          {votes.dislikes}
        </button>
      </div>

      {/* Vote bar */}
      {total > 0 && (
        <>
          <div className="w-full h-2.5 rounded-full bg-warm-100 dark:bg-warm-800 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
              style={{ width: `${likePct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-300"
              style={{ width: `${100 - likePct}%` }}
            />
          </div>
          <p className="text-xs text-warm-500 dark:text-warm-400 mt-2">
            {interpolate(t.events.positive, { pct })}
          </p>
        </>
      )}

      {/* Login prompt */}
      {!isAuthenticated && (
        <p className="text-xs text-warm-400 dark:text-warm-500 mt-2">
          {t.events.loginToVote}
        </p>
      )}
    </div>
  );
}
