import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileVideo, Clock, HardDrive, Calendar } from "lucide-react";

export interface VideoMetadata {
  fileName: string;
  fileSize: number;
  duration?: number;
  uploadedAt?: string;
  resolution?: string;
  format?: string;
}

export interface VideoMetadataFormProps {
  title: string;
  onTitleChange: (title: string) => void;
  metadata: VideoMetadata;
  disabled?: boolean;
  className?: string;
}

export function VideoMetadataForm({
  title,
  onTitleChange,
  metadata,
  disabled = false,
  className
}: VideoMetadataFormProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Editable Title */}
      <div className="space-y-2">
        <Label htmlFor="video-title" className="text-sm font-medium">
          Video Title
        </Label>
        <Input
          id="video-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter a descriptive title for your video"
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          A descriptive title helps you organize and find your videos easily.
        </p>
      </div>

      {/* File Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <FileVideo className="h-4 w-4" />
            <span>File Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Name */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">File Name:</span>
            <span className="text-sm font-medium font-mono truncate max-w-[200px]" title={metadata.fileName}>
              {metadata.fileName}
            </span>
          </div>

          {/* File Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">File Size:</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(metadata.fileSize)}
            </Badge>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duration:</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {formatDuration(metadata.duration)}
            </Badge>
          </div>

          {/* Upload Date */}
          {metadata.uploadedAt && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Uploaded:</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(metadata.uploadedAt)}
              </span>
            </div>
          )}

          {/* Format and Resolution (if available) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Format:</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {metadata.format || 'MP4'}
              </Badge>
              {metadata.resolution && (
                <Badge variant="outline" className="text-xs">
                  {metadata.resolution}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">File Size (bytes):</span>
              <p className="font-mono text-xs">{metadata.fileSize.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Duration (seconds):</span>
              <p className="font-mono text-xs">
                {metadata.duration ? metadata.duration.toFixed(2) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Processing Status */}
          <div className="pt-2 border-t">
            <span className="text-sm text-muted-foreground">Processing Status:</span>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                Ready for captioning
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}