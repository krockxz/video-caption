import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createId } from '@paralleldrive/cuid2'
import { promises as fs } from 'fs'
import { join } from 'path'
import OpenAI from 'openai'
import { UPLOAD_DIR, OPENAI_API_KEY } from '@/lib/config'
import { pathExists } from '@/lib/utils/filesystem'

// Types for caption generation response
export interface CaptionGenerationRequest {
  // No body needed - videoId comes from URL
}

export interface CaptionData {
  startTime: number
  endTime: number
  text: string
}

export interface CaptionGenerationResponse {
  success: boolean
  data?: {
    videoId: string
    captions: CaptionData[]
    generatedAt: string
  }
  error?: string
}

// Hardcoded user ID for now
const HARDCODED_USER_ID = 'test-user-1'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

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

    // Find video and verify ownership
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

    // Check if video is in a valid state for caption generation
    if (video.status === 'captioning') {
      return NextResponse.json(
        { success: false, error: 'Caption generation already in progress' },
        { status: 409 }
      )
    }

    // Validate OpenAI API key
    if (!OPENAI_API_KEY ||
        OPENAI_API_KEY === 'REPLACE_WITH_NEW_VALID_API_KEY' ||
        OPENAI_API_KEY.includes('your_new_openai_api_key_here') ||
        OPENAI_API_KEY.includes('REPLACE_WITH')) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured. Please add a valid API key to .env.local file. See instructions in the file.'
        },
        { status: 500 }
      )
    }

    console.log(`Starting caption generation for video: ${videoId}`)

    // Update video status to 'captioning'
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'captioning' }
    })

    try {
      // Get video file path - ensure it includes the public directory
      let relativePath = video.filePath;
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.slice(1);
      }
      if (!relativePath.startsWith('public/')) {
        relativePath = `public/${relativePath}`;
      }
      const videoPath = join(process.cwd(), relativePath);

      // Check if video file exists
      if (!(await pathExists(videoPath))) {
        throw new Error(`Video file not found: ${videoPath}`)
      }

      console.log(`Processing video file: ${videoPath}`)

      // Read video file as buffer
      const videoFile = await fs.readFile(videoPath)

      // Create a readable stream from the buffer
      const videoStream = new ReadableStream({
        start(controller) {
          controller.enqueue(videoFile)
          controller.close()
        }
      })

      // Create a File object from the buffer
      const videoFileObj = new File([videoFile], video.fileName, {
        type: 'video/mp4'
      })

      console.log(`Starting real caption generation with OpenAI Whisper API...`)

      // Create transcription with OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: videoFileObj,
        model: "whisper-1",
        language: "en", // Will auto-detect but prefer English
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
        temperature: 0.0 // Lower temperature for more consistent results
      })

      console.log(`OpenAI Whisper transcription completed:`, transcription)

      // Parse the verbose response to extract segments with timestamps
      const captions: CaptionData[] = []

      if (transcription.segments && Array.isArray(transcription.segments)) {
        transcription.segments.forEach((segment) => {
          const text = segment.text.trim()
          // Skip empty segments or silence markers
          if (text && text !== '[silence]' && text !== '[music]') {
            captions.push({
              startTime: Math.round(segment.start * 100) / 100, // Round to 2 decimal places
              endTime: Math.round(segment.end * 100) / 100,
              text
            })
          }
        })
      } else {
        // Fallback: create a single segment with the full text
        if (transcription.text) {
          captions.push({
            startTime: 0,
            endTime: transcription.duration || 0,
            text: transcription.text.trim()
          })
        }
      }

      if (captions.length === 0) {
        throw new Error('No captions were generated from the audio')
      }

      console.log(`Generated ${captions.length} caption segments`)

      // Delete existing captions for this video
      await prisma.caption.deleteMany({
        where: { videoId }
      })

      // Create new captions in database
      const captionRecords = await Promise.all(
        captions.map((caption) =>
          prisma.caption.create({
            data: {
              id: createId(),
              videoId,
              text: caption.text,
              startTime: caption.startTime,
              endTime: caption.endTime,
              language: detectLanguage(caption.text),
              style: 'default'
            }
          })
        )
      )

      // Update video status to 'completed' and store duration
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'completed',
          duration: transcription.duration
        }
      })

      console.log(`Caption generation completed for video: ${videoId}. Generated ${captionRecords.length} captions`)

      // Format response
      const response: CaptionGenerationResponse = {
        success: true,
        data: {
          videoId,
          captions,
          generatedAt: new Date().toISOString()
        }
      }

      return NextResponse.json(response)

    } catch (generationError: any) {
      console.error('Caption generation failed:', generationError)

      // Update video status to 'failed' on error
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'failed' }
      })

      // Handle specific OpenAI API errors
      if (generationError.message?.includes('Invalid API key')) {
        return NextResponse.json(
          { success: false, error: 'Invalid OpenAI API key' },
          { status: 500 }
        )
      }

      if (generationError.message?.includes('insufficient_quota')) {
        return NextResponse.json(
          { success: false, error: 'OpenAI API quota exceeded' },
          { status: 500 }
        )
      }

      if (generationError.message?.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: 'Caption generation timed out. Please try again.' },
          { status: 408 }
        )
      }

      throw generationError
    }

  } catch (error: any) {
    console.error('Error generating captions:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate captions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Simple language detection based on character patterns
 * This is a basic implementation - replace with proper language detection later
 */
function detectLanguage(text: string): string {
  // Check for Hindi characters (Devanagari script)
  const hindiRegex = /[\u0900-\u097F]/
  if (hindiRegex.test(text)) {
    return 'hi-IN'
  }

  // Default to English
  return 'en-US'
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to generate captions.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to generate captions.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to generate captions.' },
    { status: 405 }
  )
}