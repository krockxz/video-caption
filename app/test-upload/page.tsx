'use client'

import { useState } from 'react'
import { uploadVideo, validateVideoFile } from '@/lib/utils/upload'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [userId, setUserId] = useState('test-user-1')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validation = validateVideoFile(selectedFile)
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
      if (!title) {
        setTitle(selectedFile.name)
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    if (!title) {
      setError('Please enter a title')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)

    try {
      const response = await uploadVideo({
        video: file,
        title,
        userId
      })

      setResult(response)

      if (response.success) {
        // Reset form on success
        setFile(null)
        setTitle('')
        const fileInput = document.getElementById('video-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Video Upload</h1>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Upload */}
          <div>
            <label htmlFor="video-file" className="block text-sm font-medium text-gray-700 mb-2">
              Video File (MP4, MPEG, MOV, AVI, WMV - Max 500MB)
            </label>
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter video title"
              required
            />
          </div>

          {/* User ID */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter user ID"
              required
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || !title || uploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>

        {/* Result Display */}
        {result && (
          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Result</h2>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Testing Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select a video file (MP4, MPEG, MOV, AVI, or WMV)</li>
            <li>• Maximum file size: 500MB</li>
            <li>• Enter a title for the video</li>
            <li>• Use a test user ID (default: test-user-1)</li>
            <li>• Click &quot;Upload Video&quot; to test the API</li>
            <li>• Check the result and browser console for any errors</li>
          </ul>
        </div>
      </div>
    </div>
  )
}