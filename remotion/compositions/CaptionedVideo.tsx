/**
 * CaptionedVideo Composition
 *
 * Main Remotion composition for rendering videos with captions overlay.
 * Supports multiple caption styles and proper timing synchronization.
 */

import React from 'react'
import {
  Composition,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  spring,
  Easing,
  interpolate,
  Video
} from 'remotion'
import type { AnyZodObject } from 'zod'
import { CaptionOverlay } from '../components/CaptionOverlay'

export interface Caption {
  id: string
  videoId: string
  text: string
  startTime: number
  endTime: number
  language: string
  style: 'default' | 'newsbar' | 'karaoke'
}

export interface CaptionedVideoProps extends Record<string, unknown> {
  videoPath: string
  captions: Caption[]
  style: 'default' | 'newsbar' | 'karaoke'
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
}

const DEFAULT_CAPTIONED_VIDEO_PROPS: CaptionedVideoProps = {
  videoPath: '',
  captions: [],
  style: 'default',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 900,
}

/**
 * Video Background Component
 */
const VideoBackground: React.FC<{ videoPath: string; style?: React.CSSProperties }> = ({
  videoPath,
  style = {}
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <Video
        src={videoPath}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </AbsoluteFill>
  )
}

/**
 * Caption Track Component
 */
const CaptionTrack: React.FC<{
  captions: Caption[]
  style: 'default' | 'newsbar' | 'karaoke'
  videoDuration: number
}> = ({ captions, style, videoDuration }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentTime = frame / fps

  // Find current caption
  const currentCaption = captions.find(
    caption => currentTime >= caption.startTime && currentTime <= caption.endTime
  )

  if (!currentCaption) {
    return null
  }

  // Calculate progress for karaoke style or animations
  const captionProgress = (currentTime - currentCaption.startTime) /
    (currentCaption.endTime - currentCaption.startTime)

  return (
    <CaptionOverlay
      text={currentCaption.text}
      style={style}
      progress={captionProgress}
      startTime={currentCaption.startTime}
      endTime={currentCaption.endTime}
    />
  )
}

/**
 * Loading/Intro Screen
 */
const LoadingScreen: React.FC<{ title: string; durationInFrames: number }> = ({
  title,
  durationInFrames
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = frame / durationInFrames

  // Fade in and out animation
  const opacity = spring({
    frame: Math.min(frame, durationInFrames - 30),
    fps,
    config: { damping: 20 },
  })

  const scale = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0.8, 1, 1, 0.8],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  )

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: '"Noto Sans", sans-serif',
        }}
      >
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 700,
            margin: 0,
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
          }}
        >
          {title}
        </h1>
        <div
          style={{
            fontSize: '24px',
            opacity: 0.8,
            fontWeight: 300,
          }}
        >
          Powered by AI Caption Generation
        </div>
      </div>
    </AbsoluteFill>
  )
}

/**
 * Main CaptionedVideo Component
 */
const CaptionedVideo: React.FC<CaptionedVideoProps> = ({
  videoPath,
  captions,
  style,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames: propDuration
}) => {
  // Calculate video duration based on captions or prop
  const videoDuration = propDuration
    ? propDuration / fps
    : Math.max(...captions.map(c => c.endTime), 10)

  const durationInFrames = propDuration || Math.ceil(videoDuration * fps)

  // Sort captions by start time
  const sortedCaptions = [...captions].sort((a, b) => a.startTime - b.startTime)

  // Add intro screen (3 seconds)
  const introDuration = 3 * fps
  const mainContentDuration = durationInFrames
  const totalDuration = introDuration + mainContentDuration

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Intro Screen */}
      <Sequence from={0} durationInFrames={introDuration}>
        <LoadingScreen
          title={videoPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Video'}
          durationInFrames={introDuration}
        />
      </Sequence>

      {/* Main Content with Video and Captions */}
      <Sequence from={introDuration} durationInFrames={mainContentDuration}>
        <VideoBackground videoPath={videoPath} />

        <CaptionTrack
          captions={sortedCaptions}
          style={style}
          videoDuration={videoDuration}
        />
      </Sequence>

      {/* Outro Screen (optional) */}
      <Sequence from={totalDuration - 60} durationInFrames={60}>
        <AbsoluteFill
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '60px',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: '32px',
              fontWeight: 600,
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            Generated with AI Captions
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  )
}

/**
 * Remotion Composition Export
 */
export const CaptionedVideoComposition: React.FC<Partial<CaptionedVideoProps>> = (props) => {
  const mergedDefaultProps: CaptionedVideoProps = {
    videoPath: props.videoPath ?? DEFAULT_CAPTIONED_VIDEO_PROPS.videoPath,
    captions: props.captions ?? DEFAULT_CAPTIONED_VIDEO_PROPS.captions,
    style: props.style ?? DEFAULT_CAPTIONED_VIDEO_PROPS.style,
    width: props.width ?? DEFAULT_CAPTIONED_VIDEO_PROPS.width,
    height: props.height ?? DEFAULT_CAPTIONED_VIDEO_PROPS.height,
    fps: props.fps ?? DEFAULT_CAPTIONED_VIDEO_PROPS.fps,
    durationInFrames: props.durationInFrames ?? DEFAULT_CAPTIONED_VIDEO_PROPS.durationInFrames,
  }

  const compositionWidth = mergedDefaultProps.width ?? DEFAULT_CAPTIONED_VIDEO_PROPS.width!
  const compositionHeight = mergedDefaultProps.height ?? DEFAULT_CAPTIONED_VIDEO_PROPS.height!
  const compositionFps = mergedDefaultProps.fps ?? DEFAULT_CAPTIONED_VIDEO_PROPS.fps!
  const compositionDuration = mergedDefaultProps.durationInFrames ?? DEFAULT_CAPTIONED_VIDEO_PROPS.durationInFrames!

  return (
    <Composition<AnyZodObject, CaptionedVideoProps>
      id="CaptionedVideo"
      component={CaptionedVideo}
      defaultProps={mergedDefaultProps}
      width={compositionWidth}
      height={compositionHeight}
      fps={compositionFps}
      durationInFrames={compositionDuration}
    />
  )
}

/**
 * Utility function to create a captioned video composition
 */
export const createCaptionedVideo = (
  videoPath: string,
  captions: Caption[],
  style: 'default' | 'newsbar' | 'karaoke' = 'default',
  options: Partial<CaptionedVideoProps> = {}
) => {
  return (
    <CaptionedVideoComposition
      videoPath={videoPath}
      captions={captions}
      style={style}
      {...options}
    />
  )
}

export default CaptionedVideo