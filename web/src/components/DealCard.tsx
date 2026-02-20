'use client';

import Image from 'next/image';
import { FaExternalLinkAlt, FaTag } from 'react-icons/fa';
import { Deal } from '@/lib/api/deals';

const PROVIDER_COLORS: Record<string, string> = {
  Amazon: 'text-[#FF9900]',
  Coupang: 'text-[#1267CC]',
  AliExpress: 'text-[#E43225]',
};

const CATEGORY_PLACEHOLDER_CHAR: Record<string, string> = {
  shoes: 'S',
  clothing: 'C',
  accessories: 'A',
  music: 'M',
};

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const providerColor = PROVIDER_COLORS[deal.provider] ?? 'text-warm-500';
  const placeholderChar =
    CATEGORY_PLACEHOLDER_CHAR[deal.category] ?? deal.category.charAt(0).toUpperCase();

  const handleViewDeal = () => {
    window.open(deal.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="card group flex flex-col hover:shadow-md transition-shadow duration-200 h-full">
      {/* Image area */}
      <div className="relative h-44 bg-warm-50 overflow-hidden rounded-t-xl">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-warm-100 to-warm-200">
            <span className="text-5xl font-bold text-accent-500/40">{placeholderChar}</span>
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
        <h3 className="text-sm font-semibold text-warm-950 line-clamp-2 leading-snug">
          {deal.title}
        </h3>

        {/* Provider */}
        <p className={`text-xs font-medium flex items-center gap-1 ${providerColor}`}>
          <FaTag size={10} />
          {deal.provider}
        </p>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-primary-700">
            {deal.currency} {deal.dealPrice.toFixed(0)}
          </span>
          {deal.originalPrice > deal.dealPrice && (
            <span className="text-xs text-warm-400 line-through">
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
