import { promises as fs } from 'fs'
import { join, extname, basename } from 'path'
import { createId } from '@paralleldrive/cuid2'
import { safeDeleteDirectory, safeDeleteFile } from '@/lib/utils/filesystem'

// Constants
export const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB in bytes
export const ALLOWED_EXTENSIONS = ['.mp4']
export const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv'
]

// Types
export interface FileMetadata {
  size: number
  extension: string
  mimeType: string
  originalName: string
  duration?: number // in seconds (placeholder for future implementation)
}

export interface UploadResult {
  success: boolean
  filePath?: string
  fileName?: string
  relativePath?: string
  metadata?: FileMetadata
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  metadata?: FileMetadata
}

/**
 * Logger utility for file operations
 */
class Logger {
  private static log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [FILE-SERVICE] [${level.toUpperCase()}] ${message}`

    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage, data || '')
    }

    // In production, you'd want to send this to a proper logging service
    // For now, we'll keep it simple
  }

  static info(message: string, data?: any) {
    this.log('info', message, data)
  }

  static warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  static error(message: string, error?: any) {
    this.log('error', message, error)
  }
}

/**
 * Validate file type and size
 */
export function validateFile(file: File | Buffer, originalName?: string): ValidationResult {
  try {
    let size: number
    let mimeType: string
    let fileName: string

    if (file instanceof File) {
      size = file.size
      mimeType = file.type
      fileName = file.name
    } else {
      // For Buffer, we need original name for extension
      if (!originalName) {
        return {
          isValid: false,
          error: 'Original filename is required for Buffer validation'
        }
      }
      size = file.length
      mimeType = 'application/octet-stream' // Unknown for Buffer
      fileName = originalName
    }

    // Check file size
    if (size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit. Current size: ${(size / 1024 / 1024).toFixed(2)}MB`
      }
    }

    if (size === 0) {
      return {
        isValid: false,
        error: 'File is empty'
      }
    }

    // Check file extension
    const extension = extname(fileName).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file extension: ${extension}. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
      }
    }

    // Check MIME type (if available)
    if (mimeType && mimeType !== 'application/octet-stream') {
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return {
          isValid: false,
          error: `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
        }
      }
    }

    const metadata: FileMetadata = {
      size,
      extension,
      mimeType: mimeType || 'application/octet-stream',
      originalName: fileName
    }

    Logger.info('File validation passed', { fileName, size, extension, mimeType })

    return {
      isValid: true,
      metadata
    }

  } catch (error) {
    Logger.error('File validation error', error)
    return {
      isValid: false,
      error: 'File validation failed'
    }
  }
}

/**
 * Generate unique file path for uploaded file
 */
export function generateFilePath(videoId: string, originalName: string): {
  fileName: string
  filePath: string
  relativePath: string
} {
  const extension = extname(originalName).toLowerCase()
  const baseName = basename(originalName, extension)
  const uniqueId = createId()
  const fileName = `${videoId}_${uniqueId}${extension}`
  const filePath = join(process.cwd(), 'public', 'uploads', videoId, fileName)
  const relativePath = `/uploads/${videoId}/${fileName}`

  Logger.info('Generated file path', { videoId, fileName, relativePath })

  return {
    fileName,
    filePath,
    relativePath
  }
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDirectory(videoId: string): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', 'uploads', videoId)

  try {
    await fs.mkdir(uploadDir, { recursive: true })
    Logger.info('Upload directory created/verified', { videoId, uploadDir })
    return uploadDir
  } catch (error) {
    Logger.error('Failed to create upload directory', { videoId, error })
    throw new Error(`Failed to create upload directory: ${error}`)
  }
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(
  videoId: string,
  file: File | Buffer,
  originalName: string
): Promise<UploadResult> {
  try {
    Logger.info('Starting file upload', { videoId, originalName })

    // Validate file
    const validation = validateFile(file, originalName)
    if (!validation.isValid) {
      Logger.warn('File validation failed', { error: validation.error, originalName })
      return {
        success: false,
        error: validation.error
      }
    }

    // Generate unique file path
    const { fileName, filePath, relativePath } = generateFilePath(videoId, originalName)

    // Ensure upload directory exists
    await ensureUploadDirectory(videoId)

    // Convert file to buffer if it's a File object
    let buffer: Buffer
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }

    // Write file to disk
    await fs.writeFile(filePath, buffer)

    // Verify file was written correctly
    const stats = await fs.stat(filePath)
    if (stats.size !== buffer.length) {
      Logger.error('File size mismatch after write', {
        expected: buffer.length,
        actual: stats.size,
        filePath
      })
      // Clean up partially written file
      await safeDeleteFile(filePath, join(process.cwd(), 'public'))
      return {
        success: false,
        error: 'File write verification failed'
      }
    }

    // Estimate duration (placeholder - would use ffprobe or similar in production)
    const estimatedDuration = await estimateVideoDuration(filePath, buffer.length)

    const metadata: FileMetadata = {
      ...validation.metadata!,
      duration: estimatedDuration
    }

    Logger.info('File uploaded successfully', {
      videoId,
      fileName,
      filePath,
      size: stats.size,
      estimatedDuration
    })

    return {
      success: true,
      filePath,
      fileName,
      relativePath,
      metadata
    }

  } catch (error) {
    Logger.error('File upload failed', { videoId, originalName, error })
    return {
      success: false,
      error: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filePath: string): Promise<FileMetadata | null> {
  try {
    const stats = await fs.stat(filePath)
    const extension = extname(filePath).toLowerCase()
    const fileName = basename(filePath)

    // Estimate duration
    const duration = await estimateVideoDuration(filePath, stats.size)

    const metadata: FileMetadata = {
      size: stats.size,
      extension,
      mimeType: getMimeTypeFromExtension(extension),
      originalName: fileName,
      duration
    }

    Logger.info('File metadata retrieved', { filePath, size: stats.size, duration })

    return metadata

  } catch (error) {
    Logger.error('Failed to get file metadata', { filePath, error })
    return null
  }
}

/**
 * Delete video upload directory and all contents
 */
export async function deleteVideoFiles(videoId: string): Promise<boolean> {
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads', videoId)
    const allowedBasePath = join(process.cwd(), 'public', 'uploads')

    await safeDeleteDirectory(uploadDir, allowedBasePath)

    Logger.info('Video files deleted successfully', { videoId })
    return true

  } catch (error) {
    Logger.error('Failed to delete video files', { videoId, error })
    return false
  }
}

/**
 * Delete specific file
 */
export async function deleteFile(relativePath: string): Promise<boolean> {
  try {
    const filePath = relativePath.startsWith('/')
      ? join(process.cwd(), relativePath)
      : join(process.cwd(), 'public', relativePath)

    const allowedBasePath = join(process.cwd(), 'public')

    await safeDeleteFile(filePath, allowedBasePath)

    Logger.info('File deleted successfully', { relativePath })
    return true

  } catch (error) {
    Logger.error('Failed to delete file', { relativePath, error })
    return false
  }
}

/**
 * Estimate video duration based on file size
 * This is a placeholder - in production, you'd use ffprobe or similar
 */
export async function estimateVideoDuration(filePath: string, fileSize: number): Promise<number> {
  try {
    // This is a very rough estimation
    // Assumes average bitrate of 2 Mbps for SD video, 5 Mbps for HD
    const avgBitrate = 2 * 1024 * 1024 // 2 Mbps in bits per second
    const estimatedSeconds = (fileSize * 8) / avgBitrate

    Logger.info('Duration estimated', { filePath, fileSize, estimatedSeconds })

    return Math.round(estimatedSeconds * 100) / 100 // Round to 2 decimal places

  } catch (error) {
    Logger.warn('Duration estimation failed', { filePath, error })
    return 0
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv'
  }

  return mimeTypes[extension] || 'application/octet-stream'
}

/**
 * Check if file exists
 */
export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    const filePath = relativePath.startsWith('/')
      ? join(process.cwd(), relativePath.slice(1))
      : join(process.cwd(), 'public', relativePath)

    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get all files in a video directory
 */
export async function getVideoFiles(videoId: string): Promise<string[]> {
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads', videoId)
    const files = await fs.readdir(uploadDir)

    const fileList = files
      .filter(file => ALLOWED_EXTENSIONS.includes(extname(file).toLowerCase()))
      .map(file => `/uploads/${videoId}/${file}`)

    Logger.info('Video files listed', { videoId, count: fileList.length })
    return fileList

  } catch (error) {
    Logger.warn('Failed to list video files', { videoId, error })
    return []
  }
}

// Export Logger for use in other modules
export { Logger }