import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoCard, VideoData } from "@/components/displays/VideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Upload,
  Video,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Grid3X3,
  List
} from "lucide-react";

export interface VideoListSectionProps {
  videos: VideoData[];
  selectedVideoId?: string;
  onSelectVideo?: (videoId: string) => void;
  onDeleteVideo?: (videoId: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export type VideoStatus = 'uploading' | 'processing' | 'captioning' | 'completed' | 'failed';

export interface ExtendedVideoData extends VideoData {
  // Additional fields that might come from the API
  captions?: any[];
  renderJobs?: any[];
  thumbnailUrl?: string;
  processingProgress?: number;
  error?: string;
}

export type ViewMode = 'grid' | 'list';
export type FilterStatus = 'all' | 'completed' | 'processing' | 'failed' | 'uploading';

export function VideoListSection({
  videos,
  selectedVideoId,
  onSelectVideo,
  onDeleteVideo,
  isLoading = false,
  hasMore = false,
  onLoadMore
}: VideoListSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<'uploadedAt' | 'title' | 'duration'>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos.filter(video => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.fileName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = filterStatus === 'all' || video.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort videos
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'uploadedAt':
        default:
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [videos, searchTerm, filterStatus, sortBy, sortOrder]);

  // Get status counts for filters
  const statusCounts = useMemo(() => {
    const counts = {
      all: videos.length,
      completed: videos.filter(v => v.status === 'completed').length,
      processing: videos.filter(v => ['processing', 'captioning'].includes(v.status)).length,
      failed: videos.filter(v => v.status === 'failed').length,
      uploading: videos.filter(v => v.status === 'uploading').length
    };
    return counts;
  }, [videos]);

  const handleVideoSelect = useCallback((videoId: string) => {
    onSelectVideo?.(videoId);
  }, [onSelectVideo]);

  const handleVideoDelete = useCallback((videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      onDeleteVideo?.(videoId);
    }
  }, [onDeleteVideo]);

  const handleSort = useCallback((field: 'uploadedAt' | 'title' | 'duration') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const getStatusIcon = (status: VideoStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'captioning':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'uploading':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const isLoadingVideos = isLoading && filteredAndSortedVideos.length === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>My Videos</span>
            <Badge variant="secondary">{statusCounts.all}</Badge>
          </CardTitle>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos by title or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filters */}
          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="flex items-center space-x-1">
                <span>All</span>
                <Badge variant="secondary" className="text-xs">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Completed</span>
                <Badge variant="secondary" className="text-xs">
                  {statusCounts.completed}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center space-x-1">
                <Loader2 className="h-3 w-3" />
                <span>Processing</span>
                <Badge variant="secondary" className="text-xs">
                  {statusCounts.processing}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="uploading" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Uploading</span>
                <Badge variant="secondary" className="text-xs">
                  {statusCounts.uploading}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Failed</span>
                <Badge variant="secondary" className="text-xs">
                  {statusCounts.failed}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sort Options */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Sort by:</span>
            <Button
              variant={sortBy === 'uploadedAt' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => handleSort('uploadedAt')}
              className="h-auto p-1 text-xs"
            >
              Upload Date {sortBy === 'uploadedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={sortBy === 'title' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => handleSort('title')}
              className="h-auto p-1 text-xs"
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={sortBy === 'duration' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => handleSort('duration')}
              className="h-auto p-1 text-xs"
            >
              Duration {sortBy === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Loading State */}
        {isLoadingVideos && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading your videos...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingVideos && filteredAndSortedVideos.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {searchTerm || filterStatus !== 'all'
                  ? 'No videos match your criteria'
                  : 'No videos uploaded yet'
                }
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first video to get started with captioning'
                }
              </p>
            </div>
            {!searchTerm && filterStatus === 'all' && (
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Video
              </Button>
            )}
          </div>
        )}

        {/* Video Grid/List */}
        {!isLoadingVideos && filteredAndSortedVideos.length > 0 && (
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onSelect={handleVideoSelect}
                    onDelete={handleVideoDelete}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                      ${selectedVideoId === video.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    onClick={() => handleVideoSelect(video.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(video.status)}
                          <div>
                            <h4 className="font-medium">{video.title}</h4>
                            <p className="text-sm text-muted-foreground">{video.fileName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="text-right">
                          <div>{video.duration ? `${Math.floor(video.duration / 60)}m` : '--'}</div>
                          <div>{new Date(video.uploadedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Videos'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {!isLoadingVideos && filteredAndSortedVideos.length > 0 && (
          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            Showing {filteredAndSortedVideos.length} of {videos.length} videos
            {(searchTerm || filterStatus !== 'all') && ' (filtered)'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}