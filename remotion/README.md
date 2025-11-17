# Remotion Video Rendering Setup

This directory contains the complete Remotion setup for rendering videos with AI-generated captions.

## 📁 Directory Structure

```
remotion/
├── components/
│   └── CaptionOverlay.tsx      # Main caption component with 3 styles
├── compositions/
│   ├── CaptionedVideo.tsx      # Main video composition
│   └── CaptionStyleDemo.tsx    # Demo showcasing all styles
├── remotion.config.ts          # Remotion configuration
├── index.ts                    # Module exports
└── README.md                   # This file
```

## 🎨 Caption Styles

### 1. Default Style (`default`)
- Bottom-centered subtitles
- White text with semi-transparent black background
- Font: Noto Sans / Noto Sans Devanagari (auto-detect)
- Size: 48px, Weight: 600
- Smooth fade-in animation

### 2. Newsbar Style (`newsbar`)
- Top banner like news crawl
- Dark gray background with orange accent
- Left-aligned white text
- Font size: 36px
- Slide-in animation from left

### 3. Karaoke Style (`karaoke`)
- Word-level highlighting
- Current word: Bright green with glow effect
- Past words: White
- Future words: Gray
- Pulsing animation on active word
- Font size: 52px

## 🛠️ Usage

### Basic Usage

```typescript
import { createCaptionedVideo } from './remotion'

const captions = [
  {
    id: '1',
    videoId: 'video123',
    text: 'Hello everyone! आज हम सीखेंगे।',
    startTime: 0,
    endTime: 4,
    language: 'mixed',
    style: 'default'
  },
  // ... more captions
]

const MyVideo = createCaptionedVideo(
  '/path/to/video.mp4',
  captions,
  'default', // style
  {
    width: 1920,
    height: 1080,
    fps: 30
  }
)
```

### Advanced Usage with Custom Components

```typescript
import { CaptionedVideoComposition, CaptionOverlay } from './remotion'

const CustomVideo = () => {
  return (
    <CaptionedVideoComposition
      videoPath="/path/to/video.mp4"
      captions={captions}
      style="karaoke"
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={900} // 30 seconds at 30fps
    />
  )
}
```

### Standalone Caption Overlay

```typescript
import { CaptionOverlay } from './remotion'

<CaptionOverlay
  text="Hello! यह एक example है।"
  style="default"
  progress={0.5} // 0-1 for animations
  width={1920}
  height={1080}
/>
```

## 🎬 Rendering Videos

### Using Remotion CLI

```bash
# Preview in browser
npx remotion preview remotion/compositions/CaptionedVideo.tsx

# Render video
npx remotion render remotion/compositions/CaptionedVideo.tsx CaptionedVideo --codec=h264 --output=video.mp4

# Render with specific props
npx remotion render remotion/compositions/CaptionedVideo.tsx CaptionedVideo \
  --props='{"videoPath":"input.mp4","captions":[],"style":"default"}' \
  --output=output.mp4
```

### Using the Demo

```bash
# Preview caption styles demo
npx remotion preview remotion/compositions/CaptionStyleDemo.tsx

# Render demo video
npx remotion render remotion/compositions/CaptionStyleDemo.tsx CaptionStyleDemo \
  --output=caption-styles-demo.mp4
```

## ⚙️ Configuration

### Video Quality Presets

```typescript
import { PRESETS } from './remotion/config'

// High quality (CRF 18)
PRESETS.HIGH_QUALITY

// Web optimized (CRF 23)
PRESETS.WEB_OPTIMIZED

// Fast preview (CRF 28)
PRESETS.FAST_PREVIEW

// ProRes 422 for post-production
PRESETS.PRORES_422
```

### Font Configuration

The setup automatically detects and uses appropriate fonts:

- **English text**: Noto Sans
- **Hindi/Devanagari text**: Noto Sans Devanagari
- **Mixed Hinglish**: Both fonts as fallbacks

### Color Schemes

```typescript
import { CAPTION_COLORS } from './remotion/config'

// Access predefined colors
CAPTION_COLORS.DEFAULT    // For default style
CAPTION_COLORS.NEWSBAR   // For newsbar style
CAPTION_COLORS.KARAOKE   // For karaoke style
```

## 🔧 Features

### ✅ Implemented Features

- **Multi-language Support**: Automatic detection of English, Hindi, and mixed Hinglish text
- **Smart Font Selection**: Automatically chooses appropriate fonts based on detected language
- **Text Wrapping**: Long captions are properly wrapped across multiple lines
- **Smooth Animations**: Fade-ins, slides, and pulsing effects
- **Progress Tracking**: Word-level highlighting for karaoke style
- **High-Quality Rendering**: H.264 codec with configurable quality settings
- **Performance Optimized**: Hardware acceleration and memory management
- **TypeScript Support**: Full type safety and IntelliSense

### 🎯 Key Capabilities

- **Hinglish Support**: Seamlessly handles mixed English-Hindi content
- **Professional Output**: Broadcast-quality video rendering
- **Flexible Styling**: Three distinct caption styles for different use cases
- **Developer Friendly**: Easy-to-use API with comprehensive documentation
- **Performance**: Optimized for both preview and final rendering

## 🚀 Getting Started

1. **Install Dependencies** (already done):
   ```bash
   npm install remotion @remotion/cli @remotion/eslint-config --legacy-peer-deps
   ```

2. **Preview Demo**:
   ```bash
   npx remotion preview remotion/compositions/CaptionStyleDemo.tsx
   ```

3. **Create Your Composition**:
   ```typescript
   import { createCaptionedVideo } from './remotion'

   // Your video composition here
   ```

4. **Render Your Video**:
   ```bash
   npx remotion render your-composition.tsx YourComposition --output=output.mp4
   ```

## 📋 API Reference

### `createCaptionedVideo(videoPath, captions, style, options)`

Creates a complete captioned video composition.

**Parameters:**
- `videoPath`: Path to the video file
- `captions`: Array of caption objects
- `style`: Caption style (`'default' | 'newsbar' | 'karaoke'`)
- `options`: Optional configuration (width, height, fps, duration)

**Returns:** React component ready for rendering

### `CaptionOverlay` Component

Renders caption overlays with different styles.

**Props:**
- `text`: Caption text
- `style`: Caption style
- `progress`: Animation progress (0-1)
- `width/height`: Video dimensions
- `startTime/endTime`: Caption timing (optional)

## 🐛 Troubleshooting

### Common Issues

1. **Fonts Not Loading**: Ensure fonts are properly installed or use web fonts
2. **Hindi Text Not Displaying**: Check font support for Devanagari script
3. **Performance Issues**: Use hardware acceleration and reduce preview quality
4. **Audio Sync**: Ensure frame rate matches video frame rate

### Development Tips

- Use `npx remotion preview` for fast iteration
- Start with lower quality settings for testing
- Test with various languages and text lengths
- Monitor memory usage with long videos

---

This Remotion setup provides a complete solution for professional video caption rendering with full Hinglish support and multiple styling options.