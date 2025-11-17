/**
 * Hook for handling video uploads with progress tracking and error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { uploadVideo } from '../api-client';
import type { UploadResponse, ApiResponse } from '../types/api';

export interface UseVideoUploadReturn {
  /**
   * Upload a video file
   */
  uploadVideo: (file: File, title?: string) => Promise<void>;

  /**
   * Whether an upload is currently in progress
   */
  isLoading: boolean;

  /**
   * Upload progress percentage (0-100)
   */
  progress: number;

  /**
   * Current error message if any
   */
  error: string | null;

  /**
   * ID of the uploaded video if successful
   */
  videoId: string | null;

  /**
   * Reset the hook state
   */
  reset: () => void;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  /** Allowed file types */
  allowedTypes?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
}

const DEFAULT_VALIDATION: FileValidationOptions = {
  allowedTypes: ['video/mp4'],
  maxSize: 500 * 1024 * 1024, // 500MB
};

/**
 * Hook for handling video uploads with validation and progress tracking
 *
 * @param validationOptions - File validation options
 * @param onSuccess - Callback when upload succeeds
 * @param onError - Callback when upload fails
 * @param onProgress - Callback for progress updates
 * @returns Upload state and functions
 */
export function useVideoUpload(
  validationOptions?: FileValidationOptions,
  onSuccess?: (videoId: string, response: UploadResponse) => void,
  onError?: (error: string) => void,
  onProgress?: (progress: number) => void
): UseVideoUploadReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Use refs to avoid stale closures
  const abortControllerRef = useRef<AbortController | null>(null);
  const validationOptionsRef = useRef(validationOptions);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  // Update refs when props change
  useEffect(() => {
    validationOptionsRef.current = validationOptions;
  }, [validationOptions]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): string | null => {
    const options = validationOptionsRef.current || DEFAULT_VALIDATION;

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return `Invalid file type: ${file.type}. Only ${options.allowedTypes.join(', ')} are allowed.`;
    }

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB).`;
    }

    return null;
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsLoading(false);
    setProgress(0);
    setError(null);
    setVideoId(null);
  }, []);

  /**
   * Upload a video file
   */
  const uploadVideoFile = useCallback(async (file: File, title?: string) => {
    // Reset previous state
    reset();

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onErrorRef.current?.(validationError);
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      // Handle progress updates
      const handleProgress = (progressValue: number) => {
        setProgress(progressValue);
        onProgressRef.current?.(progressValue);
      };

      // Upload file
      const response: ApiResponse<UploadResponse> = await uploadVideo(
        file,
        title,
        handleProgress,
        {
          signal: abortControllerRef.current?.signal,
          timeout: 60000, // 60 seconds for large uploads
        }
      );

      if (response.success && response.data) {
        setVideoId(response.data.videoId);
        setProgress(100);
        onSuccessRef.current?.(response.data.videoId, response.data);
      } else {
        const errorMessage = response.error || 'Upload failed';
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
      }
    } catch (error) {
      // Don't show error if upload was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [validateFile, reset]);

  return {
    uploadVideo: uploadVideoFile,
    isLoading,
    progress,
    error,
    videoId,
    reset,
  };
}

export default useVideoUpload;