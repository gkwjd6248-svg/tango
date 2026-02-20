'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaBars, FaTimes, FaMusic } from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';

const NAV_LINKS = [
  { href: '/', label: 'Events' },
  { href: '/community', label: 'Community' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white/95 backdrop-blur-sm border-b border-warm-100 shadow-sm">
      <div className="page-container h-full flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-primary-700 hover:text-primary-600 transition-colors"
          aria-label="Tango World — home"
        >
          <FaMusic className="text-accent-500" size={18} />
          <span className="text-lg tracking-tight">Tango World</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive(href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-warm-700 hover:bg-warm-100 hover:text-warm-950'
                }`}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-warm-600">{user.nickname}</span>
              <button
                onClick={logout}
                className="btn-secondary text-xs px-3 py-1.5"
                aria-label="Log out"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-sm">
                Log in
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-warm-700 hover:bg-warm-100"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-warm-100
                     shadow-lg animate-slide-down"
        >
          <nav className="page-container py-3 flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive(href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-warm-700 hover:bg-warm-100'
                  }`}
              >
                {label}
              </Link>
            ))}

            <div className="border-t border-warm-100 mt-2 pt-3 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <span className="px-4 text-sm text-warm-500">{user.nickname}</span>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="btn-secondary mx-4 text-sm"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="btn-ghost mx-4 text-sm justify-center"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary mx-4 text-sm justify-center"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
