import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createId } from '@paralleldrive/cuid2'
import type { CaptionStyle } from '@prisma/client'

// Types for caption management
export interface CaptionInput {
  text: string
  startTime: number
  endTime: number
  language: string
  style: string
}

export interface CreateCaptionsRequest {
  captions: CaptionInput[]
}

export interface CaptionResponse {
  id: string
  videoId: string
  text: string
  startTime: number
  endTime: number
  language: string
  style: string
}

export interface CreateCaptionsResponse {
  success: boolean
  data?: {
    videoId: string
    captions: CaptionResponse[]
    count: number
  }
  error?: string
  details?: any
}

export interface GetCaptionsResponse {
  success: boolean
  data?: {
    videoId: string
    captions: CaptionResponse[]
    count: number
  }
  error?: string
}

// Valid caption styles
const VALID_STYLES = ['default', 'newsbar', 'karaoke']

// Language code regex (basic validation)
const LANGUAGE_REGEX = /^[a-z]{2}-[A-Z]{2}$/

// Hardcoded user ID for now
const HARDCODED_USER_ID = 'test-user-1'

/**
 * Validate caption data
 */
function validateCaption(caption: any): { isValid: boolean; error?: string } {
  if (!caption.text || typeof caption.text !== 'string' || caption.text.trim().length === 0) {
    return { isValid: false, error: 'Caption text is required and must be a non-empty string' }
  }

  if (typeof caption.startTime !== 'number' || caption.startTime < 0) {
    return { isValid: false, error: 'Start time must be a non-negative number' }
  }

  if (typeof caption.endTime !== 'number' || caption.endTime <= 0) {
    return { isValid: false, error: 'End time must be a positive number' }
  }

  if (caption.endTime <= caption.startTime) {
    return { isValid: false, error: 'End time must be greater than start time' }
  }

  if (!caption.language || typeof caption.language !== 'string' || !LANGUAGE_REGEX.test(caption.language)) {
    return { isValid: false, error: 'Language is required and must be in format "en-US"' }
  }

  if (!caption.style || typeof caption.style !== 'string' || !VALID_STYLES.includes(caption.style)) {
    return { isValid: false, error: `Style must be one of: ${VALID_STYLES.join(', ')}` }
  }

  return { isValid: true }
}

/**
 * GET - Fetch all captions for a video
 */
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

    // Fetch captions sorted by startTime
    const captions = await prisma.caption.findMany({
      where: {
        videoId
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Format response
    const response: GetCaptionsResponse = {
      success: true,
      data: {
        videoId,
        captions: captions.map(caption => ({
          id: caption.id,
          videoId: caption.videoId,
          text: caption.text,
          startTime: caption.startTime,
          endTime: caption.endTime,
          language: caption.language,
          style: caption.style
        })),
        count: captions.length
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching captions:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch captions',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new captions for a video (replaces existing captions)
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
    const body: CreateCaptionsRequest = await request.json()

    if (!body.captions || !Array.isArray(body.captions)) {
      return NextResponse.json(
        { success: false, error: 'Captions array is required' },
        { status: 400 }
      )
    }

    if (body.captions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one caption is required' },
        { status: 400 }
      )
    }

    // Validate all captions
    for (let i = 0; i < body.captions.length; i++) {
      const validation = validateCaption(body.captions[i])
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: `Caption ${i + 1} validation failed: ${validation.error}`,
            details: { captionIndex: i, caption: body.captions[i] }
          },
          { status: 400 }
        )
      }
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

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing captions
      await tx.caption.deleteMany({
        where: {
          videoId
        }
      })

      // Create new captions
      const newCaptions = await Promise.all(
        body.captions.map((caption) =>
          tx.caption.create({
            data: {
              id: createId(),
              videoId,
              text: caption.text.trim(),
              startTime: caption.startTime,
              endTime: caption.endTime,
              language: caption.language,
              style: caption.style as CaptionStyle
            }
          })
        )
      )

      return newCaptions
    })

    // Sort captions by start time for consistent response
    result.sort((a, b) => a.startTime - b.startTime)

    console.log(`Created ${result.length} captions for video: ${videoId}`)

    // Format response
    const response: CreateCaptionsResponse = {
      success: true,
      data: {
        videoId,
        captions: result.map(caption => ({
          id: caption.id,
          videoId: caption.videoId,
          text: caption.text,
          startTime: caption.startTime,
          endTime: caption.endTime,
          language: caption.language,
          style: caption.style
        })),
        count: result.length
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating captions:', error)

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
        error: 'Failed to create captions',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported HTTP methods
export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to fetch or POST to create captions.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to fetch or POST to create captions.' },
    { status: 405 }
  )
}