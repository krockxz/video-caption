/**
 * Hook for fetching and managing video list with pagination and caching
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getVideos } from '../api-client';
import type { VideoListItem, VideoFilters, PaginatedResponse } from '../types/api';

export interface UseVideoListReturn {
  /** List of videos */
  videos: VideoListItem[];

  /** Whether data is currently loading */
  isLoading: boolean;

  /** Current error message if any */
  error: string | null;

  /** Whether there are more videos to load */
  hasMore: boolean;

  /** Current pagination information */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;

  /** Current filters being applied */
  currentFilters: VideoFilters | null;

  /** Refresh the current page */
  refetch: () => Promise<void>;

  /** Load more videos (next page) */
  loadMore: () => Promise<void>;

  /** Apply new filters and reset pagination */
  applyFilters: (filters: VideoFilters) => Promise<void>;

  /** Reset all state and start fresh */
  reset: () => void;

  /** Clear all videos */
  clear: () => void;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  /** Cache TTL in milliseconds */
  ttl: number;
  /** Maximum number of cached pages */
  maxPages: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxPages: 10,
};

/**
 * Hook for fetching and managing video list with pagination, caching, and filtering
 *
 * @param limit - Number of videos per page
 * @param cacheConfig - Cache configuration
 * @param filters - Initial filters to apply
 * @returns Video list state and functions
 */
export function useVideoList(
  limit: number = 20,
  cacheConfig: CacheConfig = DEFAULT_CACHE_CONFIG,
  filters?: VideoFilters
): UseVideoListReturn {
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<VideoFilters | null>(filters || null);

  // Cache implementation
  const cache = useRef<Map<string, { data: VideoListItem[]; timestamp: number; pagination: any }>>(new Map());
  const cacheConfigRef = useRef(cacheConfig);

  // Update cache config ref
  useEffect(() => {
    cacheConfigRef.current = cacheConfig;
  }, [cacheConfig]);

  /**
   * Get cache key for given page and filters
   */
  const getCacheKey = useCallback((page: number, filters: VideoFilters | null): string => {
    const filterStr = filters ? JSON.stringify(filters) : 'none';
    return `videos_page_${page}_${filterStr}`;
  }, []);

  /**
   * Get cached data if valid
   */
  const getCachedData = useCallback((page: number, filters: VideoFilters | null) => {
    const key = getCacheKey(page, filters);
    const cached = cache.current.get(key);
    const config = cacheConfigRef.current;

    if (cached && Date.now() - cached.timestamp < config.ttl) {
      return cached;
    }

    return null;
  }, [getCacheKey]);

  /**
   * Store data in cache
   */
  const setCachedData = useCallback((
    page: number,
    filters: VideoFilters | null,
    data: VideoListItem[],
    pagination: any
  ) => {
    const key = getCacheKey(page, filters);
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      pagination,
    });

    // Limit cache size
    if (cache.current.size > cacheConfigRef.current.maxPages) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
  }, [getCacheKey]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  /**
   * Fetch videos for a specific page
   */
  const fetchVideos = useCallback(async (
    page: number,
    filters: VideoFilters | null,
    append: boolean = false
  ) => {
    // Check cache first
    const cachedData = getCachedData(page, filters);
    if (cachedData) {
      setVideos(prev => append ? [...prev, ...cachedData.data] : cachedData.data);
      setPagination(cachedData.pagination);
      setHasMore(cachedData.pagination.hasMore);
      setCurrentPage(page);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getVideos(page, limit, filters);

      if (response.success && response.data) {
        const { items, pagination: pageData } = response.data;

        // Update state
        setVideos(prev => append ? [...prev, ...items] : items);
        setPagination(pageData);
        setHasMore(pageData.hasMore);
        setCurrentPage(page);

        // Cache the results
        setCachedData(page, filters, items, pageData);
      } else {
        const errorMessage = response.error || 'Failed to fetch videos';
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit, getCachedData, setCachedData]);

  /**
   * Refresh the current page
   */
  const refetch = useCallback(async () => {
    await fetchVideos(currentPage, currentFilters, false);
  }, [fetchVideos, currentPage, currentFilters]);

  /**
   * Load more videos (next page)
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const nextPage = currentPage + 1;
    await fetchVideos(nextPage, currentFilters, true);
  }, [fetchVideos, currentPage, currentFilters, hasMore, isLoading]);

  /**
   * Apply new filters and reset pagination
   */
  const applyFilters = useCallback(async (newFilters: VideoFilters) => {
    setCurrentFilters(newFilters);
    setCurrentPage(1);
    setVideos([]);
    clearCache();
    await fetchVideos(1, newFilters, false);
  }, [fetchVideos, clearCache]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setVideos([]);
    setIsLoading(false);
    setError(null);
    setHasMore(true);
    setCurrentPage(1);
    setPagination(null);
    setCurrentFilters(null);
    clearCache();
  }, [clearCache]);

  /**
   * Clear videos but keep filters and pagination state
   */
  const clear = useCallback(() => {
    setVideos([]);
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchVideos(1, currentFilters, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  return {
    videos,
    isLoading,
    error,
    hasMore,
    pagination,
    currentFilters,
    refetch,
    loadMore,
    applyFilters,
    reset,
    clear,
  };
}

export default useVideoList;