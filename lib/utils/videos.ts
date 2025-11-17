import {
  VideosListResponse,
  SingleVideoResponse,
  DeleteVideoResponse,
  CaptionGenerationResponse,
  GetCaptionsResponse,
  GetRenderResponse,
  CreateCaptionsResponse,
  CreateRenderResponse,
  Render
} from '@/lib/types/api'

/**
 * Client utilities for video API endpoints
 */

const API_BASE = '/api/videos'

/**
 * Fetch all videos for the hardcoded user with pagination
 */
export async function fetchVideos(
  page: number = 1,
  limit: number = 10
): Promise<VideosListResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    const response = await fetch(`${API_BASE}?${params}`)
    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasMore: false
          }
        },
        error: result.error || 'Failed to fetch videos'
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      data: {
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      },
      error: 'Network error while fetching videos',
      details: error
    }
  }
}

/**
 * Fetch a single video with all its captions and renders
 */
export async function fetchVideo(videoId: string): Promise<SingleVideoResponse> {
  try {
    const response = await fetch(`${API_BASE}/${videoId}`)
    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch video'
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while fetching video',
      details: error
    }
  }
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return 'Unknown'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format date to human-readable format
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get status color for video status
 */
export function getVideoStatusColor(status: string): string {
  switch (status) {
    case 'uploading':
      return 'text-blue-600 bg-blue-50'
    case 'processing':
      return 'text-yellow-600 bg-yellow-50'
    case 'captioning':
      return 'text-purple-600 bg-purple-50'
    case 'completed':
      return 'text-green-600 bg-green-50'
    case 'failed':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Get status color for render status
 */
export function getRenderStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-gray-600 bg-gray-50'
    case 'rendering':
      return 'text-blue-600 bg-blue-50'
    case 'completed':
      return 'text-green-600 bg-green-50'
    case 'failed':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Delete a video and all its associated files and data
 */
export async function deleteVideo(videoId: string): Promise<DeleteVideoResponse> {
  try {
    const response = await fetch(`${API_BASE}/${videoId}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to delete video'
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while deleting video',
      details: error
    }
  }
}

// Caption generation types
export interface CaptionData {
  startTime: number
  endTime: number
  text: string
}

/**
 * Generate captions for a video (mock implementation for now)
 */
export async function generateCaptions(videoId: string): Promise<CaptionGenerationResponse> {
  try {
    const response = await fetch(`${API_BASE}/${videoId}/caption-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to generate captions'
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while generating captions',
      details: error
    }
  }
}

// Caption management types
export interface CaptionInput {
  text: string
  startTime: number
  endTime: number
  language: string
  style: string
}

export interface CaptionData {
  id: string
  videoId: string
  text: string
  startTime: number
  endTime: number
  language: string
  style: string
}

/**
 * Fetch all captions for a video
 */
export async function fetchVideoCaptions(videoId: string): Promise<GetCaptionsResponse> {
  try {
    const response = await fetch(`${API_BASE}/${videoId}/captions`)

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch captions'
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while fetching captions',
      details: error
    }
  }
}

/**
 * Create/update captions for a video (replaces all existing captions)
 */
export async function createVideoCaptions(
  videoId: string,
  captions: CaptionInput[]
): Promise<CreateCaptionsResponse> {
  try {
    const response = await fetch(`${API_BASE}/${videoId}/captions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        captions
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create captions',
        details: result.details
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while creating captions',
      details: error
    }
  }
}

/**
 * Validate caption data before sending to API
 */
export function validateCaptionData(caption: CaptionInput): { isValid: boolean; error?: string } {
  if (!caption.text || typeof caption.text !== 'string' || caption.text.trim().length === 0) {
    return { isValid: false, error: 'Caption text is required and must be a non-empty string' }
  }

  if (typeof caption.startTime !== 'number' || caption.startTime < 0) {
    return { isValid: false, error: 'Start time must be a non-negative number' }
  }

  if (typeof caption.endTime !== 'number' || caption.endTime <= 0) {
    return { isValid: false, error: 'End time must be a positive number' }
  }

  if (caption.endTime <= caption.startTime) {
    return { isValid: false, error: 'End time must be greater than start time' }
  }

  if (!caption.language || typeof caption.language !== 'string') {
    return { isValid: false, error: 'Language is required' }
  }

  const validStyles = ['default', 'newsbar', 'karaoke']
  if (!caption.style || typeof caption.style !== 'string' || !validStyles.includes(caption.style)) {
    return { isValid: false, error: `Style must be one of: ${validStyles.join(', ')}` }
  }

  return { isValid: true }
}

// Render management types
export interface CreateRenderRequest {
  captionStyle: 'default' | 'newsbar' | 'karaoke'
}

export interface RenderData extends Render {
  renderId?: string
  errorMessage?: string | null
}

/**
 * Create a new render job for a video
 */
export async function createRender(
  videoId: string,
  captionStyle: 'default' | 'newsbar' | 'karaoke'
): Promise<CreateRenderResponse> {
  try {
    const response = await fetch(`${API_BASE}/${videoId}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        captionStyle
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create render job',
        details: result.details
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while creating render job',
      details: error
    }
  }
}

/**
 * Fetch render status by ID
 */
export async function getRenderStatus(
  videoId: string,
  renderId: string
): Promise<GetRenderResponse> {
  try {
    const response = await fetch(`${API_BASE}/${videoId}/render/${renderId}`)

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch render status'
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while fetching render status',
      details: error
    }
  }
}

/**
 * Poll render status until completion or timeout
 */
export async function pollRenderStatus(
  videoId: string,
  renderId: string,
  options: {
    interval?: number // in milliseconds
    timeout?: number  // in milliseconds
    onProgress?: (status: RenderData) => void
  } = {}
): Promise<GetRenderResponse> {
  const { interval = 2000, timeout = 300000, onProgress } = options // 2s interval, 5min timeout
  const startTime = Date.now()

  return new Promise((resolve) => {
    const poll = async () => {
      try {
        const response = await getRenderStatus(videoId, renderId)

        if (response.success && response.data) {
          // Call progress callback
          if (onProgress) {
            onProgress(response.data)
          }

          // Check if render is complete or failed
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            resolve(response)
            return
          }

          // Check timeout
          if (Date.now() - startTime > timeout) {
            resolve({
              success: false,
              error: 'Render polling timeout exceeded'
            })
            return
          }

          // Continue polling
          setTimeout(poll, interval)
        } else {
          resolve(response)
        }
      } catch (error) {
        resolve({
          success: false,
          error: 'Error during render polling'
        })
      }
    }

    // Start polling
    poll()
  })
}

/**
 * Format render status for display
 */
export function formatRenderStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'rendering':
      return 'Rendering...'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}