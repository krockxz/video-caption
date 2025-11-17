/**
 * Remotion Root Entry Point
 * Registers all available compositions for the Remotion application
 */

import React from 'react'
import { registerRoot } from 'remotion'
import { CaptionedVideoComposition } from './compositions/CaptionedVideo'
import { CaptionStyleDemoComposition } from './compositions/CaptionStyleDemo'

const RemotionRoot: React.FC = () => (
  <>
    <CaptionedVideoComposition />
    <CaptionStyleDemoComposition />
  </>
)

registerRoot(RemotionRoot)