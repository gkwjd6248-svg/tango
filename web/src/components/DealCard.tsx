'use client';

import { FaExternalLinkAlt, FaTag } from 'react-icons/fa';
import { Deal } from '@/lib/api/deals';

const PROVIDER_COLORS: Record<string, string> = {
  Amazon: 'text-[#FF9900]',
  Coupang: 'text-[#1267CC]',
  AliExpress: 'text-[#E43225]',
  Temu: 'text-[#FB7701]',
};

/**
 * Normalizes the raw affiliateProvider value from the backend into a
 * human-readable display name. The backend may return lowercase values
 * like 'temu', 'amazon', etc., which we map to their canonical form.
 */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  amazon: 'Amazon',
  coupang: 'Coupang',
  aliexpress: 'AliExpress',
  temu: 'Temu',
};

function normalizeProviderName(raw: string): string {
  return PROVIDER_DISPLAY_NAMES[raw.toLowerCase()] ?? raw;
}

const CATEGORY_PLACEHOLDER: Record<string, { emoji: string; gradient: string }> = {
  shoes: { emoji: '👠', gradient: 'from-amber-50 to-orange-100' },
  clothing: { emoji: '👗', gradient: 'from-rose-50 to-pink-100' },
  accessories: { emoji: '💎', gradient: 'from-violet-50 to-purple-100' },
  music: { emoji: '🎵', gradient: 'from-sky-50 to-blue-100' },
};

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const displayProvider = normalizeProviderName(deal.provider);
  const providerColor = PROVIDER_COLORS[displayProvider] ?? 'text-warm-500';
  const placeholder = CATEGORY_PLACEHOLDER[deal.category] ?? { emoji: '🏷️', gradient: 'from-warm-50 to-warm-100' };

  const handleViewDeal = () => {
    window.open(deal.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="card group flex flex-col hover:shadow-md transition-shadow duration-200 h-full">
      {/* Image area */}
      <div className="relative h-44 bg-warm-50 dark:bg-warm-800 overflow-hidden rounded-t-xl">
        {deal.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="w-full h-full object-contain bg-white dark:bg-warm-900 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br ${placeholder.gradient}`}>
            <span className="text-5xl mb-1">{placeholder.emoji}</span>
            <span className="text-xs text-warm-400 dark:text-warm-500 font-medium px-4 text-center line-clamp-2">
              {deal.title.length > 40 ? deal.title.slice(0, 40) + '...' : deal.title}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {deal.discountPercentage > 0 && (
          <div
            className="absolute top-2 right-2 bg-primary-700 text-white text-xs font-bold
                       px-2 py-1 rounded-lg shadow"
            aria-label={`${deal.discountPercentage}% discount`}
          >
            -{deal.discountPercentage}%
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Title */}
        <h3 className="text-sm font-semibold text-warm-950 dark:text-warm-100 line-clamp-2 leading-snug">
          {deal.title}
        </h3>

        {/* Provider */}
        <p className={`text-xs font-medium flex items-center gap-1 ${providerColor}`}>
          <FaTag size={10} />
          {displayProvider}
        </p>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-primary-700 dark:text-primary-400">
            {deal.currency} {deal.dealPrice.toFixed(0)}
          </span>
          {deal.originalPrice > deal.dealPrice && (
            <span className="text-xs text-warm-400 dark:text-warm-500 line-through">
              {deal.originalPrice.toFixed(0)}
            </span>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleViewDeal}
          aria-label={`View deal: ${deal.title}`}
          className="btn-primary w-full mt-2 text-xs py-2 gap-1.5"
        >
          <FaExternalLinkAlt size={11} />
          View Deal
        </button>
      </div>
    </article>
  );
}
