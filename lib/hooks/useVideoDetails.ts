/**
 * Hook for fetching single video details with captions and renders
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getVideoDetails, getCaptions } from '../api-client';
import type { Video, Caption } from '../types/api';

export interface UseVideoDetailsReturn {
  /** Video details */
  video: Video | null;

  /** Video captions */
  captions: Caption[];

  /** Whether data is currently loading */
  isLoading: boolean;

  /** Current error message if any */
  error: string | null;

  /** Refresh video details */
  refetch: () => Promise<void>;

  /** Refresh captions only */
  refetchCaptions: () => Promise<void>;

  /** Poll for status changes (auto-stops when completed/failed) */
  startStatusPolling: (intervalMs?: number) => void;

  /** Stop status polling */
  stopStatusPolling: () => void;

  /** Check if video is processing */
  isProcessing: boolean;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  /** Cache TTL in milliseconds */
  ttl: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 2 * 60 * 1000, // 2 minutes
};

/**
 * Hook for fetching and managing single video details with automatic status polling
 *
 * @param videoId - ID of the video to fetch
 * @param cacheConfig - Cache configuration
 * @param pollingEnabled - Whether to enable automatic status polling
 * @param onStatusChange - Callback when video status changes
 * @returns Video details state and functions
 */
export function useVideoDetails(
  videoId: string,
  cacheConfig: CacheConfig = DEFAULT_CACHE_CONFIG,
  pollingEnabled: boolean = true,
  onStatusChange?: (video: Video) => void
): UseVideoDetailsReturn {
  const [video, setVideo] = useState<Video | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to avoid stale closures and manage cleanup
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const cacheConfigRef = useRef(cacheConfig);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);

  // Update refs when props change
  useEffect(() => {
    cacheConfigRef.current = cacheConfig;
  }, [cacheConfig]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

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
   * Get cached data if valid
   */
  const getCachedData = useCallback((key: string) => {
    const cached = cacheRef.current.get(key);
    const config = cacheConfigRef.current;

    if (cached && Date.now() - cached.timestamp < config.ttl) {
      return cached.data;
    }

    return null;
  }, []);

  /**
   * Set cached data
   */
  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  // Create a ref to hold the latest fetchVideoDetails function to avoid circular dependencies
  const fetchVideoDetailsRef = useRef<typeof fetchVideoDetails>();

  /**
   * Start automatic status polling
   */
  const startStatusPolling = useCallback((intervalMs: number = 5000) => {
    // Clear any existing polling
    stopStatusPolling();

    pollingIntervalRef.current = setInterval(() => {
      if (videoId && fetchVideoDetailsRef.current) {
        fetchVideoDetailsRef.current();
      }
    }, intervalMs);
  }, [videoId]);

  /**
   * Stop automatic status polling
   */
  const stopStatusPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Fetch video details
   */
  const fetchVideoDetails = useCallback(async () => {
    if (!videoId) return;

    // Check cache first
    const cacheKey = `video_${videoId}`;
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
      setVideo(cachedData.video);
      setCaptions(cachedData.captions);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Fetch video details
      const videoResponse = await getVideoDetails(videoId, {
        signal: abortControllerRef.current?.signal,
      });

      if (videoResponse.success && videoResponse.data) {
        const videoData = videoResponse.data;
        setVideo(videoData);

        // Fetch captions if they exist
        let captionsData: Caption[] = [];
        if (videoData.captions && videoData.captions.length > 0) {
          captionsData = videoData.captions;
        } else {
          // Fetch captions separately if not included in video data
          try {
            const captionsResponse = await getCaptions(videoId, {
              signal: abortControllerRef.current?.signal,
            });

            if (captionsResponse.success && captionsResponse.data) {
              captionsData = captionsResponse.data.captions;
            }
          } catch (captionsError) {
            console.warn('Failed to fetch captions:', captionsError);
          }
        }

        setCaptions(captionsData);

        // Cache the results
        setCachedData(cacheKey, {
          video: videoData,
          captions: captionsData,
        });

        // Check for status change
        const currentStatus = videoData.status;
        if (lastStatusRef.current !== null && lastStatusRef.current !== currentStatus) {
          onStatusChangeRef.current?.(videoData);
        }
        lastStatusRef.current = currentStatus;

        // Auto-start or stop polling based on status
        if (pollingEnabled && ['uploading', 'processing', 'captioning'].includes(currentStatus)) {
          startStatusPolling();
        } else {
          stopStatusPolling();
        }
      } else {
        const errorMessage = videoResponse.error || 'Failed to fetch video details';
        setError(errorMessage);
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [videoId, pollingEnabled, getCachedData, setCachedData, startStatusPolling, stopStatusPolling]);

  // Update the ref with the latest fetchVideoDetails function
  useEffect(() => {
    fetchVideoDetailsRef.current = fetchVideoDetails;
  }, [fetchVideoDetails]);

  /**
   * Fetch captions only
   */
  const fetchCaptions = useCallback(async () => {
    if (!videoId) return;

    try {
      const response = await getCaptions(videoId);

      if (response.success && response.data) {
        setCaptions(response.data.captions);
      }
    } catch (error) {
      console.warn('Failed to fetch captions:', error);
    }
  }, [videoId]);

  /**
   * Manual refresh
   */
  const refetch = useCallback(async () => {
    // Clear cache for this video
    const cacheKey = `video_${videoId}`;
    cacheRef.current.delete(cacheKey);

    await fetchVideoDetails();
  }, [fetchVideoDetails, videoId]);

  /**
   * Manual captions refresh
   */
  const refetchCaptions = useCallback(async () => {
    await fetchCaptions();
  }, [fetchCaptions]);

  /**
   * Check if video is currently processing
   */
  const isProcessing = video ? ['uploading', 'processing', 'captioning'].includes(video.status) : false;

  // Initial load
  useEffect(() => {
    if (videoId) {
      fetchVideoDetails();
    }
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Clear cache when videoId changes
  useEffect(() => {
    if (videoId) {
      cacheRef.current.clear();
    }
  }, [videoId]);

  return {
    video,
    captions,
    isLoading,
    error,
    refetch,
    refetchCaptions,
    startStatusPolling,
    stopStatusPolling,
    isProcessing,
  };
}

export default useVideoDetails;