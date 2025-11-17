/**
 * VideoCardSkeleton - Skeleton loading state for VideoCard component
 * Matches the layout and dimensions of the actual VideoCard
 */

import React from 'react';

export interface VideoCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function VideoCardSkeleton({ className = '' }: VideoCardSkeletonProps) {
  return (
    <div
      className={`bg-card rounded-lg border border-border p-4 animate-pulse ${className}`}
      role="status"
      aria-label="Loading video card"
    >
      {/* Header with title and status */}
      <div className="flex items-start justify-between mb-3">
        {/* Title placeholder */}
        <div className="flex-1 mr-3">
          <div className="h-5 bg-slate-700 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/2"></div>
        </div>
        {/* Status badge placeholder */}
        <div className="h-6 bg-slate-700 dark:bg-slate-600 rounded-full w-16"></div>
      </div>

      {/* Video info grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-full mb-1"></div>
          <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-2/3"></div>
        </div>
        <div>
          <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-full mb-1"></div>
          <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-3/4"></div>
        </div>
      </div>

      {/* Caption count */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/3"></div>
        <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/4"></div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded flex-1"></div>
        <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded flex-1"></div>
      </div>

      {/* Screen reader text */}
      <span className="sr-only">Loading video information...</span>
    </div>
  );
}

export default VideoCardSkeleton;