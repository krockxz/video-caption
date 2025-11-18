/**
 * Remotion Video Rendering Service
 *
 * Handles video rendering using Remotion with caption overlays.
 * Supports multiple caption styles and background rendering.
 */

import { renderMedia } from '@remotion/renderer'
import { join } from 'path'
import { createId } from '@paralleldrive/cuid2'
import type { Caption } from '@/lib/types/api'
import { UPLOAD_DIR } from '@/lib/config'

// Types for rendering
export interface RenderOptions {
  videoPath: string
  captions: Caption[]
  captionStyle: 'default' | 'newsbar' | 'karaoke'
  outputPath?: string
  quality?: number
  fps?: number
  width?: number
  height?: number
  codec?: 'h264' | 'h265' | 'vp9'
  audioBitrate?: string
}

export interface RenderJob {
  id: string
  videoId: string
  videoPath: string
  captions: Caption[]
  captionStyle: string
  outputPath: string
  status: 'pending' | 'rendering' | 'completed' | 'failed'
  progress?: number
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface RenderProgress {
  renderId: string
  progress: number
  framesRendered: number
  totalFrames: number
  fps: number
  timeElapsed: number
  timeEstimated: number
}

// Active render jobs storage (in production, use Redis or database)
const activeRenderJobs = new Map<string, RenderJob>()

/**
 * Create output directory for rendered videos
 */
function ensureOutputDir(videoId: string): string {
  // UPLOAD_DIR is already '/public/uploads', so we need to handle it correctly
  const uploadDir = UPLOAD_DIR.startsWith('/') ? UPLOAD_DIR.slice(1) : UPLOAD_DIR
  const outputDir = join(process.cwd(), uploadDir, videoId, 'renders')
  const fs = require('fs')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  return outputDir
}

/**
 * Render a video with captions using Remotion
 */
export async function renderVideoWithCaptions(
  videoId: string,
  videoPath: string,
  captions: Caption[],
  captionStyle: 'default' | 'newsbar' | 'karaoke',
  options: Partial<RenderOptions> = {}
): Promise<RenderJob> {
  const renderId = createId()
  const outputDir = ensureOutputDir(videoId)
  const outputPath = options.outputPath || join(outputDir, `${videoId}_${captionStyle}_${Date.now()}.mp4`)

  // Create render job record
  const renderJob: RenderJob = {
    id: renderId,
    videoId,
    videoPath,
    captions,
    captionStyle,
    outputPath,
    status: 'pending',
    createdAt: new Date()
  }

  activeRenderJobs.set(renderId, renderJob)

  // Start rendering in background
  renderVideoAsync(renderJob, {
    videoPath,
    captions,
    captionStyle,
    outputPath,
    quality: options.quality || 90,
    fps: options.fps || 30,
    width: options.width || 1920,
    height: options.height || 1080,
    codec: options.codec || 'h264',
    audioBitrate: options.audioBitrate || '320k'
  })

  return renderJob
}

/**
 * Async video rendering function
 */
async function renderVideoAsync(
  renderJob: RenderJob,
  options: Required<RenderOptions>
): Promise<void> {
  try {
    // Update status to rendering
    renderJob.status = 'rendering'
    console.log(`Starting render job: ${renderJob.id} for video: ${renderJob.videoId}`)

    // Get the absolute path to the video file
    let absoluteVideoPath = options.videoPath
    if (!absoluteVideoPath.startsWith('/')) {
      // Handle relative paths from database
      if (absoluteVideoPath.startsWith('public/')) {
        absoluteVideoPath = absoluteVideoPath.replace('public/', '')
      }
      absoluteVideoPath = join(process.cwd(), 'public', absoluteVideoPath)
    }

    // Validate video file exists
    const fs = require('fs')
    if (!fs.existsSync(absoluteVideoPath)) {
      throw new Error(`Video file not found: ${absoluteVideoPath}`)
    }

    // Prepare composition props
    const compositionProps = {
      videoPath: absoluteVideoPath,
      captions: options.captions.map(caption => ({
        id: caption.id,
        videoId: caption.videoId,
        text: caption.text,
        startTime: caption.startTime,
        endTime: caption.endTime,
        language: caption.language,
        style: caption.style
      })),
      style: options.captionStyle,
      width: options.width,
      height: options.height,
      fps: options.fps
    }

    // Calculate duration based on captions
    const durationInSeconds = Math.max(...options.captions.map(c => c.endTime), 10)
    const durationInFrames = Math.ceil(durationInSeconds * options.fps)

    console.log(`Starting video render to: ${options.outputPath}`)

    // Dynamically import bundler to avoid build-time issues
    try {
      const { bundle } = await import('@remotion/bundler')

      const bundled = await bundle({
        entryPoint: join(process.cwd(), 'remotion/compositions/CaptionedVideo.tsx'),
        onProgress: (progress) => {
          console.log(`Bundling progress: ${Math.round(progress * 100)}%`)
        }
      })

      // Render the video
      await renderMedia({
        composition: {
          id: 'CaptionedVideo',
          width: options.width,
          height: options.height,
          fps: options.fps,
          durationInFrames,
          props: compositionProps,
          defaultProps: compositionProps,
          defaultCodec: 'h264',
          defaultOutName: 'output.mp4',
          defaultVideoImageFormat: 'jpeg',
          defaultPixelFormat: 'yuv420p',
          defaultProResProfile: '4444-xq'
        },
        serveUrl: bundled,
        codec: options.codec,
        outputLocation: options.outputPath,
        inputProps: compositionProps,
        onProgress: ({ progress }) => {
          renderJob.progress = Math.round(progress * 100)
          console.log(`Render progress for ${renderJob.id}: ${renderJob.progress}%`)
        },
        imageFormat: 'jpeg',
        verbose: true
      })

      // Update status to completed
      renderJob.status = 'completed'
      renderJob.completedAt = new Date()
      renderJob.progress = 100

      console.log(`Completed render job: ${renderJob.id}. Output: ${options.outputPath}`)

    } catch (bundlerError) {
      // If bundler import fails, provide a helpful error
      console.error('Bundler import failed:', bundlerError)
      throw new Error('Video rendering requires Remotion bundler. Please ensure @remotion/bundler is properly installed.')
    }

  } catch (error) {
    console.error(`Render job ${renderJob.id} failed:`, error)
    renderJob.status = 'failed'
    renderJob.error = error instanceof Error ? error.message : 'Unknown error'
    renderJob.completedAt = new Date()
  }
}

/**
 * Get render job status
 */
export function getRenderJob(renderId: string): RenderJob | undefined {
  return activeRenderJobs.get(renderId)
}

/**
 * List all active render jobs
 */
export function getActiveRenderJobs(): RenderJob[] {
  return Array.from(activeRenderJobs.values())
}

/**
 * Cancel a render job
 */
export function cancelRenderJob(renderId: string): boolean {
  const job = activeRenderJobs.get(renderId)
  if (job && job.status === 'rendering') {
    job.status = 'failed'
    job.error = 'Render job cancelled'
    job.completedAt = new Date()
    return true
  }
  return false
}

/**
 * Clean up completed render jobs older than specified time
 */
export function cleanupCompletedRenderJobs(olderThanHours: number = 24): void {
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - olderThanHours)

  for (const [renderId, job] of activeRenderJobs.entries()) {
    if (job.completedAt && job.completedAt < cutoffTime) {
      activeRenderJobs.delete(renderId)
      console.log(`Cleaned up completed render job: ${renderId}`)
    }
  }
}

/**
 * Get available video codecs
 */
export function getAvailableCodecs(): string[] {
  return ['h264', 'h265', 'vp9']
}

/**
 * Get supported caption styles
 */
export function getSupportedCaptionStyles(): string[] {
  return ['default', 'newsbar', 'karaoke']
}

/**
 * Validate render options
 */
export function validateRenderOptions(options: Partial<RenderOptions>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!options.videoPath) {
    errors.push('Video path is required')
  }

  if (!options.captionStyle || !getSupportedCaptionStyles().includes(options.captionStyle)) {
    errors.push(`Invalid caption style. Must be one of: ${getSupportedCaptionStyles().join(', ')}`)
  }

  if (options.quality && (options.quality < 1 || options.quality > 100)) {
    errors.push('Quality must be between 1 and 100')
  }

  if (options.fps && (options.fps < 1 || options.fps > 120)) {
    errors.push('FPS must be between 1 and 120')
  }

  if (options.width && (options.width < 320 || options.width > 7680)) {
    errors.push('Width must be between 320 and 7680 pixels')
  }

  if (options.height && (options.height < 240 || options.height > 4320)) {
    errors.push('Height must be between 240 and 4320 pixels')
  }

  if (options.codec && !getAvailableCodecs().includes(options.codec)) {
    errors.push(`Invalid codec. Must be one of: ${getAvailableCodecs().join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Cleanup completed render jobs every hour
setInterval(() => {
  cleanupCompletedRenderJobs(24)
}, 60 * 60 * 1000)