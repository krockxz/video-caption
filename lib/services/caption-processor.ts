/**
 * Caption Processor Service
 *
 * Handles caption processing, formatting, and validation for video transcripts.
 * Supports Hinglish/mixed language content with proper UTF-8 encoding.
 */

export interface CaptionSegment {
  startTime: number
  endTime: number
  text: string
}

export interface ProcessedCaption extends CaptionSegment {
  language: 'en-US' | 'hi-IN' | 'mixed'
  wordCount: number
  confidence?: number
}

export interface CaptionProcessingOptions {
  maxWordsPerLine?: number
  maxLineDuration?: number
  minLineDuration?: number
  splitLongSegments?: boolean
  preserveTimestamps?: boolean
}

export interface ExportFormat {
  srt: string
  vtt: string
  json: CaptionSegment[]
}

/**
 * CaptionProcessor class for handling caption processing operations
 */
export class CaptionProcessor {
  private static readonly DEFAULT_OPTIONS: Required<CaptionProcessingOptions> = {
    maxWordsPerLine: 10,
    maxLineDuration: 7.0, // seconds
    minLineDuration: 1.5, // seconds
    splitLongSegments: true,
    preserveTimestamps: true
  }

  private static readonly HINDI_REGEX = /[\u0900-\u097F]/
  private static readonly ENGLISH_WORDS_REGEX = /\b[a-zA-Z]+\b/g
  private static readonly SENTENCE_BOUNDARY_REGEX = /[.!?।]+/
  private static readonly WORD_BOUNDARY_REGEX = /\s+/

  /**
   * Process raw captions from Whisper API response
   */
  static processRawCaptions(
    rawSegments: any[],
    options: CaptionProcessingOptions = {}
  ): ProcessedCaption[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const processedCaptions: ProcessedCaption[] = []

    for (const segment of rawSegments) {
      if (!segment.text || segment.text.trim().length === 0) {
        continue
      }

      const cleanedText = this.cleanCaptionText(segment.text)
      if (!cleanedText) {
        continue
      }

      const baseCaption: ProcessedCaption = {
        startTime: Math.round(segment.start * 100) / 100,
        endTime: Math.round(segment.end * 100) / 100,
        text: cleanedText,
        language: this.detectLanguage(cleanedText),
        wordCount: this.countWords(cleanedText),
        confidence: segment.confidence
      }

      // Split long segments if needed
      if (opts.splitLongSegments && this.shouldSplitSegment(baseCaption, opts)) {
        const splitCaptions = this.splitCaption(baseCaption, opts)
        processedCaptions.push(...splitCaptions)
      } else {
        // Adjust timing if needed
        const adjustedCaption = this.adjustCaptionTiming(baseCaption, opts)
        processedCaptions.push(adjustedCaption)
      }
    }

    return this.validateAndSortCaptions(processedCaptions)
  }

  /**
   * Clean and normalize caption text
   */
  static cleanCaptionText(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    return text
      .trim()
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR/transcription errors
      .replace(/\b([A-Z])\./g, '$1') // Remove periods from single letters
      .replace(/\s+/g, ' ')
      // Remove repeated punctuation
      .replace(/([.!?])\1+/g, '$1')
      // Ensure proper spacing around punctuation
      .replace(/\s*([,.!?।])\s*/g, '$1 ')
      .trim()
  }

  /**
   * Detect language of caption text
   */
  static detectLanguage(text: string): 'en-US' | 'hi-IN' | 'mixed' {
    const hasHindi = this.HINDI_REGEX.test(text)
    const englishWords = text.match(this.ENGLISH_WORDS_REGEX) || []
    const hasEnglish = englishWords.length > 0

    if (hasHindi && hasEnglish) {
      return 'mixed'
    } else if (hasHindi) {
      return 'hi-IN'
    } else {
      return 'en-US'
    }
  }

  /**
   * Count words in text (supports both English and Hindi)
   */
  static countWords(text: string): number {
    if (!text) return 0

    // For mixed languages, count both English words and Hindi characters
    const englishWords = text.match(this.ENGLISH_WORDS_REGEX) || []
    const hindiText = text.replace(/[a-zA-Z\s]/g, '')

    // Approximate Hindi words by counting character sequences
    const hindiWords = hindiText.length > 0 ? Math.ceil(hindiText.length / 6) : 0

    return englishWords.length + hindiWords
  }

  /**
   * Check if a caption segment should be split
   */
  static shouldSplitSegment(
    caption: ProcessedCaption,
    options: Required<CaptionProcessingOptions>
  ): boolean {
    const duration = caption.endTime - caption.startTime

    return (
      caption.wordCount > options.maxWordsPerLine ||
      duration > options.maxLineDuration
    )
  }

  /**
   * Split a long caption into smaller chunks
   */
  static splitCaption(
    caption: ProcessedCaption,
    options: Required<CaptionProcessingOptions>
  ): ProcessedCaption[] {
    const words = caption.text.split(this.WORD_BOUNDARY_REGEX)
    const duration = caption.endTime - caption.startTime
    const avgWordDuration = duration / words.length

    const chunks: ProcessedCaption[] = []
    let currentChunk: string[] = []
    let currentWordCount = 0
    let chunkStartTime = caption.startTime

    for (const word of words) {
      const wordTrimmed = word.trim()
      if (!wordTrimmed) continue

      if (currentWordCount >= options.maxWordsPerLine) {
        // Create caption chunk
        const chunkText = currentChunk.join(' ')
        const chunkDuration = currentWordCount * avgWordDuration

        chunks.push({
          startTime: chunkStartTime,
          endTime: Math.round((chunkStartTime + chunkDuration) * 100) / 100,
          text: chunkText,
          language: caption.language,
          wordCount: currentWordCount,
          confidence: caption.confidence
        })

        // Reset for next chunk
        currentChunk = [wordTrimmed]
        currentWordCount = 1
        chunkStartTime = chunks[chunks.length - 1].endTime
      } else {
        currentChunk.push(wordTrimmed)
        currentWordCount++
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ')
      const chunkDuration = currentWordCount * avgWordDuration

      chunks.push({
        startTime: chunkStartTime,
        endTime: caption.endTime,
        text: chunkText,
        language: caption.language,
        wordCount: currentWordCount,
        confidence: caption.confidence
      })
    }

    return chunks
  }

  /**
   * Adjust caption timing to meet duration constraints
   */
  static adjustCaptionTiming(
    caption: ProcessedCaption,
    options: Required<CaptionProcessingOptions>
  ): ProcessedCaption {
    const duration = caption.endTime - caption.startTime

    // Ensure minimum duration
    if (duration < options.minLineDuration) {
      const extension = (options.minLineDuration - duration) / 2
      return {
        ...caption,
        startTime: Math.max(0, caption.startTime - extension),
        endTime: caption.endTime + extension
      }
    }

    return caption
  }

  /**
   * Validate and sort captions by start time
   */
  static validateAndSortCaptions(captions: ProcessedCaption[]): ProcessedCaption[] {
    const validCaptions = captions.filter(caption => {
      // Basic validation
      if (!caption.text || caption.text.trim().length === 0) {
        return false
      }

      if (caption.startTime < 0 || caption.endTime < 0) {
        return false
      }

      if (caption.endTime <= caption.startTime) {
        return false
      }

      // Validate UTF-8 encoding
      try {
        Buffer.from(caption.text, 'utf8')
        return true
      } catch {
        return false
      }
    })

    // Sort by start time
    return validCaptions.sort((a, b) => a.startTime - b.startTime)
  }

  /**
   * Export captions to SRT format
   */
  static exportToSRT(captions: CaptionSegment[]): string {
    return captions
      .map((caption, index) => {
        const startTime = this.formatSRTTime(caption.startTime)
        const endTime = this.formatSRTTime(caption.endTime)
        return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`
      })
      .join('\n')
  }

  /**
   * Export captions to VTT format
   */
  static exportToVTT(captions: CaptionSegment[]): string {
    const header = 'WEBVTT\n\n'
    const content = captions
      .map(caption => {
        const startTime = this.formatVTTTime(caption.startTime)
        const endTime = this.formatVTTTime(caption.endTime)
        return `${startTime} --> ${endTime}\n${caption.text}\n`
      })
      .join('\n')

    return header + content
  }

  /**
   * Export captions to JSON format
   */
  static exportToJSON(captions: CaptionSegment[]): string {
    return JSON.stringify(captions, null, 2)
  }

  /**
   * Export captions to all formats
   */
  static exportAllFormats(captions: CaptionSegment[]): ExportFormat {
    return {
      srt: this.exportToSRT(captions),
      vtt: this.exportToVTT(captions),
      json: captions
    }
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   */
  private static formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  /**
   * Format time for VTT (HH:MM:SS.mmm)
   */
  private static formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }
}

/**
 * Convenience functions for common caption processing tasks
 */

export function processCaptions(
  rawSegments: any[],
  options?: CaptionProcessingOptions
): ProcessedCaption[] {
  return CaptionProcessor.processRawCaptions(rawSegments, options)
}

export function exportCaptions(
  captions: CaptionSegment[],
  format: 'srt' | 'vtt' | 'json' | 'all'
): string | ExportFormat {
  if (format === 'all') {
    return CaptionProcessor.exportAllFormats(captions)
  }

  switch (format) {
    case 'srt':
      return CaptionProcessor.exportToSRT(captions)
    case 'vtt':
      return CaptionProcessor.exportToVTT(captions)
    case 'json':
      return CaptionProcessor.exportToJSON(captions)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

export function validateCaptionText(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  const cleanedText = CaptionProcessor.cleanCaptionText(text)

  // Check if text has meaningful content
  if (cleanedText.length < 1) {
    return false
  }

  // Validate UTF-8 encoding
  try {
    Buffer.from(cleanedText, 'utf8')
    return true
  } catch {
    return false
  }
}

export function detectCaptionLanguage(text: string): 'en-US' | 'hi-IN' | 'mixed' {
  return CaptionProcessor.detectLanguage(text)
}

export default CaptionProcessor