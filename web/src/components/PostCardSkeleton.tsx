/**
 * Skeleton placeholder for PostCard — shown while posts are loading.
 */
export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-2.5 bg-gray-100 rounded w-1/4" />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
      </div>

      {/* Action bar */}
      <div className="border-t border-gray-100 pt-3 flex gap-4">
        <div className="h-3 bg-gray-100 rounded w-14" />
        <div className="h-3 bg-gray-100 rounded w-14" />
        <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
      </div>
    </div>
  );
}

export function PostFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
