'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineBookmark,
  HiOutlineChevronDown,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineChatAlt2,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { useTranslation } from '@/lib/i18n';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/events', labelKey: 'events' as const },
  { href: '/community', labelKey: 'community' as const },
  { href: '/deals', labelKey: 'deals' as const },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Determine if dark mode is currently active
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Fetch unread count when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    notificationsApi.getUnreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => void 0);
  }, [isAuthenticated]);

  // Close dropdowns on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifOpen = async () => {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const data = await notificationsApi.getNotifications(1, 10);
      setNotifications(data.items);
      setUnreadCount(0);
      // Mark all as read in background
      notificationsApi.markAllAsRead().catch(() => void 0);
    } catch {
      // Silent fail
    } finally {
      setNotifLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-700 dark:bg-primary-900 shadow-md transition-colors">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-bold text-xl tracking-wide hover:opacity-90 transition-opacity"
          >
            <span className="text-accent-400 text-2xl">♦</span>
            <span className="font-serif italic">Tango</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive(href)
                    ? 'bg-white/20 text-white'
                    : 'text-red-100 hover:bg-white/10 hover:text-white',
                )}
              >
                {t.nav[labelKey]}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <div className="w-px h-5 bg-white/20 mx-1" aria-hidden="true" />
                <Link
                  href="/profile/events"
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive('/profile/events')
                      ? 'bg-white/20 text-white'
                      : 'text-red-100 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <HiOutlineCalendar className="w-4 h-4" />
                  {t.events.myEvents}
                </Link>
                <Link
                  href="/profile/registrations"
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive('/profile/registrations')
                      ? 'bg-white/20 text-white'
                      : 'text-red-100 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <HiOutlineClipboardList className="w-4 h-4" />
                  {t.events.myRegistrations}
                </Link>
                <Link
                  href="/chat"
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive('/chat')
                      ? 'bg-white/20 text-white'
                      : 'text-red-100 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <HiOutlineChatAlt2 className="w-4 h-4" />
                  {t.nav.partyChat}
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-2">
            <LocaleSwitcher />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleNotifOpen}
                    className="relative p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    aria-label={t.nav.notifications}
                  >
                    <HiOutlineBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-warm-900 rounded-xl shadow-xl border border-warm-100 dark:border-warm-800 overflow-hidden animate-slide-down">
                      <div className="px-4 py-3 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-warm-950 dark:text-warm-100">
                          {t.nav.notifications}
                        </h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto scrollbar-thin">
                        {notifLoading ? (
                          <div className="p-4 text-center text-warm-400 text-sm">
                            {t.common.loading}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-6 text-center text-warm-400 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={clsx(
                                'px-4 py-3 border-b border-warm-50 dark:border-warm-800 last:border-0',
                                !n.isRead && 'bg-primary-50/40 dark:bg-primary-900/40',
                              )}
                            >
                              <p className="text-sm font-medium text-warm-900 dark:text-warm-100">{n.title}</p>
                              <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">{n.body}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-100 hover:bg-white/10 hover:text-white transition-all"
                    aria-label={t.nav.profile}
                  >
                    <div className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center text-white text-xs font-bold">
                      {user?.nickname?.[0]?.toUpperCase() ?? 'T'}
                    </div>
                    <span className="max-w-[100px] truncate">{user?.nickname}</span>
                    <HiOutlineChevronDown
                      className={clsx('w-3.5 h-3.5 transition-transform', userMenuOpen && 'rotate-180')}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-warm-900 rounded-xl shadow-xl border border-warm-100 dark:border-warm-800 overflow-hidden animate-slide-down">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-warm-800 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                      >
                        <HiOutlineUser className="w-4 h-4" />
                        {t.nav.profile}
                      </Link>
                      <Link
                        href="/bookmarks"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-warm-800 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                      >
                        <HiOutlineBookmark className="w-4 h-4" />
                        {t.nav.bookmarks}
                      </Link>
                      <hr className="border-warm-100 dark:border-warm-800" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <HiOutlineLogout className="w-4 h-4" />
                        {t.nav.logout}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-red-100 hover:text-white hover:bg-white/10">
                  {t.nav.login}
                </Link>
                <Link href="/auth/register" className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-400 transition-colors">
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Section */}
          <div className="flex md:hidden items-center gap-1">
            {/* Theme Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              className="p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="p-2 rounded-lg text-red-100 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary-800 dark:bg-primary-950 border-t border-primary-600 dark:border-primary-800 animate-slide-down">
          <nav className="page-container py-3 space-y-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-white/20 text-white'
                    : 'text-red-100 hover:bg-white/10 hover:text-white',
                )}
              >
                {t.nav[labelKey]}
              </Link>
            ))}

            <div className="pt-3 border-t border-primary-600 dark:border-primary-800 mt-2">
              {isAuthenticated ? (
                <>
                  <Link href="/profile/events" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <HiOutlineCalendar className="w-4 h-4" />
                    {t.events.myEvents}
                  </Link>
                  <Link href="/profile/registrations" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <HiOutlineClipboardList className="w-4 h-4" />
                    {t.events.myRegistrations}
                  </Link>
                  <Link href="/chat" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <HiOutlineChatAlt2 className="w-4 h-4" />
                    {t.nav.partyChat}
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <HiOutlineUser className="w-4 h-4" />
                    {t.nav.profile}
                  </Link>
                  <Link href="/bookmarks" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <HiOutlineBookmark className="w-4 h-4" />
                    {t.nav.bookmarks}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-300 hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <HiOutlineLogout className="w-4 h-4" />
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <div className="flex gap-3 px-4 py-2">
                  <Link href="/auth/login" className="flex-1 text-center btn-ghost text-red-100 hover:text-white hover:bg-white/10">
                    {t.nav.login}
                  </Link>
                  <Link href="/auth/register" className="flex-1 text-center px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-400 transition-colors">
                    {t.nav.register}
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
