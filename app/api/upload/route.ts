import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/db'

// Constants
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB in bytes
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv'
]

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    let formData;
    try {
      formData = await request.formData()
    } catch (parseError) {
      console.error('FormData parse error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse form data', details: parseError instanceof Error ? parseError.message : 'Unknown parsing error' },
        { status: 400 }
      )
    }

    const file = formData.get('video') as File
    const title = formData.get('title') as string
    const userId = formData.get('userId') as string

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate file type (temporarily allow application/octet-stream for testing)
    const mimeType = file.type || 'video/mp4'; // Default to video/mp4 for testing
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only MP4, MPEG, MOV, AVI, and WMV files are allowed` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 500MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      )
    }

    // Generate unique video ID and directory
    const videoId = createId()
    const uploadDir = join(process.cwd(), 'public', 'uploads', videoId)

    // Create upload directory
    await mkdir(uploadDir, { recursive: true })

    // Generate file path
    const fileExtension = file.name.split('.').pop()
    const fileName = `${videoId}.${fileExtension}`
    const filePath = join(uploadDir, fileName)
    const relativePath = `/uploads/${videoId}/${fileName}`

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        id: videoId,
        userId,
        title,
        fileName: file.name,
        filePath: relativePath,
        status: 'completed' // Since upload is complete, mark as completed
      }
    })

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        videoId: video.id,
        fileName: video.fileName,
        uploadPath: video.filePath,
        title: video.title,
        status: video.status,
        uploadedAt: video.uploadedAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json(
      {
        error: 'Failed to upload video',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for file uploads.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for file uploads.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for file uploads.' },
    { status: 405 }
  )
}