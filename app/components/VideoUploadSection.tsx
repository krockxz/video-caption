import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadInput } from "@/components/forms/FileUploadInput";
import { ProgressIndicator } from "@/components/displays/ProgressIndicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, ArrowRight, X, Loader2 } from "lucide-react";
import { useVideoUpload } from "@/lib/hooks";

export interface VideoUploadSectionProps {
  onUploadStart?: () => void;
  onUploadComplete?: (videoId: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'completed' | 'error';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  estimatedTimeRemaining?: number;
}

export function VideoUploadSection({
  onUploadStart,
  onUploadComplete,
  onError,
  isLoading = false
}: VideoUploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');

  // Hardcoded user ID to match the one in the API
  const HARDCODED_USER_ID = 'test-user-1';

  // Use the real upload hook
  const {
    uploadVideo,
    isLoading: isUploading,
    progress,
    error,
    videoId,
    reset
  } = useVideoUpload(
    undefined, // validation options (use default)
    (videoId, response) => {
      setUploadState('completed');
      onUploadComplete?.(videoId);
    },
    (errorMessage) => {
      setUploadState('error');
      onError?.(errorMessage);
    },
    (progressValue) => {
      // Progress is handled by the hook
    }
  );

  const handleFileSelect = useCallback(async (file: File) => {
    if (isUploading || isLoading) return;

    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
    setUploadState('idle');
    reset();
  }, [isUploading, isLoading, reset]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !videoTitle.trim() || isUploading || isLoading) return;

    setUploadState('uploading');
    onUploadStart?.();

    try {
      await uploadVideo(selectedFile, videoTitle.trim());
    } catch (error) {
      // Error is handled by the hook
      console.error('Upload error:', error);
    }
  }, [selectedFile, videoTitle, isUploading, isLoading, uploadVideo, onUploadStart]);

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      handleUpload();
    }
  }, [selectedFile, handleUpload]);

  const handleReset = useCallback(() => {
    setUploadState('idle');
    setSelectedFile(null);
    setVideoTitle('');
    reset();
  }, [reset]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds || seconds < 1) return 'Calculating...';
    if (seconds < 60) return `~${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m`;
    return `~${Math.ceil(seconds / 3600)}h`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Video</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload Area */}
        {(uploadState === 'idle' || uploadState === 'error') && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                type="text"
                placeholder="Enter a title for your video..."
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                disabled={isUploading || isLoading}
              />
            </div>

            <FileUploadInput
              onFileSelect={handleFileSelect}
              accept=".mp4"
              maxSizeMB={500}
              disabled={isUploading || isLoading}
              error={error || undefined}
            />

            {/* Upload Button */}
            {selectedFile && videoTitle.trim() && (
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || isLoading || !videoTitle.trim()}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isUploading || isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}

            {uploadState === 'error' && (
              <div className="mt-4 flex items-center space-x-3">
                <Button variant="outline" onClick={handleRetry} disabled={isUploading || isLoading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Retry Upload
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">
                  {selectedFile.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {videoTitle}
                </span>
              </div>

              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>

            <ProgressIndicator
              value={progress}
              label="Uploading video"
              animated={true}
              showPercentage={true}
            />

            <div className="text-center text-sm text-muted-foreground">
              Please keep this tab open until upload completes
            </div>
          </div>
        )}

        {/* Success State */}
        {uploadState === 'completed' && videoId && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="space-y-2">
                  <div className="font-medium">Upload completed successfully!</div>
                  <div className="text-sm opacity-90">
                    Video ID: <code className="bg-green-100 px-1 py-0.5 rounded text-xs">{videoId}</code>
                  </div>
                  <div className="text-sm opacity-90">
                    Title: {videoTitle}
                  </div>
                  {selectedFile && (
                    <div className="text-sm opacity-90">
                      File: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => onUploadComplete?.(videoId)}
                className="flex items-center space-x-2"
              >
                <span>Generate Captions</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={handleReset}>
                Upload Another Video
              </Button>
            </div>
          </div>
        )}

        {/* Upload Requirements */}
        {uploadState === 'idle' && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-medium">Upload Requirements:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>File format: MP4 only</li>
              <li>Maximum file size: 500MB</li>
              <li>Video duration: Up to 2 hours recommended</li>
              <li>Clear audio for best caption results</li>
            </ul>
          </div>
        )}

        {/* Loading State */}
        {(isUploading || isLoading) && !selectedFile && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Initializing upload...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}