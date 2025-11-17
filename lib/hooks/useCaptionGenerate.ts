/**
 * Hook for caption generation using Whisper API with progress tracking
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { generateCaptions, saveCaptions } from '../api-client';
import type { Caption, CaptionGenerateOptions } from '../types/api';

export interface UseCaptionGenerateReturn {
  /**
   * Generate captions for the video
   */
  generateCaptions: (options?: CaptionGenerateOptions) => Promise<void>;

  /**
   * Whether caption generation is currently in progress
   */
  isLoading: boolean;

  /**
   * Whether generation is actively processing
   */
  isGenerating: boolean;

  /**
   * Generated captions (null if not generated yet)
   */
  captions: Caption[] | null;

  /**
   * Generation progress percentage (0-100)
   */
  progress: number;

  /**
   * Current error message if any
   */
  error: string | null;

  /**
   * Reset the hook state
   */
  reset: () => void;

  /**
   * Cancel generation (if supported)
   */
  cancelGeneration: () => void;
}

/**
 * Generation status for polling
 */
export type GenerationStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Progress callback type
 */
export type ProgressCallback = (
  progress: number,
  status: string,
  captionsProcessed?: number,
  totalCaptions?: number
) => void;

/**
 * Hook for caption generation with Whisper API integration and progress tracking
 *
 * @param videoId - ID of the video to generate captions for
 * @param autoSave - Whether to automatically save generated captions
 * @param pollingInterval - How often to poll for progress (ms)
 * @param onProgress - Callback for progress updates
 * @param onSuccess - Callback when generation completes successfully
 * @param onError - Callback when generation fails
 * @returns Caption generation state and functions
 */
export function useCaptionGenerate(
  videoId: string,
  autoSave: boolean = true,
  pollingInterval: number = 2000,
  onProgress?: ProgressCallback,
  onSuccess?: (captions: Caption[]) => void,
  onError?: (error: string) => void
): UseCaptionGenerateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');

  // Refs to avoid stale closures and manage cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef(autoSave);
  const pollingIntervalRefVal = useRef(pollingInterval);
  const onProgressRef = useRef(onProgress);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  useEffect(() => {
    pollingIntervalRefVal.current = pollingInterval;
  }, [pollingInterval]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

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
   * Simulate caption generation progress (replace with actual polling)
   */
  const simulateProgress = useCallback((onUpdate: ProgressCallback) => {
    let currentProgress = 0;
    const maxProgress = 100;
    const increment = 5; // Progress increment percentage

    const progressInterval = setInterval(() => {
      currentProgress = Math.min(currentProgress + increment, maxProgress);

      // Simulate different stages
      let status = 'Processing audio...';
      if (currentProgress > 25) status = 'Transcribing speech...';
      if (currentProgress > 50) status = 'Optimizing timing...';
      if (currentProgress > 75) status = 'Finalizing captions...';
      if (currentProgress >= maxProgress) status = 'Complete';

      onUpdate(currentProgress, status, Math.floor(currentProgress / 10), 10);

      if (currentProgress >= maxProgress) {
        clearInterval(progressInterval);
      }
    }, 500);

    return progressInterval;
  }, []);

  /**
   * Handle successful caption generation
   */
  const handleGenerationComplete = useCallback(async (generatedCaptions: Caption[]) => {
    setCaptions(generatedCaptions);
    setProgress(100);
    setIsGenerating(false);
    setGenerationStatus('completed');

    // Auto-save if enabled
    if (autoSaveRef.current) {
      try {
        await saveCaptions(videoId, generatedCaptions);
      } catch (saveError) {
        console.warn('Failed to auto-save captions:', saveError);
      }
    }

    onSuccessRef.current?.(generatedCaptions);
  }, [videoId]);

  /**
   * Handle generation error
   */
  const handleGenerationError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setProgress(0);
    setIsGenerating(false);
    setIsLoading(false);
    setGenerationStatus('failed');
    onErrorRef.current?.(errorMessage);
  }, []);

  /**
   * Start caption generation
   */
  const startGeneration = useCallback(async (options?: CaptionGenerateOptions) => {
    if (!videoId) return;

    // Reset state
    reset();
    setGenerationStatus('processing');
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Start progress simulation
      const progressInterval = simulateProgress((progressValue, status, processed, total) => {
        setProgress(progressValue);
        onProgressRef.current?.(progressValue, status, processed, total);
      });

      // Generate captions
      const response = await generateCaptions(videoId, options, {
        signal: abortControllerRef.current?.signal,
        timeout: 300000, // 5 minutes for caption generation
      });

      // Clear progress simulation
      clearInterval(progressInterval);

      if (response.success && response.data) {
        const generatedCaptions = response.data.captions || [];
        await handleGenerationComplete(generatedCaptions);
      } else {
        const errorMessage = response.error || 'Caption generation failed';
        handleGenerationError(errorMessage);
      }
    } catch (error) {
      // Don't show error if generation was cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        setGenerationStatus('cancelled');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      handleGenerationError(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [videoId, simulateProgress, handleGenerationComplete, handleGenerationError]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    cleanup();
    setIsLoading(false);
    setIsGenerating(false);
    setCaptions(null);
    setProgress(0);
    setError(null);
    setGenerationStatus('idle');
  }, [cleanup]);

  /**
   * Cancel ongoing generation
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsGenerating(false);
    setGenerationStatus('cancelled');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Cancel generation if component unmounts while generating
  useEffect(() => {
    return () => {
      if (isGenerating) {
        cancelGeneration();
      }
    };
  }, [isGenerating, cancelGeneration]);

  return {
    generateCaptions: startGeneration,
    isLoading,
    isGenerating,
    captions,
    progress,
    error,
    reset,
    cancelGeneration,
  };
}

export default useCaptionGenerate;