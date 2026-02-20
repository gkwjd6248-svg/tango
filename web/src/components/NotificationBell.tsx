'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaBell } from 'react-icons/fa';
import { notificationsApi } from '@/lib/api/notifications';
import { useAuthStore } from '@/store/useAuthStore';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function NotificationBell() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { count } = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silent fail — badge simply stays at its last known value
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={() => router.push('/profile/notifications')}
      aria-label={
        unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'
      }
      className="relative p-2 text-warm-600 hover:text-primary-700 transition-colors rounded-lg
                 hover:bg-warm-100"
    >
      <FaBell size={20} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                     bg-primary-700 text-white text-[10px] font-bold
                     rounded-full flex items-center justify-center leading-none"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
