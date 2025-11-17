/**
 * API Client for Video Captioning Platform
 * Handles all communication with the backend API
 */

import type {
  ApiResponse,
  UploadResponse,
  Video,
  VideoListItem,
  VideoFilters,
  Caption,
  CaptionGenerateOptions,
  Render,
  RenderOptions,
  HealthResponse,
  ErrorResponse,
  PaginatedResponse,
} from './types/api';

// ===================================
// CONFIGURATION
// ===================================

/**
 * API configuration
 */
const API_CONFIG = {
  /** Base URL for API requests */
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  /** Default timeout for requests (30 seconds) */
  DEFAULT_TIMEOUT: 30000,
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  /** Delay between retries (exponential backoff) */
  RETRY_DELAY: 1000,
  /** Request headers */
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

/**
 * Default request options
 */
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Handle API errors and create error response
 */
function handleApiError(error: any, url: string): ErrorResponse {
  console.error(`API Error for ${url}:`, error);

  if (error.name === 'AbortError') {
    return {
      error: 'Request timeout',
      status: 408,
      message: 'The request timed out',
      code: 'TIMEOUT',
    };
  }

  if (error.response) {
    // Server responded with error status
    return {
      error: error.response.data?.error || error.response.statusText || 'Unknown error',
      status: error.response.status,
      message: error.response.data?.message || 'Request failed',
      details: error.response.data?.details,
    };
  }

  if (error.request) {
    // Network error
    return {
      error: 'Network error',
      status: 0,
      message: 'Unable to connect to the server',
      code: 'NETWORK_ERROR',
    };
  }

  // Other error
  return {
    error: error.message || 'Unknown error',
    status: 500,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Create timeout promise
 */
function createTimeout(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make HTTP request with retry logic and timeout
 */
async function makeRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = API_CONFIG.DEFAULT_TIMEOUT,
    retries = API_CONFIG.MAX_RETRIES,
    signal,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let timeoutId: NodeJS.Timeout;
    let completed = false;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (!completed) {
          controller.abort();
        }
      }, timeout);

      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
        method,
        headers: { ...API_CONFIG.HEADERS, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: signal || controller.signal,
      });

      completed = true;
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: data.data || data,
        status: response.status,
        message: data.message,
        requestId: data.requestId,
      };

    } catch (error) {
      completed = true;
      lastError = error;

      // Clear timeout if it exists
      if (typeof timeoutId !== 'undefined') {
        clearTimeout(timeoutId);
      }

      // Don't retry on abort/timeout errors
      if (error.name === 'AbortError' || (error as any).code === 'TIMEOUT') {
        break;
      }

      // Don't retry on client errors (4xx)
      if ((error as any).response?.status >= 400 && (error as any).response?.status < 500) {
        break;
      }

      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        await sleep(API_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
      }
    }
  }

  const errorResponse = handleApiError(lastError, url);
  return {
    success: false,
    error: errorResponse.error,
    status: errorResponse.status,
    message: errorResponse.message,
    details: errorResponse.details,
  };
}

/**
 * Upload file with progress tracking
 */
async function uploadFileWithProgress(
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
  options: RequestOptions = {}
): Promise<ApiResponse<UploadResponse>> {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            data: response.data || response,
            status: xhr.status,
            message: response.message,
          });
        } else {
          resolve({
            success: false,
            error: response.error || 'Upload failed',
            status: xhr.status,
            message: response.message || 'Upload request failed',
          });
        }
      } catch (error) {
        resolve({
          success: false,
          error: 'Invalid response from server',
          status: xhr.status,
          message: 'Failed to parse server response',
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: 'Network error during upload',
        status: 0,
        message: 'Failed to upload file due to network error',
      });
    });

    xhr.addEventListener('timeout', () => {
      resolve({
        success: false,
        error: 'Upload timeout',
        status: 408,
        message: 'Upload request timed out',
      });
    });

    xhr.timeout = options.timeout || API_CONFIG.DEFAULT_TIMEOUT;

    xhr.open('POST', `${API_CONFIG.BASE_URL}${url}`);

    // Set headers (except Content-Type for FormData)
    const headers = { ...API_CONFIG.HEADERS, ...options.headers };
    delete headers['Content-Type'];

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // Add any additional form data
    if (options.body) {
      Object.entries(options.body).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    xhr.send(formData);
  });
}

// ===================================
// API FUNCTIONS
// ===================================

/**
 * Upload video file
 */
export async function uploadVideo(
  file: File,
  title?: string,
  onProgress?: (progress: number) => void,
  options: RequestOptions = {}
): Promise<ApiResponse<UploadResponse>> {
  return uploadFileWithProgress(
    '/api/upload',
    file,
    onProgress,
    {
      ...options,
      body: {
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        userId: 'test-user-1', // Hardcoded user ID to match the API
      },
    }
  );
}

/**
 * Get list of videos with optional filtering and pagination
 */
export async function getVideos(
  page: number = 1,
  limit: number = 20,
  filters?: VideoFilters,
  options: RequestOptions = {}
): Promise<ApiResponse<PaginatedResponse<VideoListItem>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters) {
    if (filters.status) {
      const status = Array.isArray(filters.status) ? filters.status : [filters.status];
      status.forEach(s => params.append('status', s));
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.userId) {
      params.append('userId', filters.userId);
    }
    if (filters.uploadedAfter) {
      params.append('uploadedAfter', filters.uploadedAfter);
    }
    if (filters.uploadedBefore) {
      params.append('uploadedBefore', filters.uploadedBefore);
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params.append('sortOrder', filters.sortOrder);
    }
  }

  return makeRequest(`/api/videos?${params}`, options);
}

/**
 * Get single video with full details including captions and renders
 */
export async function getVideoDetails(
  videoId: string,
  options: RequestOptions = {}
): Promise<ApiResponse<Video>> {
  return makeRequest(`/api/videos/${videoId}`, options);
}

/**
 * Delete video and associated data
 */
export async function deleteVideo(
  videoId: string,
  options: RequestOptions = {}
): Promise<ApiResponse<{ videoId: string; deleted: any }>> {
  return makeRequest(`/api/videos/${videoId}`, {
    method: 'DELETE',
    ...options,
  });
}

/**
 * Get captions for a specific video
 */
export async function getCaptions(
  videoId: string,
  options: RequestOptions = {}
): Promise<ApiResponse<{ videoId: string; captions: Caption[]; count: number }>> {
  return makeRequest(`/api/videos/${videoId}/captions`, options);
}

/**
 * Save captions for a video
 */
export async function saveCaptions(
  videoId: string,
  captions: Caption[],
  options: RequestOptions = {}
): Promise<ApiResponse<{ videoId: string; captions: Caption[]; count: number }>> {
  return makeRequest(`/api/videos/${videoId}/captions`, {
    method: 'POST',
    body: { captions },
    ...options,
  });
}

/**
 * Generate captions using Whisper API
 */
export async function generateCaptions(
  videoId: string,
  options?: CaptionGenerateOptions,
  requestOptions: RequestOptions = {}
): Promise<ApiResponse<{ videoId: string; captions: Caption[]; generatedAt: string }>> {
  return makeRequest(`/api/videos/${videoId}/captions/generate`, {
    method: 'POST',
    body: options || {},
    ...requestOptions,
  });
}

/**
 * Request video rendering with specified caption style
 */
export async function requestRender(
  videoId: string,
  captionStyle: string,
  renderOptions?: RenderOptions,
  requestOptions: RequestOptions = {}
): Promise<ApiResponse<{ renderId: string; videoId: string; captionStyle: string; status: string; createdAt: string }>> {
  return makeRequest(`/api/videos/${videoId}/render`, {
    method: 'POST',
    body: {
      captionStyle,
      options: renderOptions || {},
    },
    ...requestOptions,
  });
}

/**
 * Get render job status and details
 */
export async function getRenderStatus(
  videoId: string,
  renderId: string,
  options: RequestOptions = {}
): Promise<ApiResponse<Render>> {
  return makeRequest(`/api/videos/${videoId}/render/${renderId}`, options);
}

/**
 * Download rendered video file
 */
export async function downloadRenderedVideo(
  videoId: string,
  renderId: string,
  options: RequestOptions = {}
): Promise<void> {
  const url = `${API_CONFIG.BASE_URL}/api/videos/${videoId}/render/${renderId}/download`;

  try {
    const response = await fetch(url, {
      headers: options.headers,
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `video_${videoId}_render_${renderId}.mp4`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create blob and download link
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Check API health status
 */
export async function checkApiHealth(
  options: RequestOptions = {}
): Promise<ApiResponse<HealthResponse>> {
  return makeRequest('/api/health', options);
}

/**
 * Simple health check (returns boolean)
 */
export async function isApiHealthy(options: RequestOptions = {}): Promise<boolean> {
  try {
    const response = await checkApiHealth({ timeout: 5000, ...options });
    return response.success && response.data?.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Get user information (if authenticated)
 */
export async function getUser(
  userId?: string,
  options: RequestOptions = {}
): Promise<ApiResponse<any>> {
  const url = userId ? `/api/users/${userId}` : '/api/users/me';
  return makeRequest(url, options);
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  userData: any,
  options: RequestOptions = {}
): Promise<ApiResponse<any>> {
  return makeRequest(`/api/users/${userId}`, {
    method: 'PUT',
    body: userData,
    ...options,
  });
}

/**
 * Get storage usage statistics
 */
export async function getStorageUsage(
  userId?: string,
  options: RequestOptions = {}
): Promise<ApiResponse<{ used: number; quota: number; percentage: number }>> {
  const url = userId ? `/api/users/${userId}/storage` : '/api/users/me/storage';
  return makeRequest(url, options);
}

// ===================================
// BATCH OPERATIONS
// ===================================

/**
 * Delete multiple videos
 */
export async function deleteMultipleVideos(
  videoIds: string[],
  options: RequestOptions = {}
): Promise<ApiResponse<{ deleted: string[]; failed: string[]; total: number }>> {
  return makeRequest('/api/videos/batch-delete', {
    method: 'POST',
    body: { videoIds },
    ...options,
  });
}

/**
 * Generate captions for multiple videos
 */
export async function generateBatchCaptions(
  videoIds: string[],
  options?: CaptionGenerateOptions,
  requestOptions: RequestOptions = {}
): Promise<ApiResponse<{ processing: string[]; failed: string[]; total: number }>> {
  return makeRequest('/api/captions/batch-generate', {
    method: 'POST',
    body: {
      videoIds,
      options: options || {},
    },
    ...requestOptions,
  });
}

// ===================================
// UTILITY EXPORTS
// ===================================

export const API_BASE_URL = API_CONFIG.BASE_URL;
export const DEFAULT_TIMEOUT = API_CONFIG.DEFAULT_TIMEOUT;
export const MAX_RETRIES = API_CONFIG.MAX_RETRIES;

// Export all API functions
export default {
  uploadVideo,
  getVideos,
  getVideoDetails,
  deleteVideo,
  getCaptions,
  saveCaptions,
  generateCaptions,
  requestRender,
  getRenderStatus,
  downloadRenderedVideo,
  checkApiHealth,
  isApiHealthy,
  getUser,
  updateUser,
  getStorageUsage,
  deleteMultipleVideos,
  generateBatchCaptions,
};