import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Eye, Trash2, MoreVertical, Clock, FileVideo } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type VideoStatus = 'uploading' | 'processing' | 'captioning' | 'completed' | 'failed';

export interface VideoData {
  id: string;
  title: string;
  fileName: string;
  status: VideoStatus;
  uploadedAt: string;
  duration?: number;
  fileSize?: number;
  captionCount?: number;
  thumbnailUrl?: string;
}

export interface VideoCardProps {
  video: VideoData;
  onSelect: (videoId: string) => void;
  onDelete: (videoId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function VideoCard({
  video,
  onSelect,
  onDelete,
  isLoading = false,
  className
}: VideoCardProps) {
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${video.title}"?`)) {
      onDelete(video.id);
    }
  };

  const handleSelect = () => {
    if (!isLoading) {
      onSelect(video.id);
    }
  };

  return (
    <Card
      className={`
        group cursor-pointer transition-all duration-200 hover:shadow-md
        ${isLoading ? 'opacity-50' : ''}
        ${className}
      `}
      onClick={handleSelect}
    >
      {/* Thumbnail or placeholder */}
      <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileVideo className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-2 left-2">
          <StatusBadge status={video.status} />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>

          {/* Filename */}
          <p className="text-xs text-muted-foreground font-mono truncate" title={video.fileName}>
            {video.fileName}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              {video.fileSize && (
                <span>{formatFileSize(video.fileSize)}</span>
              )}
              {video.captionCount !== undefined && (
                <span>{video.captionCount} captions</span>
              )}
            </div>
          </div>

          {/* Upload time */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {getTimeAgo(video.uploadedAt)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
            disabled={isLoading}
          >
            <Eye className="h-3 w-3" />
            <span>View Details</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete video</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}