/**
 * Comprehensive TypeScript types for API responses and requests
 * for the Video Captioning Platform
 */

// ===================================
// BASE TYPES
// ===================================

/**
 * Standard API response wrapper for all endpoints
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data if successful */
  data?: T;
  /** Error message if unsuccessful */
  error?: string;
  /** Additional message for user feedback */
  message?: string;
  /** HTTP status code */
  status?: number;
  /** Request ID for debugging */
  requestId?: string;
  /** Additional error details */
  details?: any;
}

/**
 * Error response for API errors
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** HTTP status code */
  status?: number;
  /** Detailed error message */
  message: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** Error code for programmatic handling */
  code?: string;
}

// ===================================
// VIDEO TYPES
// ===================================

/**
 * Video processing status types
 */
export type VideoStatus = 'uploading' | 'processing' | 'captioning' | 'completed' | 'failed';

/**
 * Complete video object with all relationships
 */
export interface Video {
  /** Unique identifier for the video */
  id: string;
  /** User ID who owns the video */
  userId: string;
  /** Human-readable title of the video */
  title: string;
  /** Original filename of the uploaded file */
  fileName: string;
  /** Server path where the video file is stored */
  filePath: string;
  /** Duration of the video in seconds */
  duration?: number;
  /** File size in bytes */
  fileSize?: number;
  /** ISO timestamp when the video was uploaded */
  uploadedAt: string;
  /** Current processing status of the video */
  status: VideoStatus;
  /** Video resolution (e.g., "1920x1080") */
  resolution?: string;
  /** Video format (e.g., "MP4") */
  format?: string;
  /** Associated captions for this video */
  captions?: Caption[];
  /** Render jobs associated with this video */
  renders?: Render[];
  /** Error message if status is failed */
  error?: string;
}

/**
 * Lightweight video type for list views
 */
export interface VideoListItem {
  id: string;
  title: string;
  fileName: string;
  duration?: number;
  fileSize?: number;
  uploadedAt: string;
  status: VideoStatus;
  captionCount?: number;
  thumbnailUrl?: string;
}

/**
 * Video list filters and pagination
 */
export interface VideoFilters {
  /** Filter by status */
  status?: VideoStatus | VideoStatus[];
  /** Search term for title or filename */
  search?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by upload date range */
  uploadedAfter?: string;
  /** Filter by upload date range */
  uploadedBefore?: string;
  /** Sort field */
  sortBy?: 'uploadedAt' | 'title' | 'duration' | 'fileSize';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

// ===================================
// CAPTION TYPES
// ===================================

/**
 * Caption style options
 */
export type CaptionStyle = 'default' | 'newsbar' | 'karaoke';

/**
 * Complete caption object
 */
export interface Caption {
  /** Unique identifier for the caption */
  id: string;
  /** ID of the associated video */
  videoId: string;
  /** Text content of the caption */
  text: string;
  /** Start time in seconds from video beginning */
  startTime: number;
  /** End time in seconds from video beginning */
  endTime: number;
  /** Language code of the caption (e.g., "en", "hi") */
  language: string;
  /** Style to use for displaying this caption */
  style: CaptionStyle;
    /** Confidence score from speech recognition (0-1) */
  confidence?: number;
  /** Whether caption has unsaved changes */
  hasChanges?: boolean;
}

/**
 * Caption input for creation/update
 */
export interface CaptionInput {
  text: string;
  startTime: number;
  endTime: number;
  language: string;
  style: CaptionStyle;
}

/**
 * Caption generation options
 */
export interface CaptionGenerateOptions {
  /** Target language for captions */
  language?: string;
  /** Whether to enable automatic language detection */
  autoDetectLanguage?: boolean;
  /** Caption style to use for generation */
  style?: CaptionStyle;
  /** Whether to generate timestamps */
  includeTimestamps?: boolean;
  /** Whether to generate confidence scores */
  includeConfidence?: boolean;
}

// ===================================
// RENDER TYPES
// ===================================

/**
 * Render job status types
 */
export type RenderStatus = 'pending' | 'rendering' | 'completed' | 'failed';

/**
 * Complete render job object
 */
export interface Render {
  /** Unique identifier for the render job */
  id: string;
  /** ID of the associated video */
  videoId: string;
  /** Caption style used for this render */
  captionStyle: string;
  /** Current status of the render job */
  status: RenderStatus;
  /** Server path where rendered video is stored */
  outputPath?: string;
  /** Public URL for accessing the rendered video */
  publicUrl?: string;
  /** ISO timestamp when render was created */
  createdAt: string;
  /** ISO timestamp when render completed */
  completedAt?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Current processing stage */
  currentStage?: string;
  /** File size of rendered output in bytes */
  outputSize?: number;
  /** Error message if status is failed */
  error?: string;
}

/**
 * Render job creation options
 */
export interface RenderOptions {
  /** Caption style to use */
  captionStyle: CaptionStyle;
  /** Output video quality */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  /** Output video format */
  format?: 'mp4' | 'webm';
  /** Whether to include original audio */
  includeAudio?: boolean;
  /** Background color for captions */
  backgroundColor?: string;
  /** Text color for captions */
  textColor?: string;
  /** Font size for captions */
  fontSize?: 'small' | 'medium' | 'large';
  /** Caption position */
  position?: 'bottom' | 'center' | 'top';
}

// ===================================
// PAGINATION TYPES
// ===================================

/**
 * Pagination information
 */
export interface PaginationInfo {
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Pagination information */
  pagination: PaginationInfo;
}

// ===================================
// USER TYPES
// ===================================

/**
 * User account information
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User email address */
  email: string;
  /** User display name */
  displayName?: string;
  /** Account creation timestamp */
  createdAt: string;
  /** Last login timestamp */
  lastLoginAt?: string;
  /** User subscription tier */
  tier: 'free' | 'pro' | 'enterprise';
  /** Storage quota in bytes */
  storageQuota: number;
  /** Current storage usage in bytes */
  storageUsed: number;
  /** Whether user account is active */
  isActive: boolean;
}

// ===================================
// UPLOAD TYPES
// ===================================

/**
 * File upload metadata
 */
export interface FileUploadMetadata {
  /** Original filename */
  fileName: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Video duration in seconds (if video) */
  duration?: number;
  /** Video resolution */
  resolution?: string;
  /** Video frame rate */
  frameRate?: number;
  /** Video bitrate */
  bitrate?: number;
  /** Audio channels */
  audioChannels?: number;
  /** Audio sample rate */
  audioSampleRate?: number;
}

/**
 * Video upload response
 */
export interface UploadResponse {
  /** Unique identifier for the uploaded video */
  videoId: string;
  /** Original filename */
  fileName: string;
  /** Server storage path */
  uploadPath: string;
  /** Initial processing status */
  status: VideoStatus;
  /** File size in bytes */
  fileSize: number;
  /** Temporary URL for accessing uploaded file */
  tempUrl?: string;
}

/**
 * Upload form data
 */
export interface UploadFormData {
  video: File;
  title: string;
  userId: string;
}

// ===================================
// HEALTH AND MONITORING TYPES
// ===================================

/**
 * Health check response
 */
export interface HealthResponse {
  /** Overall API health status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Timestamp of health check */
  timestamp: string;
  /** Uptime in seconds */
  uptime: number;
  /** Version of the API */
  version: string;
  /** Status of individual services */
  services: {
    /** Database connection status */
    database: ServiceStatus;
    /** File storage status */
    storage: ServiceStatus;
    /** Whisper API status */
    whisper: ServiceStatus;
    /** Remotion rendering status */
    remotion: ServiceStatus;
  };
  /** Performance metrics */
  metrics?: {
    /** Memory usage percentage */
    memoryUsage?: number;
    /** CPU usage percentage */
    cpuUsage?: number;
    /** Disk usage percentage */
    diskUsage?: number;
  };
}

/**
 * Service status information
 */
export interface ServiceStatus {
  /** Service status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Response time in milliseconds */
  responseTime?: number;
  /** Additional status details */
  details?: string;
  /** Error message if unhealthy */
  error?: string;
}

// ===================================
// WEBSOCKET AND REAL-TIME TYPES
// ===================================

/**
 * WebSocket message types for real-time updates
 */
export interface WebSocketMessage {
  /** Message type identifier */
  type: 'videoStatus' | 'renderProgress' | 'captionProgress' | 'error' | 'health';
  /** Message timestamp */
  timestamp: string;
  /** Associated resource ID */
  resourceId?: string;
  /** Message payload */
  payload: any;
}

/**
 * Video status update message
 */
export interface VideoStatusMessage {
  /** Video ID */
  videoId: string;
  /** New status */
  status: VideoStatus;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Optional status message */
  message?: string;
  /** Error details if status is failed */
  error?: string;
}

/**
 * Render progress update message
 */
export interface RenderProgressMessage {
  /** Render ID */
  renderId: string;
  /** Video ID */
  videoId: string;
  /** Current status */
  status: RenderStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
  /** Current processing stage */
  currentStage?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Caption generation progress message
 */
export interface CaptionProgressMessage {
  /** Video ID */
  videoId: string;
  /** Generation status */
  status: 'processing' | 'completed' | 'failed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Number of captions processed */
  captionsProcessed?: number;
  /** Total captions to process */
  totalCaptions?: number;
  /** Error message if failed */
  error?: string;
}

// ===================================
// API REQUEST/RESPONSE TYPES
// ===================================

/**
 * Get videos list response
 */
export interface VideosListResponse extends ApiResponse<PaginatedResponse<VideoListItem>> {}

/**
 * Get single video details response
 */
export interface SingleVideoResponse extends ApiResponse<Video> {}

/**
 * Delete video response
 */
export interface DeleteVideoResponse extends ApiResponse<{
  videoId: string;
  deleted: {
    video: boolean;
    captions: number;
    renders: number;
    files: boolean;
  };
}> {}

/**
 * Get captions response
 */
export interface GetCaptionsResponse extends ApiResponse<{
  videoId: string;
  captions: Caption[];
  count: number;
}> {}

/**
 * Create captions request
 */
export interface CreateCaptionsRequest {
  captions: CaptionInput[];
}

/**
 * Create captions response
 */
export interface CreateCaptionsResponse extends ApiResponse<{
  videoId: string;
  captions: Caption[];
  count: number;
}> {}

/**
 * Caption generation response
 */
export interface CaptionGenerationResponse extends ApiResponse<{
  videoId: string;
  captions: Caption[];
  generatedAt: string;
}> {}

/**
 * Create render request
 */
export interface CreateRenderRequest {
  captionStyle: CaptionStyle;
  options?: RenderOptions;
}

/**
 * Create render response
 */
export interface CreateRenderResponse extends ApiResponse<{
  renderId: string;
  videoId: string;
  captionStyle: string;
  status: RenderStatus;
  createdAt: string;
}> {}

/**
 * Get render status response
 */
export interface GetRenderResponse extends ApiResponse<Render> {}

// ===================================
// EXPORTS
// ===================================
