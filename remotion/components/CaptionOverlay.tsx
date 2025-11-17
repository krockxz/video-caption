/**
 * Caption Overlay Component
 *
 * Provides three different caption styles for video rendering:
 * 1. DefaultStyle - Bottom-centered subtitles
 * 2. NewsbarStyle - Top-bar captions like news crawl
 * 3. KaraokeStyle - Word-level highlighting
 */

import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  Easing,
  Sequence
} from 'remotion'

export interface CaptionOverlayProps {
  text: string
  style: 'default' | 'newsbar' | 'karaoke'
  progress?: number // 0-1, for karaoke highlighting and animations
  width?: number
  height?: number
  startTime?: number
  endTime?: number
}

// Language detection utility
const detectLanguage = (text: string): 'hindi' | 'english' | 'mixed' => {
  const hindiRegex = /[\u0900-\u097F]/
  const englishRegex = /[a-zA-Z]/

  const hasHindi = hindiRegex.test(text)
  const hasEnglish = englishRegex.test(text)

  if (hasHindi && hasEnglish) return 'mixed'
  if (hasHindi) return 'hindi'
  return 'english'
}

// Font family selector based on language
const getFontFamily = (language: 'hindi' | 'english' | 'mixed') => {
  switch (language) {
    case 'hindi':
      return '"Noto Sans Devanagari", sans-serif'
    case 'mixed':
      return '"Noto Sans", "Noto Sans Devanagari", sans-serif'
    case 'english':
    default:
      return '"Noto Sans", sans-serif'
  }
}

// Text wrapper for long captions
const wrapText = (text: string, maxCharsPerLine: number = 40): string[] => {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine = currentLine ? currentLine + ' ' + word : word
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Word is too long, put it on its own line
        lines.push(word)
      }
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

/**
 * Default Style - Bottom-centered subtitles
 */
const DefaultStyle: React.FC<{ text: string; progress?: number }> = ({ text, progress = 0 }) => {
  const frame = useCurrentFrame()
  const language = detectLanguage(text)
  const fontFamily = getFontFamily(language)
  const lines = wrapText(text, 50)

  // Fade in animation
  const opacity = spring({
    frame,
    fps: 30,
    config: { damping: 20 },
  })

  // Subtle scale animation
  const scale = interpolate(
    frame,
    [0, 10],
    [0.95, 1],
    { extrapolateRight: 'clamp' }
  )

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        opacity,
        textAlign: 'center',
        maxWidth: '90%',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontFamily,
          fontSize: '48px',
          fontWeight: 600,
          lineHeight: 1.4,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </div>
  )
}

/**
 * Newsbar Style - Top-bar captions like news crawl
 */
const NewsbarStyle: React.FC<{ text: string; progress?: number }> = ({ text, progress = 0 }) => {
  const frame = useCurrentFrame()
  const language = detectLanguage(text)
  const fontFamily = getFontFamily(language)

  // Slide in animation from left
  const translateX = interpolate(
    frame,
    [0, 30],
    [-100, 0],
    { extrapolateRight: 'clamp' }
  )

  // Fade in
  const opacity = spring({
    frame,
    fps: 30,
    config: { damping: 15 },
  })

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(40, 40, 40, 0.95)',
        padding: '16px 32px',
        opacity,
        transform: `translateX(${translateX}%)`,
        borderBottom: '3px solid #ff6b35',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          color: 'white',
          fontFamily,
          fontSize: '36px',
          fontWeight: 500,
          lineHeight: 1.3,
          textAlign: 'left',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  )
}

/**
 * Karaoke Style - Word-level highlighting
 */
const KaraokeStyle: React.FC<{ text: string; progress?: number }> = ({ text, progress = 0 }) => {
  const frame = useCurrentFrame()
  const language = detectLanguage(text)
  const fontFamily = getFontFamily(language)

  // Split text into words
  const words = text.split(' ')
  const totalWords = words.length
  const currentWordIndex = Math.floor(progress * totalWords)
  const wordProgress = (progress * totalWords) % 1

  // Pulse animation for current word
  const pulseScale = 1 + Math.sin(frame * 0.3) * 0.1

  // Overall fade in
  const opacity = spring({
    frame,
    fps: 30,
    config: { damping: 20 },
  })

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 120,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity,
        textAlign: 'center',
        maxWidth: '90%',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: '20px 32px',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: '52px',
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: '0.5px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {words.map((word, index) => {
            let color = '#808080' // Future words - gray
            let transform = 'scale(1)'
            let textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)'

            if (index < currentWordIndex) {
              color = '#ffffff' // Past words - white
            } else if (index === currentWordIndex) {
              color = '#00ff88' // Current word - bright green/lime
              transform = `scale(${pulseScale})`
              textShadow = '0 0 20px rgba(0, 255, 136, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5)'
            }

            return (
              <span
                key={index}
                style={{
                  color,
                  transform,
                  transition: 'all 0.2s ease-out',
                  textShadow,
                  display: 'inline-block',
                  margin: '2px',
                }}
              >
                {word}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Main Caption Overlay Component
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  text,
  style,
  progress = 0,
  width = 1920,
  height = 1080,
  startTime,
  endTime
}) => {
  // Validate props
  if (!text || !text.trim()) {
    return null
  }

  // Calculate duration-based progress if start/end times are provided
  let calculatedProgress = progress
  if (startTime !== undefined && endTime !== undefined && startTime < endTime) {
    const frame = useCurrentFrame()
    const currentTime = (frame / 30) // Convert to seconds
    const duration = endTime - startTime

    if (currentTime >= startTime && currentTime <= endTime) {
      calculatedProgress = (currentTime - startTime) / duration
      calculatedProgress = Math.max(0, Math.min(1, calculatedProgress))
    } else if (currentTime > endTime) {
      calculatedProgress = 1
    } else {
      calculatedProgress = 0
    }
  }

  // Render the appropriate style
  switch (style) {
    case 'default':
      return <DefaultStyle text={text} progress={calculatedProgress} />
    case 'newsbar':
      return <NewsbarStyle text={text} progress={calculatedProgress} />
    case 'karaoke':
      return <KaraokeStyle text={text} progress={calculatedProgress} />
    default:
      return <DefaultStyle text={text} progress={calculatedProgress} />
  }
}

// Export individual styles for advanced usage
export { DefaultStyle, NewsbarStyle, KaraokeStyle }

export default CaptionOverlay