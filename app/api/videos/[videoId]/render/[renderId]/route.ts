import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Types for render status checking
export interface GetRenderResponse {
  success: boolean
  data?: {
    renderId: string
    videoId: string
    captionStyle: string
    status: 'pending' | 'rendering' | 'completed' | 'failed'
    outputPath: string | null
    createdAt: string
    completedAt?: string | null
    errorMessage?: string | null
  }
  error?: string
}

// Hardcoded user ID for now
const HARDCODED_USER_ID = 'test-user-1'

/**
 * GET - Fetch render status by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string; renderId: string }> }
) {
  try {
    const { videoId, renderId } = await params

    // Validate IDs
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      )
    }

    if (!renderId) {
      return NextResponse.json(
        { success: false, error: 'Render ID is required' },
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

    // Fetch render record
    const render = await prisma.render.findUnique({
      where: {
        id: renderId,
        videoId: videoId // Ensure render belongs to the specified video
      }
    })

    if (!render) {
      return NextResponse.json(
        { success: false, error: 'Render not found' },
        { status: 404 }
      )
    }

    console.log(`Fetched render status: ${render.id} = ${render.status}`)

    // Format response
    const response: GetRenderResponse = {
      success: true,
      data: {
        renderId: render.id,
        videoId: render.videoId,
        captionStyle: render.captionStyle,
        status: render.status as 'pending' | 'rendering' | 'completed' | 'failed',
        outputPath: render.outputPath,
        createdAt: render.createdAt.toISOString(),
        completedAt: render.status === 'completed' ? render.createdAt.toISOString() : null
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching render status:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch render status',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported HTTP methods
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to fetch render status.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to fetch render status.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to fetch render status.' },
    { status: 405 }
  )
}