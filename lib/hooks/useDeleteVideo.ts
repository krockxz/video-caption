/**
 * Hook for deleting videos with confirmation and cleanup
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { deleteVideo } from '../api-client';
import type { Video } from '../types/api';

export interface UseDeleteVideoReturn {
  /**
   * Delete a video
   */
  deleteVideo: () => Promise<void>;

  /**
   * Whether deletion is currently in progress
   */
  isLoading: boolean;

  /**
   * Whether video has been successfully deleted
   */
  isDeleted: boolean;

  /**
   * Current error message if any
   */
  error: string | null;

  /**
   * Reset the hook state
   */
  reset: () => void;

  /**
   * Show confirmation dialog before deletion
   */
  confirmDelete: () => boolean;
}

/**
 * Hook for deleting videos with confirmation dialog, loading states, and cleanup
 *
 * @param videoId - ID of the video to delete
 * @param videoTitle - Title of the video (for confirmation dialog)
 * @param requireConfirmation - Whether to show confirmation dialog
 * @param onSuccess - Callback when deletion completes successfully
 * @param onError - Callback when deletion fails
 * @param confirmationMessage - Custom confirmation message
 * @returns Delete state and functions
 */
export function useDeleteVideo(
  videoId: string,
  videoTitle: string = 'this video',
  requireConfirmation: boolean = true,
  onSuccess?: (deletedData: any) => void,
  onError?: (error: string) => void,
  confirmationMessage?: string
): UseDeleteVideoReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to avoid stale closures
  const abortControllerRef = useRef<AbortController | null>(null);
  const videoTitleRef = useRef(videoTitle);
  const requireConfirmationRef = useRef(requireConfirmation);
  const confirmationMessageRef = useRef(confirmationMessage);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    videoTitleRef.current = videoTitle;
  }, [videoTitle]);

  useEffect(() => {
    requireConfirmationRef.current = requireConfirmation;
  }, [requireConfirmation]);

  useEffect(() => {
    confirmationMessageRef.current = confirmationMessage;
  }, [confirmationMessage]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Show confirmation dialog
   */
  const confirmDelete = useCallback((): boolean => {
    if (!requireConfirmationRef.current) {
      return true;
    }

    const message = confirmationMessageRef.current ||
      `Are you sure you want to delete "${videoTitleRef.current}"? This action cannot be undone and will permanently remove the video file, all captions, and rendered videos.`;

    return window.confirm(message);
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsLoading(false);
    setIsDeleted(false);
    setError(null);
  }, []);

  /**
   * Delete the video
   */
  const deleteVideoHandler = useCallback(async () => {
    if (!videoId) return;

    // Show confirmation dialog if required
    if (!confirmDelete()) {
      return;
    }

    // Reset state
    reset();
    setIsLoading(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await deleteVideo(videoId, {
        signal: abortControllerRef.current?.signal,
        timeout: 30000, // 30 seconds for deletion
      });

      if (response.success && response.data) {
        setIsDeleted(true);
        setError(null);

        // Call success callback
        onSuccessRef.current?.(response.data);

        // Auto-reset after a short delay
        setTimeout(() => {
          reset();
        }, 2000);
      } else {
        const errorMessage = response.error || 'Failed to delete video';
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
      }
    } catch (error) {
      // Don't show error if deletion was cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [videoId, confirmDelete, reset, onSuccessRef, onErrorRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    deleteVideo: deleteVideoHandler,
    isLoading,
    isDeleted,
    error,
    reset,
    confirmDelete,
  };
}

/**
 * Hook for batch video deletion
 *
 * @param videoIds - Array of video IDs to delete
 * @param onProgress - Callback for progress updates
 * @param onComplete - Callback when all deletions complete
 * @param onError - Callback for errors
 * @returns Batch deletion state and functions
 */
export function useBatchDeleteVideo(
  videoIds: string[],
  onProgress?: (completed: number, total: number, failed: string[]) => void,
  onComplete?: (results: { successful: string[]; failed: string[]; total: number }) => void,
  onError?: (error: string, videoId?: string) => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    successful: string[];
    failed: string[];
    total: number;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const onErrorRefCallback = useRef<(error: string, videoId?: string) => void>();

  // Update ref when prop changes
  useEffect(() => {
    onErrorRefCallback.current = onError || (() => {});
  }, [onError]);

  /**
   * Delete multiple videos
   */
  const deleteMultipleVideos = useCallback(async () => {
    if (videoIds.length === 0) return;

    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to delete ${videoIds.length} video(s)? This action cannot be undone and will permanently remove all associated files, captions, and rendered videos.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Reset state
    setIsLoading(true);
    setError(null);
    setResults(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const successful: string[] = [];
    const failed: string[] = [];

    try {
      for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i];

        try {
          const response = await deleteVideo(videoId, {
            signal: abortControllerRef.current?.signal,
            timeout: 30000,
          });

          if (response.success) {
            successful.push(videoId);
          } else {
            failed.push(videoId);
            const errorMessage = response.error || 'Failed to delete video';
            onErrorRefCallback.current?.(errorMessage, videoId);
          }
        } catch (error) {
          failed.push(videoId);
          const errorMessage = error instanceof Error ? error.message : 'Network error';
          onErrorRefCallback.current?.(errorMessage, videoId);
        }

        // Update progress
        onProgress?.(successful.length + failed.length, videoIds.length, failed);

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
      }

      const finalResults = {
        successful,
        failed,
        total: videoIds.length,
      };

      setResults(finalResults);
      onComplete?.(finalResults);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Batch deletion failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [videoIds, onProgress, onComplete, onError]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsLoading(false);
    setError(null);
    setResults(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    deleteMultipleVideos,
    isLoading,
    error,
    results,
    reset,
  };
}

export default useDeleteVideo;