import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createId } from '@paralleldrive/cuid2'

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

    // TODO: In the future, this would trigger a Remotion rendering job
    // For now, we just store the pending request in the database

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