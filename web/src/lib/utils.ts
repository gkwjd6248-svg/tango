/**
 * Utility functions shared across the web app.
 */

/**
 * Converts an ISO 3166-1 alpha-2 country code to a flag emoji.
 * "KR" -> "🇰🇷", "AR" -> "🇦🇷"
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  // Each letter is offset by the regional indicator symbol base (0x1F1E6 - 0x41)
  const offset = 0x1f1e6 - 0x41;
  const first = String.fromCodePoint(upper.charCodeAt(0) + offset);
  const second = String.fromCodePoint(upper.charCodeAt(1) + offset);
  return first + second;
}

/**
 * Formats an ISO date string as a relative human-readable string.
 * "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/**
 * Formats an ISO date string to a locale-friendly display string.
 * E.g. "Saturday, March 15, 2025 · 9:00 PM"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const dateFormatted = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateFormatted} · ${timeFormatted}`;
}

/**
 * Formats a short date for use in list cards.
 * E.g. "Mar 15, 2025 · 9:00 PM"
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const dateFormatted = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateFormatted} · ${timeFormatted}`;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generates initials from a display name (up to 2 characters).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
