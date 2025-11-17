# Database Setup Guide

This document provides instructions for setting up and managing the SQLite database for the Captioning Platform.

## Quick Start Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with test data
npx prisma db seed
```

### 3. Database Management
```bash
# Open Prisma Studio (GUI for database management)
npx prisma studio

# Reset database (destructive - removes all data)
npx prisma migrate reset

# Push schema changes (for development)
npx prisma db push

# Format schema file
npx prisma format
```

## Complete Setup Process

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:
```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
PORT=3000
UPLOAD_DIR="/public/uploads"
MAX_FILE_SIZE=524288000
OPENAI_API_KEY="your_api_key_here"
```

### Step 3: Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed
```

### Step 4: Explore Data
```bash
# Open Prisma Studio to view data
npx prisma studio
```

## Sample Data Structure

The seed script creates the following test data:

### User
- **Email**: test@example.com
- **ID**: test-user-1

### Sample Videos (3 videos)
1. **Tech Demo Video** (120.5s)
   - English captions with default style
   - Multiple renders (completed, completed, pending)

2. **Hinglish Content Sample** (180.0s)
   - Mixed Hindi/English captions with newsbar style
   - Completed and rendering renders

3. **Educational Content** (240.75s)
   - Mixed captions with karaoke style
   - Completed render

### Captions (12 total)
- **English captions**: Tech demos and educational content
- **Hinglish captions**: Mixed language examples
- **Styles**: default, newsbar, karaoke

### Renders (6 total)
- **Statuses**: completed, rendering, pending
- **Styles**: All three caption styles represented

## Database Schema

### Tables
- **users**: User accounts
- **videos**: Video files and metadata
- **captions**: Text captions with timing
- **renders**: Render jobs with different caption styles

### Relationships
- User → Videos (one-to-many)
- Video → Captions (one-to-many)
- Video → Renders (one-to-many)

## Development Workflow

### Making Schema Changes
1. Update `prisma/schema.prisma`
2. Run migration: `npx prisma migrate dev --name your_change_name`
3. Generate client: `npx prisma generate`

### Resetting Database
```bash
# Completely reset database (all data lost)
npx prisma migrate reset

# Reseed after reset
npx prisma db seed
```

### Viewing Data
```bash
# Launch Studio GUI
npx prisma studio

# Navigate to http://localhost:5555
```

## Environment Configuration

### Required Variables
- `DATABASE_URL`: SQLite database path
- `NODE_ENV`: Development/production mode
- `PORT`: Server port (default: 3000)

### Optional Variables
- `OPENAI_API_KEY`: For OpenAI Whisper API integration
- `UPLOAD_DIR`: File upload directory
- `MAX_FILE_SIZE`: Maximum file size in bytes
- `POLLING_INTERVAL`: Render polling interval
- `RENDER_TIMEOUT`: Render job timeout

## Troubleshooting

### Database Locked Error
If you get a "database is locked" error:
```bash
# Ensure no processes are using the database
npx prisma migrate reset

# Or restart your development server
```

### Migration Issues
If migrations fail:
```bash
# Reset and try again
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Seed Data Issues
If seeding fails:
```bash
# Check schema is up to date
npx prisma generate

# Manually run seed
npx tsx prisma/seed.ts
```

## File Structure

```
prisma/
├── schema.prisma      # Database schema definition
├── seed.ts           # Sample data generation
└── migrations/       # Database migration files
    └── 20251117110949_init/
        └── migration.sql
```

## Next Steps

After setting up the database:

1. **Start Development Server**: `npm run dev`
2. **Test APIs**: Use `/test-videos` and `/test-captions` pages
3. **Explore Data**: Open Prisma Studio to view sample data
4. **Upload Videos**: Test the upload functionality
5. **Generate Captions**: Test caption generation with sample videos