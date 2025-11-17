/**
 * Remotion Configuration
 *
 * Configuration for video rendering with optimal settings for captioned videos.
 * Includes codec settings, quality options, and font configurations.
 */

import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)

// Set default image format for previews
Config.setPixelFormat('yuv420p')

// Configure browser executable if needed
// Config.setBrowserExecutable('/path/to/chrome')

// Set concurrency for rendering
Config.setConcurrency(1)

// Default quality settings
// Note: Quality setting might not be available in this version

// Set default codec to H.264 for maximum compatibility
Config.setCodec('h264')

// Configure H.264 specific settings
Config.setX264Preset('medium') // Balance between speed and quality
Config.setCrf(18) // High quality (lower is better, 18-23 is good range)

// Audio settings
Config.setAudioCodec('aac')
Config.setAudioBitrate('320k')

// Configure rendering settings
Config.setEnforceAudioTrack(true)

// Custom video format presets
const PRESETS = {
  // High quality for final delivery
  HIGH_QUALITY: {
    codec: 'h264' as const,
    crf: 18,
    preset: 'slow' as const,
    audioBitrate: '320k' as const,
  },

  // Medium quality for web
  WEB_OPTIMIZED: {
    codec: 'h264' as const,
    crf: 23,
    preset: 'medium' as const,
    audioBitrate: '192k' as const,
  },

  // Fast rendering for previews
  FAST_PREVIEW: {
    codec: 'h264' as const,
    crf: 28,
    preset: 'fast' as const,
    audioBitrate: '128k' as const,
  },

  // ProRes for high-quality intermediate files
  PRORES_STANDARD: {
    codec: 'prores' as const,
    proResProfile: 'standard' as const,
    audioBitrate: '320k' as const,
  },
}

// Export presets for use in compositions
export { PRESETS }

// Font family configuration for different languages
export const FONT_CONFIG = {
  // Fallback font stack
  fallbacks: {
    english: ['"Noto Sans"', 'Arial', 'Helvetica', 'sans-serif'],
    hindi: ['"Noto Sans Devanagari"', '"Noto Sans"', 'sans-serif'],
    mixed: ['"Noto Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
  },
}

// Color presets for different caption styles
export const CAPTION_COLORS = {
  DEFAULT: {
    background: 'rgba(0, 0, 0, 0.8)',
    text: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  NEWSBAR: {
    background: 'rgba(40, 40, 40, 0.95)',
    text: '#ffffff',
    accent: '#ff6b35',
    shadow: 'rgba(0, 0, 0, 0.8)',
  },

  KARAOKE: {
    background: 'rgba(0, 0, 0, 0.85)',
    text: '#ffffff',
    active: '#00ff88',
    future: '#808080',
    glow: 'rgba(0, 255, 136, 0.8)',
  },
}

// Performance optimizations
Config.setChromiumOpenGlRenderer('egl') // Better GPU acceleration

export default Config