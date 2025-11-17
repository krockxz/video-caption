/**
 * Remotion Module Index
 *
 * Exports all Remotion components, compositions, and configurations
 * for easy importing and usage.
 */

export { CaptionedVideoComposition, createCaptionedVideo } from './compositions/CaptionedVideo'
export {
  CaptionOverlay,
  DefaultStyle,
  NewsbarStyle,
  KaraokeStyle,
} from './components/CaptionOverlay'
export type { CaptionOverlayProps } from './components/CaptionOverlay'

export type { CaptionedVideoProps, Caption } from './compositions/CaptionedVideo'

export { PRESETS, FONT_CONFIG, CAPTION_COLORS } from './remotion.config'

// Note: Import Remotion utilities directly from 'remotion' package
// to avoid circular dependencies