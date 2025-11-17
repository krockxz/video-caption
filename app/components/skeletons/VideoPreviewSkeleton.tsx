/**
 * VideoPreviewSkeleton - Skeleton loading state for video preview area
 * Matches the layout of RenderPreviewSection
 */

import React from 'react';

export interface VideoPreviewSkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Show preview controls */
  showControls?: boolean;
  /** Show render settings */
  showSettings?: boolean;
}

export function VideoPreviewSkeleton({
  className = '',
  showControls = true,
  showSettings = true
}: VideoPreviewSkeletonProps) {
  return (
    <div className={`bg-card rounded-lg border border-border overflow-hidden animate-pulse ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <div className="h-6 bg-slate-700 dark:bg-slate-600 rounded w-1/3"></div>
          <div className="h-6 bg-slate-700 dark:bg-slate-600 rounded-full w-16"></div>
        </div>
        <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/2"></div>
      </div>

      {/* Video preview area */}
      <div className="aspect-video bg-slate-800 dark:bg-slate-900 relative flex items-center justify-center">
        {/* Play button placeholder */}
        <div className="w-16 h-16 bg-slate-700 dark:bg-slate-600 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-12 border-l-transparent border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-white ml-1"></div>
        </div>

        {/* Loading indicator */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="h-2 bg-slate-700 dark:bg-slate-600 rounded-full w-full"></div>
          <div className="h-2 bg-slate-600 dark:bg-slate-500 rounded-full w-1/3 mt-1"></div>
        </div>
      </div>

      {/* Video info */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/2 mb-1"></div>
            <div className="h-5 bg-slate-700 dark:bg-slate-600 rounded w-3/4"></div>
          </div>
          <div>
            <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/2 mb-1"></div>
            <div className="h-5 bg-slate-700 dark:bg-slate-600 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Render settings */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="h-5 bg-slate-700 dark:bg-slate-600 rounded w-1/4 mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-16 mb-2"></div>
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-16 mb-2"></div>
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-16 mb-2"></div>
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-16 mb-2"></div>
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="p-4">
          <div className="flex flex-col gap-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/4"></div>
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/6"></div>
              </div>
              <div className="h-2 bg-slate-700 dark:bg-slate-600 rounded-full w-full"></div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded flex-1"></div>
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded flex-1"></div>
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-20"></div>
            </div>

            {/* Status info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="h-3 bg-slate-700 dark:bg-slate-600 rounded w-16 mb-1"></div>
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-24"></div>
              </div>
              <div>
                <div className="h-3 bg-slate-700 dark:bg-slate-600 rounded w-16 mb-1"></div>
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader text */}
      <div className="sr-only" role="status" aria-live="polite">
        Loading video preview...
      </div>
    </div>
  );
}

export default VideoPreviewSkeleton;