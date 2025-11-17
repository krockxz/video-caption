/**
 * Custom React hooks for the Video Captioning Platform
 */

// Export all hooks
export { default as useVideoUpload } from './useVideoUpload';
export type { UseVideoUploadReturn } from './useVideoUpload';

export { default as useVideoList } from './useVideoList';
export type { UseVideoListReturn } from './useVideoList';

export { default as useVideoDetails } from './useVideoDetails';
export type { UseVideoDetailsReturn } from './useVideoDetails';

export { default as useCaptionGenerate } from './useCaptionGenerate';
export type { UseCaptionGenerateReturn } from './useCaptionGenerate';

export { default as useRender } from './useRender';
export type { UseRenderReturn } from './useRender';

export { default as useDeleteVideo, useBatchDeleteVideo } from './useDeleteVideo';
export type { UseDeleteVideoReturn } from './useDeleteVideo';

// Re-export hook types for convenience
export type { FileValidationOptions } from './useVideoUpload';
export type { GenerationStatus, ProgressCallback } from './useCaptionGenerate';
export type { RenderStatusType } from './useRender';