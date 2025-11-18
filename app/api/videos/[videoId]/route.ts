import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { safeDeleteDirectory } from '@/lib/utils/filesystem'
import { join } from 'path'

// Types for API responses
export interface CaptionResponse {
  id: string
  text: string
  startTime: number
  endTime: number
  language: string
  style: string
}

export interface RenderResponse {
  id: string
  captionStyle: string
  status: string
  outputPath: string | null
  createdAt: string
}

export interface SingleVideoResponse {
  success: boolean
  data?: {
    id: string
    userId: string
    title: string
    fileName: string
    filePath: string
    duration: number | null
    uploadedAt: string
    status: string
    captions: CaptionResponse[]
    renders: RenderResponse[]
  }
  error?: string
}

export interface DeleteVideoResponse {
  success: boolean
  data?: {
    videoId: string
    deleted: {
      video: boolean
      captions: number
      renders: number
      files: boolean
    }
  }
  error?: string
}

// Hardcoded user ID for now
const HARDCODED_USER_ID = 'test-user-1'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params

    // Validate videoId
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Find video with nested captions and renders
    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
        userId: HARDCODED_USER_ID // Ensure user can only access their own videos
      },
      include: {
        captions: {
          orderBy: {
            startTime: 'asc'
          }
        },
        renders: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Handle video not found
    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Format response
    const response: SingleVideoResponse = {
      success: true,
      data: {
        id: video.id,
        userId: video.userId,
        title: video.title,
        fileName: video.fileName,
        filePath: video.filePath,
        duration: video.duration,
        uploadedAt: video.uploadedAt.toISOString(),
        status: video.status,
        captions: video.captions.map(caption => ({
          id: caption.id,
          text: caption.text,
          startTime: caption.startTime,
          endTime: caption.endTime,
          language: caption.language,
          style: caption.style
        })),
        renders: video.renders.map(render => ({
          id: render.id,
          captionStyle: render.captionStyle,
          status: render.status,
          outputPath: render.outputPath,
          createdAt: render.createdAt.toISOString()
        }))
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching video:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch video',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported HTTP methods
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to fetch video.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to fetch video.' },
    { status: 405 }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params

    // Validate videoId
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Find video first to verify ownership and get file path
    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
        userId: HARDCODED_USER_ID // Ensure user can only delete their own videos
      },
      include: {
        captions: true,
        renders: true
      }
    })

    // Handle video not found
    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    const captionCount = video.captions.length
    const renderCount = video.renders.length

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Delete video (cascade delete will handle captions and renders due to schema)
      const deletedVideo = await tx.video.delete({
        where: {
          id: videoId
        }
      })

      return deletedVideo
    })

    // Delete uploaded files from filesystem
    let filesDeleted = false
    try {
      // Extract directory from file path
      // filePath is like "/uploads/videoId/filename.ext"
      if (video.filePath) {
        const pathParts = video.filePath.split('/')
        if (pathParts.length >= 2) {
          const uploadDir = join(process.cwd(), 'public', 'uploads', videoId)
          const allowedBasePath = join(process.cwd(), 'public', 'uploads')

          await safeDeleteDirectory(uploadDir, allowedBasePath)
          filesDeleted = true
        }
      }
    } catch (fileError) {
      console.error('Failed to delete files:', fileError)
      // Continue even if file deletion fails - database is already cleaned up
    }

    // Format response
    const response: DeleteVideoResponse = {
      success: true,
      data: {
        videoId: result.id,
        deleted: {
          video: true,
          captions: captionCount,
          renders: renderCount,
          files: filesDeleted
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error deleting video:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete video',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}