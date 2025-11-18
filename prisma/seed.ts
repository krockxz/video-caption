import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

// Sample data
const sampleVideos = [
  {
    id: createId(),
    title: "Sample Tech Demo Video",
    fileName: "tech-demo.mp4",
    filePath: "/uploads/sample_videos/tech-demo.mp4",
    duration: 120.5,
    status: "completed" as const,
    uploadedAt: new Date('2025-01-15T10:30:00Z')
  },
  {
    id: createId(),
    title: "Hinglish Content Sample",
    fileName: "hinglish-sample.mp4",
    filePath: "/uploads/sample_videos/hinglish-sample.mp4",
    duration: 180.0,
    status: "completed" as const,
    uploadedAt: new Date('2025-01-15T14:20:00Z')
  },
  {
    id: createId(),
    title: "Educational Content",
    fileName: "education.mp4",
    filePath: "/uploads/sample_videos/education.mp4",
    duration: 240.75,
    status: "completed" as const,
    uploadedAt: new Date('2025-01-16T09:15:00Z')
  }
]

const sampleCaptions = [
  // Tech Demo Video Captions (English)
  {
    id: createId(),
    videoId: sampleVideos[0].id,
    text: "Welcome to our platform demonstration",
    startTime: 0.0,
    endTime: 3.5,
    language: "en-US",
    style: "default" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[0].id,
    text: "This video showcases our caption generation technology",
    startTime: 3.5,
    endTime: 7.2,
    language: "en-US",
    style: "default" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[0].id,
    text: "We support multiple caption styles for different use cases",
    startTime: 7.2,
    endTime: 11.0,
    language: "en-US",
    style: "default" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[0].id,
    text: "Let's explore the features together",
    startTime: 11.0,
    endTime: 14.8,
    language: "en-US",
    style: "default" as const
  },

  // Hinglish Sample Captions (Mixed)
  {
    id: createId(),
    videoId: sampleVideos[1].id,
    text: "Hello dosto, aaj hum baat karenge content creation ke bare mein",
    startTime: 0.0,
    endTime: 4.5,
    language: "hi-IN",
    style: "newsbar" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[1].id,
    text: "This is a mix of Hindi and English - Hinglish content",
    startTime: 4.5,
    endTime: 8.0,
    language: "en-US",
    style: "newsbar" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[1].id,
    text: "Aapke videos ko engage karne ke liye yeh approach bahut effective hai",
    startTime: 8.0,
    endTime: 12.3,
    language: "hi-IN",
    style: "newsbar" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[1].id,
    text: "Let's see how to create viral content together",
    startTime: 12.3,
    endTime: 16.0,
    language: "en-US",
    style: "newsbar" as const
  },

  // Educational Video Captions (Mixed)
  {
    id: createId(),
    videoId: sampleVideos[2].id,
    text: "In this lesson, we'll learn about modern web development",
    startTime: 0.0,
    endTime: 5.0,
    language: "en-US",
    style: "karaoke" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[2].id,
    text: "React aur Next.js ka use karke hum amazing applications bana sakte hain",
    startTime: 5.0,
    endTime: 10.5,
    language: "hi-IN",
    style: "karaoke" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[2].id,
    text: "Let's start with the basics and build up gradually",
    startTime: 10.5,
    endTime: 15.8,
    language: "en-US",
    style: "karaoke" as const
  },
  {
    id: createId(),
    videoId: sampleVideos[2].id,
    text: "Practical examples se samjhna bahut aasan hota hai",
    startTime: 15.8,
    endTime: 20.0,
    language: "hi-IN",
    style: "karaoke" as const
  }
]

const sampleRenders = [
  // Tech Demo Video Renders
  {
    id: createId(),
    videoId: sampleVideos[0].id,
    captionStyle: "default" as const,
    status: "completed" as const,
    outputPath: "/renders/tech-demo-default.mp4",
    createdAt: new Date('2025-01-15T11:00:00Z')
  },
  {
    id: createId(),
    videoId: sampleVideos[0].id,
    captionStyle: "newsbar" as const,
    status: "completed" as const,
    outputPath: "/renders/tech-demo-newsbar.mp4",
    createdAt: new Date('2025-01-15T11:05:00Z')
  },
  {
    id: createId(),
    videoId: sampleVideos[0].id,
    captionStyle: "karaoke" as const,
    status: "pending" as const,
    outputPath: null,
    createdAt: new Date('2025-01-15T11:10:00Z')
  },

  // Hinglish Sample Renders
  {
    id: createId(),
    videoId: sampleVideos[1].id,
    captionStyle: "newsbar" as const,
    status: "completed" as const,
    outputPath: "/renders/hinglish-newsbar.mp4",
    createdAt: new Date('2025-01-15T14:30:00Z')
  },
  {
    id: createId(),
    videoId: sampleVideos[1].id,
    captionStyle: "karaoke" as const,
    status: "rendering" as const,
    outputPath: null,
    createdAt: new Date('2025-01-15T14:35:00Z')
  },

  // Educational Video Renders
  {
    id: createId(),
    videoId: sampleVideos[2].id,
    captionStyle: "karaoke" as const,
    status: "completed" as const,
    outputPath: "/renders/education-karaoke.mp4",
    createdAt: new Date('2025-01-16T09:30:00Z')
  }
]

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Clean up existing data
    console.log('🧹 Cleaning up existing data...')
    await prisma.render.deleteMany()
    await prisma.caption.deleteMany()
    await prisma.video.deleteMany()
    await prisma.user.deleteMany()

    // Create test user
    console.log('👤 Creating test user...')
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-1',
        email: 'test@example.com',
        createdAt: new Date('2025-01-01T00:00:00Z')
      }
    })
    console.log(`✅ Created user: ${testUser.email}`)

    // Update video IDs to use hardcoded user ID
    const videosWithUserId = sampleVideos.map(video => ({
      ...video,
      userId: 'test-user-1'
    }))

    // Create sample videos
    console.log('🎥 Creating sample videos...')
    const createdVideos = await Promise.all(
      videosWithUserId.map(video =>
        prisma.video.create({
          data: video
        })
      )
    )
    console.log(`✅ Created ${createdVideos.length} videos`)

    // Create sample captions
    console.log('📝 Creating sample captions...')
    const createdCaptions = await Promise.all(
      sampleCaptions.map(caption =>
        prisma.caption.create({
          data: caption
        })
      )
    )
    console.log(`✅ Created ${createdCaptions.length} captions`)

    // Create sample renders
    console.log('🎬 Creating sample renders...')
    const createdRenders = await Promise.all(
      sampleRenders.map(render =>
        prisma.render.create({
          data: render
        })
      )
    )
    console.log(`✅ Created ${createdRenders.length} renders`)

    // Summary
    console.log('\n📊 Database seeded successfully!')
    console.log('\n📋 Summary:')
    console.log(`  • Users: 1`)
    console.log(`  • Videos: ${createdVideos.length}`)
    console.log(`  • Captions: ${createdCaptions.length}`)
    console.log(`  • Renders: ${createdRenders.length}`)

    console.log('\n🎯 Sample Content:')
    createdVideos.forEach((video, index) => {
      const captionCount = sampleCaptions.filter(c => c.videoId === video.id).length
      const renderCount = sampleRenders.filter(r => r.videoId === video.id).length
      console.log(`  ${index + 1}. ${video.title}`)
      console.log(`     • Duration: ${video.duration}s`)
      console.log(`     • Captions: ${captionCount}`)
      console.log(`     • Renders: ${renderCount}`)
    })

    console.log('\n🚀 Ready for testing!')
    console.log('💡 Run: npx prisma studio to explore the data')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })