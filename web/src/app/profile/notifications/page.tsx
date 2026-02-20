'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaBell,
  FaCalendarAlt,
  FaHeart,
  FaComment,
  FaExclamationCircle,
  FaCheckDouble,
} from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { formatRelativeTime } from '@/lib/utils';

// Map notification type to icon and accent color
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'new_event':
      return <FaCalendarAlt className="text-primary-600" size={16} />;
    case 'new_like':
      return <FaHeart className="text-red-500" size={16} />;
    case 'new_comment':
      return <FaComment className="text-blue-500" size={16} />;
    default:
      return <FaExclamationCircle className="text-warm-400" size={16} />;
  }
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors
        hover:bg-warm-50 border-b border-warm-100 last:border-b-0
        ${notification.isRead ? '' : 'bg-blue-50/40'}`}
      aria-label={notification.isRead ? notification.title : `Unread: ${notification.title}`}
    >
      {/* Icon container */}
      <div
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${notification.isRead ? 'bg-warm-100' : 'bg-white shadow-sm border border-warm-100'}`}
      >
        <NotificationIcon type={notification.type} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            notification.isRead ? 'text-warm-600 font-normal' : 'text-warm-950 font-semibold'
          }`}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-warm-400 mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <time className="text-[11px] text-warm-400 mt-1 block">
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div
          className="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// Skeleton loader
function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4 animate-pulse border-b border-warm-100">
      <div className="w-10 h-10 rounded-full bg-warm-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-warm-100 rounded w-3/4" />
        <div className="h-2 bg-warm-100 rounded w-1/2" />
        <div className="h-2 bg-warm-100 rounded w-1/4" />
      </div>
    </div>
  );
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const response = await notificationsApi.getNotifications(currentPage, 30);
        if (reset) {
          setNotifications(response.items);
          setPage(2);
        } else {
          setNotifications((prev) => [...prev, ...response.items]);
          setPage(currentPage + 1);
        }
        setHasMore(currentPage < response.totalPages);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load notifications';
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
    loadNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      // Reload on failure to sync true state
      await loadNotifications(true);
    } finally {
      setIsMarkingAll(false);
    }
  };

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

          <h1 className="text-lg font-bold text-warm-950 flex-1">Notifications</h1>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="btn-ghost text-xs gap-1.5 text-warm-500 disabled:opacity-50"
              aria-label="Mark all notifications as read"
            >
              <FaCheckDouble size={13} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="page-container py-6 max-w-2xl">
        {/* Initial loading */}
        {isLoading && (
          <div className="card divide-y divide-warm-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-primary-700 font-semibold text-lg mb-4">{error}</p>
            <button onClick={() => loadNotifications(true)} className="btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FaBell size={48} className="text-warm-200 mb-4" />
            <p className="text-warm-600 font-semibold text-lg">No notifications</p>
            <p className="text-warm-400 text-sm mt-2">
              You&apos;re all caught up! Check back later.
            </p>
          </div>
        )}

        {/* Notification list */}
        {notifications.length > 0 && (
          <>
            <div className="card overflow-hidden">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}

              {isLoadingMore && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <NotificationSkeleton key={`skel-more-${i}`} />
                  ))}
                </>
              )}
            </div>

            {hasMore && !isLoadingMore && (
              <div className="flex justify-center mt-6">
                <button onClick={() => loadNotifications(false)} className="btn-secondary px-10">
                  Load More
                </button>
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <p className="text-center text-warm-400 text-sm mt-6">
                All {notifications.length} notifications loaded
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
