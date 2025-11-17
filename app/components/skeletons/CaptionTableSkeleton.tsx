/**
 * CaptionTableSkeleton - Skeleton loading state for CaptionTable component
 * Shows placeholder rows for caption entries
 */

import React from 'react';

export interface CaptionTableSkeletonProps {
  /** Number of placeholder rows to show */
  rows?: number;
  /** Additional CSS classes */
  className?: string;
}

export function CaptionTableSkeleton({
  rows = 8,
  className = ''
}: CaptionTableSkeletonProps) {
  return (
    <div className={`bg-card rounded-lg border border-border overflow-hidden ${className}`}>
      {/* Table header */}
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-slate-700 dark:bg-slate-600 rounded w-1/4"></div>
          <div className="h-8 bg-slate-700 dark:bg-slate-600 rounded w-20"></div>
        </div>
        {/* Language filter and search */}
        <div className="flex gap-4">
          <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded flex-1 max-w-xs"></div>
          <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded flex-1 max-w-md"></div>
        </div>
      </div>

      {/* Table body */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left">
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-16"></div>
              </th>
              <th className="p-4 text-left">
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-20"></div>
              </th>
              <th className="p-4 text-left">
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-24"></div>
              </th>
              <th className="p-4 text-left">
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-28"></div>
              </th>
              <th className="p-4 text-left">
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-20"></div>
              </th>
              <th className="p-4 text-center">
                <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-12 mx-auto"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Skeleton rows */}
            {Array.from({ length: rows }, (_, index) => (
              <tr
                key={index}
                className="border-b border-border hover:bg-muted/50 transition-colors animate-pulse"
              >
                <td className="p-4">
                  <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-12"></div>
                </td>
                <td className="p-4">
                  <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-slate-700 dark:bg-slate-600 rounded w-24"></div>
                </td>
                <td className="p-4">
                  <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-16"></div>
                </td>
                <td className="p-4">
                  <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-slate-700 dark:bg-slate-600 rounded w-16"></div>
                </td>
                <td className="p-4">
                  <div className="h-6 bg-slate-700 dark:bg-slate-600 rounded-full w-16"></div>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <div className="h-8 bg-slate-700 dark:bg-slate-600 rounded w-8"></div>
                    <div className="h-8 bg-slate-700 dark:bg-slate-600 rounded w-8"></div>
                    <div className="h-8 bg-slate-700 dark:bg-slate-600 rounded w-8"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with stats */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-slate-700 dark:bg-slate-600 rounded w-20"></div>
            <div className="h-8 bg-slate-700 dark:bg-slate-600 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Screen reader text */}
      <div className="sr-only" role="status" aria-live="polite">
        Loading caption table...
      </div>
    </div>
  );
}

export default CaptionTableSkeleton;