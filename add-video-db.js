// Simple script to add the uploaded video to the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addVideoToDatabase() {
  try {
    const videoData = {
      id: 'video_1763405161077_q3lpl5umf',
      userId: 'test-user-1',
      title: 'Welcome to Hinglish Hub',
      fileName: 'Welcome to Hinglish Hub.mp4',
      filePath: '/uploads/video_1763405161077_q3lpl5umf/video_1763405161077_q3lpl5umf.mp4',
      status: 'completed'
    };

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: { id: videoData.id }
    });

    if (existingVideo) {
      console.log('Video already exists in database');
      return;
    }

    // Create video entry
    const video = await prisma.video.create({
      data: videoData
    });

    console.log('✅ Video added to database:', video);
  } catch (error) {
    console.error('❌ Error adding video to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addVideoToDatabase();