'use client'

import { useState, useEffect } from 'react'
import {
  fetchVideoCaptions,
  createVideoCaptions,
  validateCaptionData,
  type CaptionInput,
  type CaptionData
} from '@/lib/utils/videos'
import type { GetCaptionsResponse, CreateCaptionsResponse } from '@/lib/types/api'

export default function TestCaptionsPage() {
  const [videoId, setVideoId] = useState('')
  const [captions, setCaptions] = useState<CaptionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state for adding new captions
  const [newCaptions, setNewCaptions] = useState<CaptionInput[]>([
    {
      text: '',
      startTime: 0,
      endTime: 2,
      language: 'en-US',
      style: 'default'
    }
  ])

  // Mock data for testing
  const loadMockData = () => {
    const mockCaptions: CaptionInput[] = [
      {
        text: "Hello world, this is a test caption",
        startTime: 0,
        endTime: 3.5,
        language: 'en-US',
        style: 'default'
      },
      {
        text: "यह एक हिंदी कैप्शन है",
        startTime: 3.5,
        endTime: 6.0,
        language: 'hi-IN',
        style: 'newsbar'
      },
      {
        text: "This is Hinglish mixed content",
        startTime: 6.0,
        endTime: 9.0,
        language: 'en-US',
        style: 'karaoke'
      }
    ]
    setNewCaptions(mockCaptions)
  }

  const fetchCaptions = async () => {
    if (!videoId.trim()) {
      setError('Please enter a video ID')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response: GetCaptionsResponse = await fetchVideoCaptions(videoId)

      if (response.success && response.data) {
        setCaptions(response.data.captions)
        setSuccess(`Found ${response.data.captions.length} captions`)
      } else {
        setError(response.error || 'Failed to fetch captions')
        setCaptions([])
      }
    } catch (err) {
      setError('Network error while fetching captions')
      setCaptions([])
    } finally {
      setLoading(false)
    }
  }

  const saveCaptions = async () => {
    if (!videoId.trim()) {
      setError('Please enter a video ID')
      return
    }

    // Validate all captions
    for (let i = 0; i < newCaptions.length; i++) {
      const validation = validateCaptionData(newCaptions[i])
      if (!validation.isValid) {
        setError(`Caption ${i + 1}: ${validation.error}`)
        return
      }
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response: CreateCaptionsResponse = await createVideoCaptions(videoId, newCaptions)

      if (response.success && response.data) {
        setSuccess(`Successfully saved ${response.data.count} captions!`)
        // Refresh the captions list
        await fetchCaptions()
      } else {
        setError(response.error || 'Failed to save captions')
        if (response.details) {
          console.error('Caption creation details:', response.details)
        }
      }
    } catch (err) {
      setError('Network error while saving captions')
    } finally {
      setLoading(false)
    }
  }

  const addCaptionField = () => {
    const lastCaption = newCaptions[newCaptions.length - 1]
    setNewCaptions([...newCaptions, {
      text: '',
      startTime: lastCaption ? lastCaption.endTime : 0,
      endTime: lastCaption ? lastCaption.endTime + 2 : 2,
      language: 'en-US',
      style: 'default'
    }])
  }

  const removeCaptionField = (index: number) => {
    if (newCaptions.length > 1) {
      setNewCaptions(newCaptions.filter((_, i) => i !== index))
    }
  }

  const updateCaption = (index: number, field: keyof CaptionInput, value: any) => {
    const updated = [...newCaptions]
    updated[index] = { ...updated[index], [field]: value }
    setNewCaptions(updated)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Caption Management</h1>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Video ID Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Selection</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="Enter video ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={fetchCaptions}
              disabled={loading || !videoId.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Captions'}
            </button>
            <button
              onClick={loadMockData}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Load Mock Data
            </button>
          </div>
        </div>

        {/* Current Captions */}
        {captions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Current Captions ({captions.length})
            </h2>
            <div className="space-y-3">
              {captions.map((caption, index) => (
                <div key={caption.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Caption {index + 1}</h4>
                    <span className="text-xs text-gray-500">{caption.language} • {caption.style}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{caption.text}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caption Editor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Caption Editor ({newCaptions.length} captions)
          </h2>

          <div className="space-y-4 mb-6">
            {newCaptions.map((caption, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Caption {index + 1}</h4>
                  <button
                    onClick={() => removeCaptionField(index)}
                    disabled={newCaptions.length <= 1}
                    className="px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                    <input
                      type="text"
                      value={caption.text}
                      onChange={(e) => updateCaption(index, 'text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter caption text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (seconds)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={caption.startTime}
                      onChange={(e) => updateCaption(index, 'startTime', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time (seconds)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={caption.endTime}
                      onChange={(e) => updateCaption(index, 'endTime', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={caption.language}
                      onChange={(e) => updateCaption(index, 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="hi-IN">Hindi (IN)</option>
                      <option value="es-ES">Spanish (ES)</option>
                      <option value="fr-FR">French (FR)</option>
                      <option value="de-DE">German (DE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <select
                      value={caption.style}
                      onChange={(e) => updateCaption(index, 'style', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="default">Default</option>
                      <option value="newsbar">News Bar</option>
                      <option value="karaoke">Karaoke</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={addCaptionField}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Add Caption
            </button>

            <button
              onClick={saveCaptions}
              disabled={loading || !videoId.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save All Captions'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Testing Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter a video ID to fetch existing captions (or use one from the videos test page)</li>
            <li>• Click &quot;Load Mock Data&quot; to populate the editor with sample captions</li>
            <li>• Add, edit, or remove captions using the form fields</li>
            <li>• Validation ensures proper time ranges and required fields</li>
            <li>• Click &quot;Save All Captions&quot; to replace all captions for the video</li>
            <li>• The API will delete existing captions and create new ones</li>
            <li>• Use GET and POST methods to test the /api/videos/[videoId]/captions endpoints</li>
          </ul>
        </div>
      </div>
    </div>
  )
}