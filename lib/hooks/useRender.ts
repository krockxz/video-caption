/**
 * Hook for video rendering with Remotion integration and progress tracking
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { requestRender, getRenderStatus } from '../api-client';
import type { Render, RenderOptions } from '../types/api';

export interface UseRenderReturn {
  /**
   * Start rendering the video
   */
  startRender: (options?: RenderOptions) => Promise<void>;

  /**
   * Current render job ID (null if not started)
   */
  renderId: string | null;

  /**
   * Current render status
   */
  status: 'idle' | 'pending' | 'rendering' | 'completed' | 'failed' | 'cancelled';

  /**
   * Render progress percentage (0-100)
   */
  progress: number;

  /**
   * Current error message if any
   */
  error: string | null;

  /**
   * Estimated time remaining in seconds
   */
  estimatedTimeRemaining?: number;

  /**
   * Current processing stage
   */
  currentStage?: string;

  /**
   * Output path when rendering completes
   */
  outputPath?: string;

  /**
   * Public URL for downloading the rendered video
   */
  publicUrl?: string;

  /**
   * Reset the hook state
   */
  reset: () => void;

  /**
   * Cancel rendering (if supported)
   */
  cancelRender: () => void;

  /**
   * Check render status manually
   */
  checkStatus: () => Promise<void>;

  /**
   * Whether rendering is currently in progress
   */
  isLoading: boolean;
}

/**
 * Render status for polling
 */
export type RenderStatusType = 'idle' | 'pending' | 'rendering' | 'completed' | 'failed' | 'cancelled';

/**
 * Progress callback type
 */
type ProgressCallback = (
  progress: number,
  status: string,
  estimatedTimeRemaining?: number,
  currentStage?: string
) => void;

/**
 * Hook for video rendering with Remotion integration and progress tracking
 *
 * @param videoId - ID of the video to render
 * @param captionStyle - Caption style to use for rendering
 * @param pollingInterval - How often to poll for progress (ms)
 * @param autoStopPolling - Whether to automatically stop polling on completion
 * @param onProgress - Callback for progress updates
 * @param onComplete - Callback when rendering completes successfully
 * @param onError - Callback when rendering fails
 * @returns Render state and functions
 */
export function useRender(
  videoId: string,
  captionStyle: string = 'default',
  pollingInterval: number = 2000,
  autoStopPolling: boolean = true,
  onProgress?: ProgressCallback,
  onComplete?: (render: Render) => void,
  onError?: (error: string) => void
): UseRenderReturn {
  const [renderId, setRenderId] = useState<string | null>(null);
  const [status, setStatus] = useState<RenderStatusType>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>();
  const [currentStage, setCurrentStage] = useState<string | undefined>();
  const [outputPath, setOutputPath] = useState<string | undefined>();
  const [publicUrl, setPublicUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Refs to avoid stale closures and manage cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const captionStyleRef = useRef(captionStyle);
  const pollingIntervalRefVal = useRef(pollingInterval);
  const autoStopPollingRef = useRef(autoStopPolling);
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    captionStyleRef.current = captionStyle;
  }, [captionStyle]);

  useEffect(() => {
    pollingIntervalRefVal.current = pollingInterval;
  }, [pollingInterval]);

  useEffect(() => {
    autoStopPollingRef.current = autoStopPolling;
  }, [autoStopPolling]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);


  /**
   * Handle render completion
   */
  const handleRenderComplete = useCallback((render: Render) => {
    setStatus('completed');
    setProgress(100);
    setOutputPath(render.outputPath);
    setPublicUrl(render.publicUrl);
    setError(null);
    setEstimatedTimeRemaining(0);
    setCurrentStage('Render completed');

    // Auto-stop polling if enabled
    if (autoStopPollingRef.current) {
      cleanup();
    }

    onCompleteRef.current?.(render);
  }, [cleanup]);

  /**
   * Handle render error
   */
  const handleRenderError = useCallback((errorMessage: string) => {
    setStatus('failed');
    setError(errorMessage);
    setEstimatedTimeRemaining(0);
    setCurrentStage('Render failed');

    // Auto-stop polling if enabled
    if (autoStopPollingRef.current) {
      cleanup();
    }

    onErrorRef.current?.(errorMessage);
  }, [cleanup]);

  /**
   * Poll render status
   */
  const pollRenderStatus = useCallback(async () => {
    if (!renderId || !videoId) return;

    try {
      const response = await getRenderStatus(videoId, renderId);

      if (response.success && response.data) {
        const render = response.data;

        setProgress(render.progress || 0);
        setEstimatedTimeRemaining(render.estimatedTimeRemaining);
        setCurrentStage(render.currentStage);

        // Check if status changed
        switch (render.status) {
          case 'completed':
            handleRenderComplete(render);
            break;
          case 'failed':
            handleRenderError(render.error || 'Render failed');
            break;
          default:
            setStatus(render.status as RenderStatusType);
            break;
        }

        // Call progress callback
        onProgressRef.current?.(
          render.progress || 0,
          render.currentStage || 'Processing',
          render.estimatedTimeRemaining,
          render.currentStage
        );
      }
    } catch (error) {
      console.warn('Failed to poll render status:', error);
    }
  }, [renderId, videoId, handleRenderComplete, handleRenderError]);

  /**
   * Start polling for render status
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = setInterval(() => {
      pollRenderStatus();
    }, pollingIntervalRefVal.current);
  }, [pollRenderStatus, pollingIntervalRefVal]);

  /**
   * Check render status manually
   */
  const checkStatus = useCallback(async () => {
    await pollRenderStatus();
  }, [pollRenderStatus]);

  /**
   * Start rendering
   */
  const startRender = useCallback(async (options?: RenderOptions) => {
    if (!videoId) return;

    // Reset state
    reset();
    setStatus('pending');
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);

      // Request render
      const response = await requestRender(videoId, captionStyleRef.current, options, {
        signal: abortControllerRef.current?.signal,
        timeout: 600000, // 10 minutes for rendering
      });

      if (response.success && response.data) {
        setRenderId(response.data.renderId);
        setStatus('rendering');
        // Start polling immediately for real-time updates
        startPolling();
      } else {
        const errorMessage = response.error || 'Failed to start render';
        handleRenderError(errorMessage);
      }
    } catch (error) {
      // Don't show error if render was cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        setStatus('cancelled');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      handleRenderError(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [videoId, handleRenderError, startPolling]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    cleanup();
    setRenderId(null);
    setStatus('idle');
    setProgress(0);
    setError(null);
    setEstimatedTimeRemaining(undefined);
    setCurrentStage(undefined);
    setOutputPath(undefined);
    setPublicUrl(undefined);
  }, [cleanup]);

  /**
   * Cancel ongoing render
   */
  const cancelRender = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setStatus('cancelled');
    setEstimatedTimeRemaining(0);
    setCurrentStage('Render cancelled');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Auto-start polling if we have a renderId and status is rendering
  useEffect(() => {
    if (renderId && status === 'rendering') {
      startPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [renderId, status, startPolling]);

  return {
    startRender,
    renderId,
    status,
    progress,
    error,
    estimatedTimeRemaining,
    currentStage,
    outputPath,
    publicUrl,
    reset,
    cancelRender,
    checkStatus,
    isLoading,
  };
}

export default useRender;