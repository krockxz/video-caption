import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Types for API responses
export interface VideoResponse {
  id: string
  title: string
  fileName: string
  duration: number | null
  uploadedAt: string
  status: string
}

export interface VideosListResponse {
  success: boolean
  data: {
    items: VideoResponse[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
  error?: string
}

// Hardcoded user ID for now (matches the seed data)
const HARDCODED_USER_ID = 'test-user-1'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))

    const skip = (page - 1) * limit

    // Get total count for user's videos
    const total = await prisma.video.count({
      where: {
        userId: HARDCODED_USER_ID
      }
    })

    // Get paginated videos for user
    const videos = await prisma.video.findMany({
      where: {
        userId: HARDCODED_USER_ID
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        duration: true,
        uploadedAt: true,
        status: true
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      skip,
      take: limit
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    const response: VideosListResponse = {
      success: true,
      data: {
        items: videos.map(video => ({
          id: video.id,
          title: video.title,
          fileName: video.fileName,
          duration: video.duration,
          uploadedAt: video.uploadedAt.toISOString(),
          status: video.status
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch videos',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
