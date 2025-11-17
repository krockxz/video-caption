import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaptionStyleSelector } from "@/components/forms/CaptionStyleSelector";
import { ProgressIndicator } from "@/components/displays/ProgressIndicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
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
import { useRender } from "@/lib/hooks";
import { useVideoDetails } from "@/lib/hooks";
import { downloadRenderedVideo } from "@/lib/api-client";
import { useAppContext } from "@/lib/context/AppContext";
import { RemotionPlayerPreview } from "@/components/RemotionPlayerPreview";

export interface RenderPreviewSectionProps {
  videoId: string;
}

export function RenderPreviewSection({
  videoId
}: RenderPreviewSectionProps) {
  const { showNotification } = useAppContext();
  const [selectedStyle, setSelectedStyle] = useState('default');
  
  // Fetch video details and captions
  const {
    video,
    captions,
    isLoading: isLoadingVideo
  } = useVideoDetails(videoId || '', undefined, false);

  // Use render hook for real-time render status
  const {
    startRender,
    status: renderStatus,
    progress: renderProgress,
    estimatedTimeRemaining,
    currentStage,
    publicUrl: renderedUrl,
    renderId,
    error: renderError,
    isLoading: isRendering
  } = useRender(
    videoId || '',
    selectedStyle,
    2000, // polling interval
    true, // auto-stop polling
    undefined, // onProgress
    (render) => {
      showNotification('success', 'Video rendering completed!');
    },
    (error) => {
      showNotification('error', `Render failed: ${error}`);
    }
  );

  const videoPath = video?.filePath ? `/uploads/${video.filePath.split('/').pop()}` : undefined;

  const handleRenderClick = useCallback(async () => {
    if (isRendering || !captions.length || !videoId) return;
    
    showNotification('info', 'Starting video render...');
    await startRender();
  }, [isRendering, captions.length, videoId, selectedStyle, startRender, showNotification]);

  const handleDownloadClick = useCallback(async () => {
    if (!videoId || !renderId) {
      showNotification('error', 'No render available to download');
      return;
    }

    try {
      showNotification('info', 'Preparing download...');
      await downloadRenderedVideo(videoId, renderId);
      showNotification('success', 'Download started!');
    } catch (error) {
      showNotification('error', 'Failed to download video');
      console.error('Download error:', error);
    }
  }, [videoId, renderId, showNotification]);

  const handleRetryRender = useCallback(() => {
    if (videoId && captions.length) {
      handleRenderClick();
    }
  }, [videoId, captions.length, handleRenderClick]);

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds || seconds < 1) return 'Calculating...';
    if (seconds < 60) return `~${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m`;
    return `~${Math.ceil(seconds / 3600)}h`;
  };

  const hasCaptions = captions.length > 0;
  const canRender = hasCaptions && !isRendering && renderStatus === 'idle';
  const showRenderButton = hasCaptions && renderStatus !== 'completed';

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
            {/* Remotion Player Preview with Real-time Captions */}
            {videoPath && hasCaptions ? (
              <RemotionPlayerPreview
                videoPath={videoPath}
                captions={captions}
                style={selectedStyle as 'default' | 'newsbar' | 'karaoke'}
                width={1920}
                height={1080}
                fps={30}
                className="w-full"
              />
            ) : videoPath ? (
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Generate captions to see preview with Remotion Player
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Upload a video to start
                  </p>
                </div>
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
            {(renderStatus === 'rendering' || renderStatus === 'pending') && (
              <div className="space-y-3">
                <ProgressIndicator
                  value={renderProgress}
                  label="Rendering video"
                  animated={true}
                  showPercentage={true}
                />

                {estimatedTimeRemaining && (
                  <div className="text-center text-sm text-muted-foreground">
                    {formatTimeRemaining(estimatedTimeRemaining)} remaining
                  </div>
                )}

                {currentStage && (
                  <div className="text-center text-xs text-muted-foreground">
                    {currentStage}
                  </div>
                )}
              </div>
            )}

            {/* Render Status Alerts */}
            {renderStatus === 'completed' && (
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

            {renderStatus === 'failed' && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="space-y-2">
                    <div className="font-medium">Render failed</div>
                    <div className="text-sm opacity-90">
                      {renderError || 'There was an error rendering your video. Please try again.'}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Download Section */}
            {renderStatus === 'completed' && renderId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Output Video</div>
                    <div className="text-xs text-muted-foreground">Ready for download</div>
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

                  {renderedUrl && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(renderedUrl);
                        showNotification('success', 'Share link copied to clipboard!');
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy Share Link
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Retry Button */}
            {renderStatus === 'failed' && (
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