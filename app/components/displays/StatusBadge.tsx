import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, AlertCircle, Clock, UploadCloud, FileText } from "lucide-react";

export type StatusType = 'uploading' | 'processing' | 'captioning' | 'completed' | 'failed';

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className
}: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'uploading':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
          icon: UploadCloud,
          label: 'Uploading'
        };
      case 'processing':
        return {
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
          icon: Loader2,
          label: 'Processing',
          animated: true
        };
      case 'captioning':
        return {
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
          icon: FileText,
          label: 'Captioning',
          animated: true
        };
      case 'completed':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/30',
          icon: CheckCircle,
          label: 'Completed'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
          icon: AlertCircle,
          label: 'Failed'
        };
      default:
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
          icon: Clock,
          label: 'Unknown'
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'md':
        return 'text-sm px-2.5 py-1';
      case 'lg':
        return 'text-base px-3 py-1.5';
      default:
        return 'text-sm px-2.5 py-1';
    }
  };

  const getIconSize = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'md':
        return 'h-4 w-4';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        getSizeClasses(size),
        config.className,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            getIconSize(size),
            config.animated && 'animate-spin'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}