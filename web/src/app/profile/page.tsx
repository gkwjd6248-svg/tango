'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaBookmark,
  FaFileAlt,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaChevronRight,
  FaUser,
} from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';
import { countryCodeToFlag, getInitials } from '@/lib/utils';

const DANCE_LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-300',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-300',
  advanced: 'bg-purple-100 text-purple-700 border-purple-300',
  leader: 'bg-accent-300/30 text-accent-700 border-accent-400',
  follower: 'bg-accent-300/30 text-accent-700 border-accent-400',
  both: 'bg-primary-100 text-primary-700 border-primary-300',
};

interface ProfileMenuSection {
  title: string;
  items: {
    label: string;
    href?: string;
    icon: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
  }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // If not authenticated, show a login prompt instead of redirecting
  // so visitors can still see the page structure
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
        <div className="card max-w-sm w-full p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
            <FaUser size={32} className="text-primary-700" />
          </div>
          <h1 className="text-xl font-bold text-warm-950">Join the Tango Community</h1>
          <p className="text-warm-500 text-sm">
            Sign in to manage your bookmarks, posts, and notifications.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/auth/login" className="btn-primary w-full justify-center">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-secondary w-full justify-center">
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const flag = user.countryCode ? countryCodeToFlag(user.countryCode) : '';
  const initials = getInitials(user.nickname);
  const levelColorClass =
    DANCE_LEVEL_COLORS[user.danceLevel?.toLowerCase() ?? ''] ??
    'bg-warm-100 text-warm-600 border-warm-300';

  const menuSections: ProfileMenuSection[] = [
    {
      title: 'My Content',
      items: [
        {
          label: 'My Bookmarks',
          href: '/profile/bookmarks',
          icon: <FaBookmark size={15} className="text-primary-600" />,
        },
        {
          label: 'My Posts',
          href: '/profile/posts',
          icon: <FaFileAlt size={15} className="text-primary-600" />,
        },
        {
          label: 'Notifications',
          href: '/profile/notifications',
          icon: <FaBell size={15} className="text-primary-600" />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Settings',
          href: undefined,
          icon: <FaCog size={15} className="text-warm-500" />,
          onClick: () => {
            // Placeholder — settings page not yet implemented
          },
        },
        {
          label: 'Sign Out',
          icon: <FaSignOutAlt size={15} className="text-primary-700" />,
          onClick: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Profile header card */}
      <div className="bg-white border-b border-warm-100">
        <div className="page-container py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div
              className="shrink-0 w-24 h-24 rounded-full bg-primary-700 flex items-center justify-center shadow-md"
              aria-hidden="true"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-3xl font-bold">{initials}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col items-center sm:items-start gap-1.5">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h1 className="text-2xl font-bold text-warm-950">{user.nickname}</h1>
                {flag && (
                  <span className="text-2xl leading-none" aria-label={user.countryCode}>
                    {flag}
                  </span>
                )}
              </div>

              <p className="text-warm-500 text-sm">{user.email}</p>

              {user.danceLevel && (
                <span
                  className={`mt-1 px-3 py-0.5 rounded-full text-xs font-semibold border ${levelColorClass}`}
                >
                  {user.danceLevel.charAt(0).toUpperCase() + user.danceLevel.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu sections */}
      <div className="page-container py-6 max-w-2xl space-y-5">
        {menuSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h2>
            <div className="card divide-y divide-warm-100">
              {section.items.map((item) => {
                const commonClasses = `flex items-center gap-3 px-5 py-4 w-full text-left
                  hover:bg-warm-50 transition-colors
                  ${item.danger ? 'text-primary-700' : 'text-warm-800'}`;

                if (item.href) {
                  return (
                    <Link key={item.label} href={item.href} className={commonClasses}>
                      {item.icon}
                      <span className="flex-1 font-medium">{item.label}</span>
                      <FaChevronRight size={12} className="text-warm-300" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={commonClasses}
                    aria-label={item.label}
                  >
                    {item.icon}
                    <span className="flex-1 font-medium">{item.label}</span>
                    {!item.danger && <FaChevronRight size={12} className="text-warm-300" />}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
