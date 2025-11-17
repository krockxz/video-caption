'use client';

import { useMemo, useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import type { Caption } from '@/lib/types/api';

export interface RemotionPlayerPreviewProps {
  videoPath: string;
  captions: Caption[];
  style: 'default' | 'newsbar' | 'karaoke';
  width?: number;
  height?: number;
  fps?: number;
  className?: string;
}

const normalizeVideoPath = (path: string): string => {
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
};

const LoadingState = ({ className }: { className: string }) => (
  <div className={`flex items-center justify-center bg-slate-900 rounded-lg ${className}`} style={{ aspectRatio: '16/9' }}>
    <div className="text-center space-y-3">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
      <p className="text-white text-sm">Loading preview...</p>
    </div>
  </div>
);

const ErrorState = ({ error, className }: { error: string; className: string }) => (
  <div className={`flex items-center justify-center bg-slate-900 rounded-lg ${className}`} style={{ aspectRatio: '16/9' }}>
    <div className="text-center space-y-3 p-4">
      <p className="text-red-400 text-sm">Preview unavailable</p>
      <p className="text-gray-400 text-xs">{error}</p>
    </div>
  </div>
);

export function RemotionPlayerPreview({
  videoPath,
  captions,
  style,
  width = 1920,
  height = 1080,
  fps = 30,
  className = ''
}: RemotionPlayerPreviewProps) {
  const [bundleUrl, setBundleUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const durationInFrames = useMemo(() => {
    if (captions.length === 0) return 30 * fps;
    return Math.ceil(Math.max(...captions.map(c => c.endTime)) * fps);
  }, [captions, fps]);

  const inputProps = useMemo(() => ({
    videoPath: normalizeVideoPath(videoPath),
    captions: captions.map(caption => ({
      id: caption.id,
      videoId: caption.videoId,
      text: caption.text,
      startTime: caption.startTime,
      endTime: caption.endTime,
      language: caption.language || 'en',
      style: caption.style || style
    })),
    style,
    width,
    height,
    fps,
    durationInFrames
  }), [videoPath, captions, style, width, height, fps, durationInFrames]);

  useEffect(() => {
    let cancelled = false;

    const loadBundle = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/remotion-bundle');
        if (!response.ok) throw new Error(`Failed to load bundle: ${response.statusText}`);

        const data = await response.json();
        if (cancelled) return;

        if (data.bundleUrl) {
          setBundleUrl(data.bundleUrl);
        } else {
          throw new Error('No bundle URL received');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadBundle();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <LoadingState className={className} />;
  if (error || !bundleUrl) return <ErrorState error={error || 'Bundle not loaded'} className={className} />;

  return (
    <div className={`bg-slate-900 rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
      <Player
        compositionId="CaptionedVideo"
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        fps={fps}
        style={{ width: '100%', height: '100%' }}
        controls
        loop
        clickToPlay
        showVolumeControls
        showPlaybackRateControl
        // @ts-ignore - Remotion Player types may not include serveUrl in all versions
        serveUrl={bundleUrl}
      />
    </div>
  );
}

