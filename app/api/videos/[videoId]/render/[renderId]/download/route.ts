import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { join } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

// Types for download response
export interface DownloadResponse {
  success: boolean
  data?: {
    filename: string
    size: number
    contentType: string
  }
  error?: string
}

// Hardcoded user ID for now
const HARDCODED_USER_ID = 'test-user-1'

/**
 * GET - Download rendered video file
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

    // Check if render is completed
    if (render.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: `Render not ready for download. Current status: ${render.status}`
        },
        { status: 400 }
      )
    }

    // Check if output path exists
    if (!render.outputPath) {
      return NextResponse.json(
        { success: false, error: 'Render output file not found' },
        { status: 404 }
      )
    }

    // Get the full path to the output file
    let filePath = render.outputPath
    if (!filePath.startsWith('/')) {
      filePath = join(process.cwd(), filePath)
    }

    try {
      // Check if file exists and get stats
      const fileStats = await stat(filePath)

      // Generate filename for download
      const filename = `${video.title.replace(/[^a-z0-9]/gi, '_')}_${render.captionStyle}_rendered.mp4`

      console.log(`Serving download for render: ${renderId}, file: ${filePath}, size: ${fileStats.size} bytes`)

      // Create read stream for the file
      const fileStream = createReadStream(filePath)

      // Set appropriate headers for download
      const headers = new Headers({
        'Content-Type': 'video/mp4',
        'Content-Length': fileStats.size.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })

      // Return the file stream as response
      return new Response(fileStream as any, {
        status: 200,
        headers
      })

    } catch (fileError) {
      console.error(`File not found or inaccessible: ${filePath}`, fileError)
      return NextResponse.json(
        { success: false, error: 'Rendered video file not found on disk' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error downloading rendered video:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download rendered video',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported HTTP methods
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to download rendered videos.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to download rendered videos.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to download rendered videos.' },
    { status: 405 }
  )
}