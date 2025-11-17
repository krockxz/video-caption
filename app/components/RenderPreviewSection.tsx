import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaptionStyleSelector } from "@/components/forms/CaptionStyleSelector";
import { ProgressIndicator } from "@/components/displays/ProgressIndicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Download,
  Eye,
  Clock,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Share2
} from "lucide-react";

export interface RenderPreviewSectionProps {
  videoId: string;
  videoPath?: string;
  captions: any[];
  isLoading?: boolean;
  isRendering?: boolean;
  renderStatus?: 'idle' | 'pending' | 'rendering' | 'completed' | 'failed';
  renderedVideoUrl?: string;
  onRenderClick?: (style: string) => void;
  onDownloadClick?: () => void;
}

type RenderStatus = 'idle' | 'pending' | 'rendering' | 'completed' | 'failed';

interface RenderProgress {
  percentage: number;
  estimatedTimeRemaining?: number;
  currentStage?: string;
  totalStages?: number;
  completedStages?: number;
}

export function RenderPreviewSection({
  videoId,
  videoPath,
  captions,
  isLoading = false,
  isRendering = false,
  renderStatus = 'idle',
  renderedVideoUrl,
  onRenderClick,
  onDownloadClick
}: RenderPreviewSectionProps) {
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [currentRenderStatus, setCurrentRenderStatus] = useState<RenderStatus>(renderStatus);
  const [renderProgress, setRenderProgress] = useState<RenderProgress>({
    percentage: 0,
    estimatedTimeRemaining: undefined,
    currentStage: undefined
  });
  const [renderedUrl, setRenderedUrl] = useState<string | null>(renderedVideoUrl || null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Simulate render progress
  const simulateRenderProgress = useCallback(() => {
    const stages = [
      'Processing captions',
      'Generating video frames',
      'Applying caption overlays',
      'Encoding final video',
      'Finalizing output'
    ];

    let currentStage = 0;
    const progressInterval = setInterval(() => {
      currentStage++;

      const stagePercentage = (currentStage / stages.length) * 100;
      const estimatedTimeRemaining = (stages.length - currentStage) * 15; // 15s per stage

      setRenderProgress({
        percentage: stagePercentage,
        estimatedTimeRemaining,
        currentStage: stages[currentStage - 1],
        totalStages: stages.length,
        completedStages: currentStage
      });

      if (currentStage >= stages.length) {
        clearInterval(progressInterval);
        setCurrentRenderStatus('completed');
        setRenderedUrl(`/api/videos/${videoId}/render/${selectedStyle}/output.mp4`);
        setRenderProgress({
          percentage: 100,
          estimatedTimeRemaining: 0,
          currentStage: 'Render completed'
        });
      }
    }, 2000); // Update every 2 seconds

    return progressInterval;
  }, [videoId, selectedStyle]);

  const handleRenderClick = useCallback(() => {
    if (isRendering || !captions.length) return;

    setCurrentRenderStatus('rendering');
    setRenderProgress({ percentage: 0, currentStage: 'Starting render...' });
    onRenderClick?.(selectedStyle);

    // Start simulated progress
    const interval = simulateRenderProgress();

    // Cleanup interval when component unmounts or status changes
    return () => clearInterval(interval);
  }, [isRendering, captions.length, selectedStyle, onRenderClick, simulateRenderProgress]);

  const handleDownloadClick = useCallback(() => {
    if (renderedUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = renderedUrl;
      link.download = `video_${videoId}_with_${selectedStyle}_captions.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    onDownloadClick?.();
  }, [renderedUrl, videoId, selectedStyle, onDownloadClick]);

  const handleRetryRender = useCallback(() => {
    setCurrentRenderStatus('idle');
    setRenderProgress({ percentage: 0 });
    setRenderedUrl(null);
  }, []);

  // Handle video events
  const handleVideoRef = useCallback((element: HTMLVideoElement) => {
    setVideoElement(element);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  }, [videoElement, isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoElement) return;

    setCurrentTime(videoElement.currentTime);
    setIsPlaying(!videoElement.paused);
  }, [videoElement]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoElement) return;
    setDuration(videoElement.duration);
  }, [videoElement]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (url: string): string => {
    // This would normally come from the API response
    return '~15.2 MB';
  };

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds || seconds < 1) return 'Calculating...';
    if (seconds < 60) return `~${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m`;
    return `~${Math.ceil(seconds / 3600)}h`;
  };

  const hasCaptions = captions.length > 0;
  const canRender = hasCaptions && !isRendering && currentRenderStatus === 'idle';
  const showRenderButton = hasCaptions && currentRenderStatus !== 'completed';

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Preview Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Video Preview</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Video Player */}
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
              {videoPath ? (
                <video
                  ref={handleVideoRef}
                  src={videoPath}
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      {hasCaptions ? 'Select a style and click render to see preview' : 'Upload a video to start'}
                    </p>
                  </div>
                </div>
              )}

              {/* Caption Overlay (Mock) */}
              {videoPath && hasCaptions && (
                <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
                  <div className="bg-black/75 text-white px-4 py-2 rounded-lg">
                    <p className="text-center">
                      Sample caption text in {selectedStyle} style
                    </p>
                  </div>
                </div>
              )}

              {/* Play/Pause Button Overlay */}
              {videoPath && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                >
                  <div className="bg-white/90 rounded-full p-3">
                    {isPlaying ? (
                      <div className="w-6 h-6 bg-slate-900 rounded-sm" />
                    ) : (
                      <Play className="h-6 w-6 text-slate-900 ml-1" />
                    )}
                  </div>
                </button>
              )}
            </div>

            {/* Video Controls */}
            {videoPath && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    if (videoElement) {
                      videoElement.currentTime = parseFloat(e.target.value);
                    }
                  }}
                  className="w-full"
                />
              </div>
            )}

            {/* Caption Info */}
            {hasCaptions && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{captions.length} captions</Badge>
                  <span className="text-sm text-muted-foreground">
                    Duration: {formatTime(captions[captions.length - 1]?.endTime || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Render Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Render Controls</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Caption Style Selector */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Caption Style</h3>
              <CaptionStyleSelector
                value={selectedStyle}
                onChange={setSelectedStyle}
                disabled={isRendering}
              />
            </div>

            {/* Render Button */}
            {showRenderButton && (
              <Button
                onClick={handleRenderClick}
                disabled={!canRender}
                className="w-full"
                size="lg"
              >
                {isRendering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Start Rendering
                  </>
                )}
              </Button>
            )}

            {/* Render Progress */}
            {currentRenderStatus === 'rendering' && (
              <div className="space-y-3">
                <ProgressIndicator
                  value={renderProgress.percentage}
                  label="Rendering video"
                  animated={true}
                  showPercentage={true}
                />

                {renderProgress.estimatedTimeRemaining && (
                  <div className="text-center text-sm text-muted-foreground">
                    {formatTimeRemaining(renderProgress.estimatedTimeRemaining)} remaining
                  </div>
                )}

                {renderProgress.currentStage && (
                  <div className="text-center text-xs text-muted-foreground">
                    {renderProgress.currentStage}
                  </div>
                )}
              </div>
            )}

            {/* Render Status Alerts */}
            {currentRenderStatus === 'completed' && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-2">
                    <div className="font-medium">Render completed successfully!</div>
                    <div className="text-sm opacity-90">
                      Your video with {selectedStyle} captions is ready
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {currentRenderStatus === 'failed' && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="space-y-2">
                    <div className="font-medium">Render failed</div>
                    <div className="text-sm opacity-90">
                      There was an error rendering your video. Please try again.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Download Section */}
            {currentRenderStatus === 'completed' && renderedUrl && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Output Video</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(renderedUrl)}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ready
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={handleDownloadClick} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download MP4
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </Button>
                </div>
              </div>
            )}

            {/* Retry Button */}
            {currentRenderStatus === 'failed' && (
              <Button onClick={handleRetryRender} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            {/* No Captions Message */}
            {!hasCaptions && (
              <div className="text-center space-y-2 p-4">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Generate captions first before rendering
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}