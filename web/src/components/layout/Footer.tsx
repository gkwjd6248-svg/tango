'use client';

import Link from 'next/link';
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTwitter,
} from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';

const SOCIAL_LINKS = [
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaFacebookF, href: '#', label: 'Facebook' },
  { icon: FaYoutube, href: '#', label: 'YouTube' },
  { icon: FaTwitter, href: '#', label: 'Twitter / X' },
];

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = [
    { label: t.footer.about, href: '/about' },
    { label: t.footer.privacy, href: '/privacy' },
    { label: t.footer.terms, href: '/terms' },
    { label: t.footer.contact, href: '/contact' },
  ];

  return (
    <footer className="bg-warm-950 text-warm-300">
      <div className="page-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-accent-400 text-xl">♦</span>
              <span className="font-serif italic text-white text-lg font-bold">
                Tango Community
              </span>
            </div>
            <p className="text-sm text-warm-400 leading-relaxed max-w-xs">
              Connecting tango dancers worldwide. Discover events, share experiences,
              and find your next dance partner.
            </p>
          </div>

          {/* Links column */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Links
            </h3>
            <ul className="space-y-2">
              {footerLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-warm-400 hover:text-warm-100 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social column */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Follow us
            </h3>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-warm-800 text-warm-300 hover:bg-primary-700 hover:text-white transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-warm-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-warm-500">
            {t.footer.copyright}
          </p>
          <p className="text-xs text-warm-600">
            Made with passion for the tango community
          </p>
        </div>
      </div>
    </footer>
  );
}
