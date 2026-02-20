/**
 * Skeleton placeholder for EventCard — shown while events are loading.
 * Uses Tailwind's animate-pulse utility for the shimmer effect.
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      {/* Image placeholder */}
      <div className="w-full h-44 bg-gray-200" />

      {/* Body */}
      <div className="p-4 space-y-2.5">
        {/* Title lines */}
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />

        {/* Venue */}
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-1" />

        {/* City */}
        <div className="h-3 bg-gray-100 rounded w-1/3" />

        {/* Date */}
        <div className="h-3 bg-gray-100 rounded w-2/5 mt-2" />
      </div>
    </div>
  );
}

/**
 * Renders a grid of N skeleton cards while content is loading.
 */
export function EventGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
