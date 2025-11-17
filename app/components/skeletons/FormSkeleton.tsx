/**
 * FormSkeleton - Skeleton loading state for form inputs
 * Configurable skeleton for different form layouts
 */

import React from 'react';

export interface FormSkeletonProps {
  /** Number of input fields to show */
  fields?: number;
  /** Show submit button */
  showButton?: boolean;
  /** Show file upload area */
  showFileUpload?: boolean;
  /** Form layout type */
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** Additional CSS classes */
  className?: string;
}

export function FormSkeleton({
  fields = 4,
  showButton = true,
  showFileUpload = false,
  layout = 'vertical',
  className = ''
}: FormSkeletonProps) {
  return (
    <div className={`bg-card rounded-lg border border-border p-6 animate-pulse ${className}`}
         role="status"
         aria-label="Loading form">

      {/* Form title */}
      <div className="mb-6">
        <div className="h-6 bg-slate-700 dark:bg-slate-600 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-2/3"></div>
      </div>

      {/* File upload area */}
      {showFileUpload && (
        <div className="mb-6">
          <div className="h-5 bg-slate-700 dark:bg-slate-600 rounded w-1/4 mb-3"></div>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20">
            <div className="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-3 bg-slate-700 dark:bg-slate-600 rounded w-1/3 mx-auto"></div>
            <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-32 mx-auto mt-4"></div>
          </div>
        </div>
      )}

      {/* Form fields */}
      <div className={
        layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' :
        layout === 'horizontal' ? 'space-y-4' :
        'space-y-6'
      }>
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className={
            layout === 'horizontal' ? 'flex items-center gap-4' : ''
          }>
            {/* Label */}
            <div className={layout === 'horizontal' ? 'w-1/3' : ''}>
              <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-20 mb-2"></div>
            </div>

            {/* Input */}
            <div className={layout === 'horizontal' ? 'w-2/3' : ''}>
              <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-full mb-2"></div>
              {layout !== 'horizontal' && (
                <div className="h-3 bg-slate-700 dark:bg-slate-600 rounded w-3/4"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Form actions */}
      {showButton && (
        <div className="mt-8 flex gap-3 justify-end">
          <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-24"></div>
          <div className="h-10 bg-slate-700 dark:bg-slate-600 rounded w-32"></div>
        </div>
      )}

      {/* Loading indicator */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 bg-slate-700 dark:bg-slate-600 rounded-full animate-pulse"></div>
          <div className="h-3 bg-slate-700 dark:bg-slate-600 rounded w-16"></div>
        </div>
      </div>

      {/* Screen reader text */}
      <div className="sr-only">
        Loading form fields...
      </div>
    </div>
  );
}

export default FormSkeleton;