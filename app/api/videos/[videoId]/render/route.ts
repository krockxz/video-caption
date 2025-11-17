import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createId } from '@paralleldrive/cuid2'
import { renderVideoWithCaptions, validateRenderOptions, type RenderJob } from '@/lib/services/remotion-service'

// Types for render management
export interface CreateRenderRequest {
  captionStyle: 'default' | 'newsbar' | 'karaoke'
}

export interface RenderResponse {
  id: string
  videoId: string
  captionStyle: string
  status: string
  outputPath: string | null
  createdAt: Date
}

export interface CreateRenderResponse {
  success: boolean
  data?: {
    renderId: string
    videoId: string
    captionStyle: string
    status: string
    createdAt: string
  }
  error?: string
  details?: any
}

// Valid caption styles
const VALID_STYLES = ['default', 'newsbar', 'karaoke']

// Hardcoded user ID for now
const HARDCODED_USER_ID = 'test-user-1'

/**
 * POST - Create a new render job (placeholder for now)
 */
export async function POST(
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

    // Parse request body
    const body: CreateRenderRequest = await request.json()

    if (!body.captionStyle) {
      return NextResponse.json(
        { success: false, error: 'captionStyle is required' },
        { status: 400 }
      )
    }

    if (!VALID_STYLES.includes(body.captionStyle)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid captionStyle. Must be one of: ${VALID_STYLES.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Verify video exists and user has access
    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
        userId: HARDCODED_USER_ID
      }
    })

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Verify video has captions
    const captionCount = await prisma.caption.count({
      where: {
        videoId
      }
    })

    if (captionCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Video has no captions. Generate captions first.' },
        { status: 400 }
      )
    }

    // Fetch captions for the video
    const captions = await prisma.caption.findMany({
      where: {
        videoId
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    if (captions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video has no captions. Generate captions first.' },
        { status: 400 }
      )
    }

    // Get video file path
    let videoPath = video.filePath
    if (videoPath && !videoPath.startsWith('/')) {
      if (videoPath.startsWith('public/')) {
        videoPath = '/' + videoPath
      } else {
        videoPath = '/public/' + videoPath
      }
    }

    // Validate render options
    const validation = validateRenderOptions({
      videoPath,
      captionStyle: body.captionStyle
    })

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid render options',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Create render record
    const render = await prisma.render.create({
      data: {
        id: createId(),
        videoId,
        captionStyle: body.captionStyle,
        status: 'pending'
      }
    })

    console.log(`Created render job: ${render.id} for video: ${videoId} with style: ${body.captionStyle}`)

    // Start actual Remotion rendering
    try {
      const renderJob: RenderJob = await renderVideoWithCaptions(
        videoId,
        videoPath!,
        captions,
        body.captionStyle
      )

      // Update render record with job info
      await prisma.render.update({
        where: { id: render.id },
        data: {
          status: 'rendering',
          outputPath: renderJob.outputPath
        }
      })

      console.log(`Started Remotion rendering job: ${renderJob.id}`)

    } catch (renderError) {
      console.error('Failed to start Remotion rendering:', renderError)

      // Update render record to failed status
      await prisma.render.update({
        where: { id: render.id },
        data: {
          status: 'failed'
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to start video rendering',
          details: process.env.NODE_ENV === 'development' ? renderError : undefined
        },
        { status: 500 }
      )
    }

    // Format response
    const response: CreateRenderResponse = {
      success: true,
      data: {
        renderId: render.id,
        videoId: render.videoId,
        captionStyle: render.captionStyle,
        status: render.status,
        createdAt: render.createdAt.toISOString()
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating render:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create render job',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to create render jobs.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to create render jobs.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to create render jobs.' },
    { status: 405 }
  )
}