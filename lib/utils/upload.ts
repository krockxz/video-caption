/**
 * Upload utility functions for the captioning platform
 */

export interface UploadResponse {
  success: boolean
  data?: {
    videoId: string
    fileName: string
    uploadPath: string
    title: string
    status: string
    uploadedAt: string
  }
  error?: string
  details?: any
}

export interface UploadFormData {
  video: File
  title: string
  userId: string
}

/**
 * Upload a video file to the server
 */
export async function uploadVideo(formData: UploadFormData): Promise<UploadResponse> {
  try {
    const data = new FormData()
    data.append('video', formData.video)
    data.append('title', formData.title)
    data.append('userId', formData.userId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: data,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Upload failed',
        details: result.details
      }
    }

    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error during upload',
      details: error
    }
  }
}

/**
 * Validate file before upload
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
  const ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ]

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.type}. Only MP4, MPEG, MOV, AVI, and WMV files are allowed`
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 500MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    }
  }

  return { isValid: true }
}