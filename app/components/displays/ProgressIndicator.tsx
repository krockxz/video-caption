import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ProgressIndicatorProps {
  value: number; // 0-100
  label?: string;
  animated?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressIndicator({
  value,
  label,
  animated = false,
  showPercentage = true,
  size = 'md',
  className
}: ProgressIndicatorProps) {
  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          progress: 'h-1',
          text: 'text-xs',
          icon: 'h-3 w-3'
        };
      case 'md':
        return {
          progress: 'h-2',
          text: 'text-sm',
          icon: 'h-4 w-4'
        };
      case 'lg':
        return {
          progress: 'h-3',
          text: 'text-base',
          icon: 'h-5 w-5'
        };
      default:
        return {
          progress: 'h-2',
          text: 'text-sm',
          icon: 'h-4 w-4'
        };
    }
  };

  const sizeClasses = getSizeClasses(size);

  // Determine progress color based on value
  const getProgressColor = (value: number) => {
    if (value < 30) return 'bg-destructive';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-primary';
  };

  // Determine if progress is complete
  const isComplete = value >= 100;

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Header with label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <div className="flex items-center space-x-2">
              {animated && !isComplete && (
                <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses.icon)} />
              )}
              <span className={cn('font-medium text-muted-foreground', sizeClasses.text)}>
                {label}
              </span>
            </div>
          )}

          {showPercentage && (
            <span className={cn(
              'font-mono font-medium',
              value >= 100 ? 'text-primary' : 'text-muted-foreground',
              sizeClasses.text
            )}>
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="relative">
        <Progress
          value={value}
          className={cn(
            sizeClasses.progress,
            'transition-all duration-300 ease-in-out',
            animated && !isComplete && 'animate-pulse'
          )}
        />

        {/* Custom progress indicator styling */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-in-out',
            getProgressColor(value),
            animated && !isComplete && 'bg-opacity-75'
          )}
          style={{ width: `${value}%` }}
        />

        {/* Animated overlay for ongoing operations */}
        {animated && !isComplete && (
          <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide" />
        )}
      </div>

      {/* Status text based on progress */}
      {label && (
        <div className={cn('text-center text-muted-foreground', sizeClasses.text)}>
          {isComplete ? (
            <span className="text-primary font-medium">✓ Complete</span>
          ) : animated ? (
            <span>In progress...</span>
          ) : value > 0 ? (
            <span>{Math.round(value)}% complete</span>
          ) : (
            <span>Not started</span>
          )}
        </div>
      )}
    </div>
  );
}