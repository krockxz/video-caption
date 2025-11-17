/**
 * Caption Style Demo Composition
 *
 * Demonstrates all three caption styles with sample Hinglish text.
 * Useful for testing and previewing different caption options.
 */

import React from 'react'
import {
  Composition,
  Sequence,
  useCurrentFrame,
  AbsoluteFill,
} from 'remotion'
import { CaptionOverlay } from '../components/CaptionOverlay'

// Sample captions in Hinglish for demonstration
const sampleCaptions = [
  {
    text: "Hello everyone! आज हम caption styles देखेंगे।",
    startTime: 0,
    endTime: 4,
  },
  {
    text: "यह default style है - simple and clean subtitles।",
    startTime: 5,
    endTime: 9,
  },
  {
    text: "Now showing newsbar style - जैसे TV पर देखते हैं!",
    startTime: 10,
    endTime: 14,
  },
  {
    text: "And this is karaoke style - word by word highlighting!",
    startTime: 15,
    endTime: 19,
  },
  {
    text: "Mixed languages work perfectly: English + Hindi = Hinglish!",
    startTime: 20,
    endTime: 24,
  },
  {
    text: "धन्यवाद! Thank you for watching this demo.",
    startTime: 25,
    endTime: 30,
  },
]

// Demo component for each style
const StyleDemo: React.FC<{
  style: 'default' | 'newsbar' | 'karaoke'
  title: string
  duration: number
  startTime: number
}> = ({ style, title, duration, startTime }) => {
  const frame = useCurrentFrame()
  const adjustedFrame = frame - startTime * 30 // Adjust for sequence start
  const currentTime = adjustedFrame / 30

  if (currentTime < 0 || currentTime > duration) {
    return null
  }

  const currentCaption = sampleCaptions.find(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  )

  if (!currentCaption) {
    return null
  }

  const progress = (currentTime - currentCaption.startTime) /
    (currentCaption.endTime - currentCaption.startTime)

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontFamily: '"Noto Sans", sans-serif',
          fontSize: '36px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '12px 24px',
          borderRadius: '8px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {title}
      </div>

      {/* Caption */}
      <CaptionOverlay
        text={currentCaption.text}
        style={style}
        progress={style === 'karaoke' ? progress : 0}
      />

      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            width: `${(currentTime / duration) * 100}%`,
            height: '100%',
            backgroundColor: '#00ff88',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Time display */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '18px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: '4px',
        }}
      >
        {currentTime.toFixed(1)}s / {duration}s
      </div>
    </AbsoluteFill>
  )
}

// Main demo composition
const CaptionStyleDemo: React.FC = () => {
  const styleDuration = 35 // 35 seconds per style
  const totalDuration = styleDuration * 3 + 3 // Add 3 seconds for intro

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill
          style={{
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontFamily: '"Noto Sans", sans-serif',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 700,
                margin: 0,
                marginBottom: '20px',
              }}
            >
              Caption Styles Demo
            </h1>
            <div style={{ fontSize: '24px', opacity: 0.8 }}>
              Demonstrating Default, Newsbar, and Karaoke styles
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Default Style Demo */}
      <Sequence from={90} durationInFrames={styleDuration * 30}>
        <StyleDemo
          style="default"
          title="Default Style"
          duration={styleDuration}
          startTime={3}
        />
      </Sequence>

      {/* Newsbar Style Demo */}
      <Sequence from={(3 + styleDuration) * 30} durationInFrames={styleDuration * 30}>
        <StyleDemo
          style="newsbar"
          title="Newsbar Style"
          duration={styleDuration}
          startTime={3 + styleDuration}
        />
      </Sequence>

      {/* Karaoke Style Demo */}
      <Sequence from={(3 + styleDuration * 2) * 30} durationInFrames={styleDuration * 30}>
        <StyleDemo
          style="karaoke"
          title="Karaoke Style"
          duration={styleDuration}
          startTime={3 + styleDuration * 2}
        />
      </Sequence>
    </AbsoluteFill>
  )
}

// Export composition
export const CaptionStyleDemoComposition = () => (
  <Composition
    id="CaptionStyleDemo"
    component={CaptionStyleDemo}
    durationInFrames={(35 * 3 + 3) * 30} // 108 seconds total
    fps={30}
    width={1920}
    height={1080}
  />
)

export default CaptionStyleDemo