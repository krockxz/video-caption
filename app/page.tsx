'use client';

/**
 * Simple Test Page for Video Captioning Backend
 * One-page interface to test all backend functionality
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Video, Captions, Play, Download, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// Types
interface Video {
  id: string;
  title: string;
  fileName: string;
  duration: number | null;
  uploadedAt: string;
  status: string;
}

interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  language: string;
  style: string;
}

interface Render {
  id: string;
  captionStyle: string;
  status: string;
  outputPath: string | null;
  createdAt: string;
}

const HARDCODED_USER_ID = 'test-user-1';

export default function TestPage() {
  // State
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'default' | 'newsbar' | 'karaoke'>('default');

  // Load videos on mount
  useEffect(() => {
    loadVideos();
  }, []);

  // Load video details when selected
  useEffect(() => {
    if (selectedVideo) {
      loadVideoDetails(selectedVideo.id);
    }
  }, [selectedVideo]);

  // Load videos list
  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/videos');
      const data = await response.json();
      if (data.success) {
        setVideos(data.data.items);
      } else {
        setError(data.error || 'Failed to load videos');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Load video details
  const loadVideoDetails = async (videoId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos/${videoId}`);
      const data = await response.json();
      if (data.success) {
        setVideoDetails(data.data);
        setCaptions(data.data.captions || []);
        setRenders(data.data.renders || []);
      } else {
        setError(data.error || 'Failed to load video details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load video details');
    } finally {
      setLoading(false);
    }
  };

  // Upload video
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setError('File size exceeds 500MB limit');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('userId', HARDCODED_USER_ID);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Video uploaded successfully! ID: ${data.data.videoId}`);
        setUploadProgress(100);
        await loadVideos();
        // Auto-select the uploaded video
        if (data.data.videoId) {
          const newVideo = videos.find(v => v.id === data.data.videoId) || {
            id: data.data.videoId,
            title: data.data.title,
            fileName: data.data.fileName,
            duration: null,
            uploadedAt: new Date().toISOString(),
            status: data.data.status,
          };
          setSelectedVideo(newVideo);
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      // Reset file input
      e.target.value = '';
    }
  };

  // Generate captions
  const handleGenerateCaptions = async () => {
    if (!selectedVideo) return;

    try {
      setGeneratingCaptions(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/videos/${selectedVideo.id}/caption-generate`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Generated ${data.data.captions.length} captions!`);
        await loadVideoDetails(selectedVideo.id);
      } else {
        setError(data.error || 'Failed to generate captions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate captions');
    } finally {
      setGeneratingCaptions(false);
    }
  };

  // Create render job
  const handleRender = async () => {
    if (!selectedVideo) return;

    try {
      setRendering(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/videos/${selectedVideo.id}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          captionStyle: selectedStyle,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Render job created! ID: ${data.data.renderId}`);
        await loadVideoDetails(selectedVideo.id);
      } else {
        setError(data.error || 'Failed to create render job');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create render job');
    } finally {
      setRendering(false);
    }
  };

  // Delete video
  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Video deleted successfully');
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(null);
          setVideoDetails(null);
          setCaptions([]);
          setRenders([]);
        }
        await loadVideos();
      } else {
        setError(data.error || 'Failed to delete video');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  // Download rendered video
  const handleDownload = async (renderId: string) => {
    if (!selectedVideo) return;

    try {
      const response = await fetch(`/api/videos/${selectedVideo.id}/render/${renderId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rendered_${selectedVideo.id}_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('Download started');
      } else {
        const data = await response.json();
        setError(data.error || 'Download failed');
      }
    } catch (err: any) {
      setError(err.message || 'Download failed');
    }
  };

  // Check render status
  const checkRenderStatus = async (renderId: string) => {
    if (!selectedVideo) return;

    try {
      const response = await fetch(`/api/videos/${selectedVideo.id}/render/${renderId}`);
      const data = await response.json();
      if (data.success) {
        await loadVideoDetails(selectedVideo.id);
        if (data.data.status === 'completed') {
          setSuccess('Render completed!');
        } else if (data.data.status === 'failed') {
          setError('Render failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check render status');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Captioning Test Page</h1>
            <p className="text-muted-foreground mt-1">Test all backend functionality</p>
          </div>
          <Button onClick={loadVideos} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Video List */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="video-upload">Select MP4 file (max 500MB)</Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/mp4"
                    onChange={handleUpload}
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Videos ({videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && videos.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : videos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No videos uploaded yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedVideo?.id === video.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{video.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{video.fileName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{video.status}</Badge>
                              {video.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toFixed(0).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(video.id);
                            }}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Video Details & Actions */}
          <div className="space-y-6">
            {selectedVideo ? (
              <>
                {/* Video Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      {selectedVideo.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge>{selectedVideo.status}</Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">File</p>
                        <p className="truncate">{selectedVideo.fileName}</p>
                      </div>
                    </div>

                    {/* Captions Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center gap-2">
                          <Captions className="h-4 w-4" />
                          Captions ({captions.length})
                        </h3>
                        <Button
                          onClick={handleGenerateCaptions}
                          disabled={generatingCaptions || loading}
                          size="sm"
                        >
                          {generatingCaptions ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Captions className="h-4 w-4 mr-2" />
                              Generate Captions
                            </>
                          )}
                        </Button>
                      </div>
                      {captions.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1 text-sm border rounded p-2">
                          {captions.slice(0, 10).map((caption, idx) => (
                            <div key={caption.id || idx} className="p-2 bg-muted rounded">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>
                                  {caption.startTime.toFixed(1)}s - {caption.endTime.toFixed(1)}s
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {caption.language}
                                </Badge>
                              </div>
                              <p>{caption.text}</p>
                            </div>
                          ))}
                          {captions.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              ... and {captions.length - 10} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No captions yet. Click &quot;Generate Captions&quot; to create them.
                        </p>
                      )}
                    </div>

                    {/* Render Section */}
                    {captions.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Renders ({renders.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedStyle}
                              onValueChange={(value: 'default' | 'newsbar' | 'karaoke') =>
                                setSelectedStyle(value)
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default (Bottom)</SelectItem>
                                <SelectItem value="newsbar">News Bar (Top)</SelectItem>
                                <SelectItem value="karaoke">Karaoke (Highlighted)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={handleRender} disabled={rendering || loading}>
                              {rendering ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Rendering...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Render
                                </>
                              )}
                            </Button>
                          </div>
                          {renders.length > 0 && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {renders.map((render) => (
                                <div
                                  key={render.id}
                                  className="p-3 border rounded-lg flex items-center justify-between"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          render.status === 'completed'
                                            ? 'default'
                                            : render.status === 'failed'
                                            ? 'destructive'
                                            : 'outline'
                                        }
                                      >
                                        {render.status}
                                      </Badge>
                                      <span className="text-sm font-medium">{render.captionStyle}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(render.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {render.status === 'rendering' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => checkRenderStatus(render.id)}
                                      >
                                        <RefreshCw className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {render.status === 'completed' && render.outputPath && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(render.id)}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a video to view details and manage captions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
