import { z } from 'zod'

// Constants
export const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB in bytes
export const ALLOWED_VIDEO_TYPES = ['video/mp4'] as const
export const ALLOWED_EXTENSIONS = ['.mp4'] as const
export const CAPTION_STYLES = ['default', 'newsbar', 'karaoke'] as const
export const VIDEO_STATUSES = ['uploading', 'processing', 'captioning', 'completed', 'failed'] as const
export const RENDER_STATUSES = ['pending', 'rendering', 'completed', 'failed'] as const
export const DEFAULT_LANGUAGE = 'en-US'
export const POLLING_INTERVAL = 2000 // 2 seconds
export const RENDER_TIMEOUT = 300000 // 5 minutes

// Environment variables with defaults
export const UPLOAD_DIR = process.env.UPLOAD_DIR || '/public/uploads'
export const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db'
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = parseInt(process.env.PORT || '3000', 10)

// Types
export type CaptionStyle = typeof CAPTION_STYLES[number]
export type VideoStatus = typeof VIDEO_STATUSES[number]
export type RenderStatus = typeof RENDER_STATUSES[number]
export type AllowedVideoType = typeof ALLOWED_VIDEO_TYPES[number]
export type AllowedExtension = typeof ALLOWED_EXTENSIONS[number]

// Video-related types
export interface CaptionInput {
  text: string
  startTime: number
  endTime: number
  language: string
  style: CaptionStyle
}

export interface CreateRenderRequest {
  captionStyle: CaptionStyle
}

export interface FileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// Database configuration
export const DATABASE_CONFIG = {
  url: DATABASE_URL,
  // SQLite specific settings
  connectionLimit: 1,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createDatabaseIfMissing: true,
  // Enable query logging in development
  logQueries: NODE_ENV === 'development',
  // Connection timeout
  connectTimeoutMillis: 2000
}

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: MAX_FILE_SIZE,
  allowedTypes: ALLOWED_VIDEO_TYPES,
  allowedExtensions: ALLOWED_EXTENSIONS,
  uploadDir: UPLOAD_DIR,
  // Generate unique filenames
  generateUniqueName: true,
  // Buffer size for streaming uploads
  bufferSize: 64 * 1024, // 64KB
}

// Rendering configuration
export const RENDER_CONFIG = {
  maxConcurrentJobs: 3,
  defaultTimeout: RENDER_TIMEOUT,
  pollingInterval: POLLING_INTERVAL,
  outputDir: '/public/renders',
  supportedFormats: ['mp4', 'webm'] as const,
  qualitySettings: {
    low: { bitrate: '1000k', resolution: '720p' },
    medium: { bitrate: '2500k', resolution: '1080p' },
    high: { bitrate: '5000k', resolution: '1080p' }
  }
}

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().int().min(1000).max(65535).default(3000),
  UPLOAD_DIR: z.string().default('/public/uploads'),
  OPENAI_API_KEY: z.string().optional(),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(MAX_FILE_SIZE),
  POLLING_INTERVAL: z.coerce.number().int().positive().default(POLLING_INTERVAL),
  RENDER_TIMEOUT: z.coerce.number().int().positive().default(RENDER_TIMEOUT)
})

type EnvSchema = z.infer<typeof envSchema>

/**
 * Validate environment variables on startup
 */
export function validateEnvironment(): EnvSchema {
  try {
    const env = envSchema.parse(process.env)

    console.log('✅ Environment variables validated successfully')

    if (NODE_ENV === 'development') {
      console.log('🔧 Development environment detected')
      console.log(`   • PORT: ${env.PORT}`)
      console.log(`   • UPLOAD_DIR: ${env.UPLOAD_DIR}`)
      console.log(`   • DATABASE_URL: ${env.DATABASE_URL}`)
      console.log(`   • MAX_FILE_SIZE: ${(env.MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`)
    }

    // Check for required services/keys
    if (!OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not configured - OpenAI Whisper API features will be disabled')
    }

    return env

  } catch (error) {
    console.error('❌ Environment validation failed:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`   • ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error(error)
    }

    console.error('\n💡 Please check your .env.local file and fix the above errors')
    process.exit(1)
  }
}

/**
 * Get configuration for a specific environment
 */
export function getConfig() {
  const env = validateEnvironment()

  return {
    env,
    database: DATABASE_CONFIG,
    upload: UPLOAD_CONFIG,
    render: RENDER_CONFIG,
    constants: {
      MAX_FILE_SIZE,
      ALLOWED_VIDEO_TYPES,
      ALLOWED_EXTENSIONS,
      CAPTION_STYLES,
      VIDEO_STATUSES,
      RENDER_STATUSES,
      DEFAULT_LANGUAGE,
      POLLING_INTERVAL,
      RENDER_TIMEOUT
    }
  }
}

/**
 * Check if a value is a valid caption style
 */
export function isValidCaptionStyle(style: string): style is CaptionStyle {
  return CAPTION_STYLES.includes(style as CaptionStyle)
}

/**
 * Check if a value is a valid video status
 */
export function isValidVideoStatus(status: string): status is VideoStatus {
  return VIDEO_STATUSES.includes(status as VideoStatus)
}

/**
 * Check if a value is a valid render status
 */
export function isValidRenderStatus(status: string): status is RenderStatus {
  return RENDER_STATUSES.includes(status as RenderStatus)
}

/**
 * Check if a file type is allowed
 */
export function isAllowedVideoType(mimeType: string): mimeType is AllowedVideoType {
  return ALLOWED_VIDEO_TYPES.includes(mimeType as AllowedVideoType)
}

/**
 * Check if a file extension is allowed
 */
export function isAllowedExtension(extension: string): extension is AllowedExtension {
  return ALLOWED_EXTENSIONS.includes(extension as AllowedExtension)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv'
  }

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

/**
 * Export configuration singleton
 */
export const config = getConfig()