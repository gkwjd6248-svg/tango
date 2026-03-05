'use client';

/**
 * Renders a country flag as an image (works on Windows, macOS, Linux).
 * Uses flagcdn.com CDN for reliable cross-platform flag rendering.
 */

interface CountryFlagProps {
  code: string;       // ISO 3166-1 alpha-2 country code (e.g. "KR", "AR")
  size?: number;      // height in px (default 16)
  className?: string;
}

export function CountryFlag({ code, size = 16, className = '' }: CountryFlagProps) {
  if (!code || code.length !== 2) return null;
  const lower = code.toLowerCase();
  // flagcdn provides PNG flags at various widths; w40 is crisp for most UI sizes
  const src = `https://flagcdn.com/w40/${lower}.png`;

  return (
    <img
      src={src}
      alt={code}
      width={Math.round(size * 1.5)} // flags are roughly 3:2 aspect ratio
      height={size}
      className={`inline-block ${className}`}
      style={{ height: size, width: 'auto' }}
      loading="lazy"
    />
  );
}
