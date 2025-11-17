'use client';

/**
 * Main Dashboard Page - Video Captioning Platform
 * Responsive layout with video management and caption editing features
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useAppContext } from '@/lib/context/AppContext';
import { useVideoList } from '@/lib/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { VideoUploadSection } from '@/components/VideoUploadSection';
import { VideoListSection } from '@/components/VideoListSection';
import { CaptionManagerSection } from '@/components/CaptionManagerSection';
import { RenderPreviewSection } from '@/components/RenderPreviewSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Video, Captions, Play, Settings, AlertCircle } from 'lucide-react';
import type { Video as VideoType, VideoListItem } from '@/lib/types/api';

/**
 * Dashboard content component that uses app context
 */
function DashboardContent() {
  const {
    selectedVideoId,
    setSelectedVideoId,
    showNotification,
    apiStatus,
    isOnline
  } = useAppContext();

  // Video list management
  const {
    videos,
    isLoading: videosLoading,
    error: videosError,
    refetch,
    hasMore,
    loadMore,
    pagination
  } = useVideoList(
    20, // limit
    undefined, // cache config (use default)
    undefined // filters (use default)
  );

  // Local state for UI
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | VideoListItem | null>(null);

  // Find selected video when ID changes
  useEffect(() => {
    if (selectedVideoId && videos && videos.length > 0) {
      const video = videos.find(v => v.id === selectedVideoId);
      setSelectedVideo(video || null);
    } else {
      setSelectedVideo(null);
    }
  }, [selectedVideoId, videos]);

  // Handle video selection
  const handleVideoSelect = useCallback((video: VideoType | VideoListItem) => {
    setSelectedVideoId(video.id);
    setSelectedVideo(video);
    showNotification('info', `Selected video: ${video.title}`);
  }, [setSelectedVideoId, showNotification]);

  // Handle video upload success
  const handleUploadComplete = useCallback((videoId: string) => {
    showNotification('success', 'Video uploaded successfully!');
    // Refresh the video list
    refetch();
  }, [showNotification, refetch]);

  // Refresh video list
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showNotification('success', 'Video list refreshed');
    } catch (error) {
      showNotification('error', 'Failed to refresh video list');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, showNotification]);

  // Check if we should show content
  const hasVideos = videos && videos.length > 0;
  const showVideoDetails = selectedVideoId && selectedVideo;
  const totalCount = pagination?.total || 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Video Captioning Dashboard
              </h1>
              <p className="text-muted-foreground">
                Upload videos, generate captions, and render captioned content
              </p>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-4">
              {/* API Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  apiStatus === 'healthy' ? 'bg-green-500' :
                  apiStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="text-sm text-muted-foreground">
                  {apiStatus === 'healthy' ? 'API Online' :
                   apiStatus === 'checking' ? 'Checking...' :
                   'API Offline'}
                </span>
              </div>

              {/* Network Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-muted-foreground">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || !isOnline}
                className="flex items-center gap-2"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* API Status Alert */}
        {!isOnline && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are currently offline. Some features may not be available.
            </AlertDescription>
          </Alert>
        )}

        {apiStatus === 'unhealthy' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The API is currently experiencing issues. Some features may not work correctly.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Video Upload and List (40%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Upload Section */}
            <VideoUploadSection
              onUploadComplete={handleUploadComplete}
              onError={(error) => showNotification('error', error)}
            />

            {/* Video List Section */}
            <VideoListSection
              videos={videos || []}
              selectedVideoId={selectedVideoId}
              onSelectVideo={(videoId: string) => {
                const video = videos?.find(v => v.id === videoId);
                if (video) handleVideoSelect(video);
              }}
              isLoading={videosLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </div>

          {/* Right Column - Video Details and Controls (60%) */}
          <div className="lg:col-span-3 space-y-6">
            {showVideoDetails ? (
              <>
                {/* Caption Manager Section */}
                <CaptionManagerSection
                  videoId={selectedVideoId}
                  captions={[]} // Will be populated by the component's own hook
                />

                {/* Render Preview Section */}
                <RenderPreviewSection
                  videoId={selectedVideoId}
                  captions={[]} // Will be populated by the component's own hook
                />
              </>
            ) : (
              // Placeholder when no video is selected
              <div className="text-center py-12 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Video className="h-6 w-6" />
                      Select a Video
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Choose a video from the list to view and manage captions, or upload a new video to get started.
                      </p>

                      {hasVideos ? (
                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                          <span>{totalCount} videos available</span>
                          <span>•</span>
                          <span>Click on any video to begin</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Upload className="h-4 w-4" />
                          <span>No videos yet - upload your first video above</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="font-medium mb-1">Upload</h3>
                      <p className="text-sm text-muted-foreground">
                        Add MP4 videos up to 500MB
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Captions className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="font-medium mb-1">Caption</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate AI-powered captions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="font-medium mb-1">Render</h3>
                      <p className="text-sm text-muted-foreground">
                        Export captioned videos
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/**
 * Main dashboard page with AppProvider wrapper
 */
export default function DashboardPage() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}