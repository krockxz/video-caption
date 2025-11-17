'use client'

import { useState, useEffect } from 'react'
import { fetchVideos, fetchVideo, deleteVideo, generateCaptions, createRender, getRenderStatus, formatDuration, formatDate, getVideoStatusColor, formatRenderStatus, getRenderStatusColor } from '@/lib/utils/videos'

export default function TestVideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [deleteResult, setDeleteResult] = useState<any>(null)
  const [captionResult, setCaptionResult] = useState<any>(null)
  const [renderResult, setRenderResult] = useState<any>(null)

  const fetchVideosList = async (page: number = 1) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchVideos(page, 10)

      if (response.success && response.data) {
        setVideos(response.data.items)
        setPagination(response.data.pagination)
        setCurrentPage(page)
      } else {
        setError(response.error || 'Failed to fetch videos')
        setVideos([])
      }
    } catch (err) {
      setError('Failed to fetch videos')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSingleVideo = async (videoId: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchVideo(videoId)

      if (response.success && response.data) {
        setSelectedVideo(response.data)
      } else {
        setError(response.error || 'Failed to fetch video')
        setSelectedVideo(null)
      }
    } catch (err) {
      setError('Failed to fetch video')
      setSelectedVideo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')
    setDeleteResult(null)

    try {
      const response = await deleteVideo(videoId)

      if (response.success && response.data) {
        setDeleteResult(response.data)

        // Clear selected video if it was deleted
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(null)
        }

        // Refresh the videos list
        await fetchVideosList(currentPage)
      } else {
        setError(response.error || 'Failed to delete video')
      }
    } catch (err) {
      setError('Failed to delete video')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCaptions = async (videoId: string) => {
    if (!confirm('Generate captions for this video? This will replace any existing captions.')) {
      return
    }

    setLoading(true)
    setError('')
    setCaptionResult(null)

    try {
      const response = await generateCaptions(videoId)

      if (response.success && response.data) {
        setCaptionResult(response.data)

        // Refresh the video details to show new captions
        if (selectedVideo?.id === videoId) {
          await fetchSingleVideo(videoId)
        }

        // Refresh the videos list to update status
        await fetchVideosList(currentPage)
      } else {
        setError(response.error || 'Failed to generate captions')
      }
    } catch (err) {
      setError('Failed to generate captions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRender = async (videoId: string, captionStyle: 'default' | 'newsbar' | 'karaoke') => {
    setLoading(true)
    setError('')
    setRenderResult(null)

    try {
      const response = await createRender(videoId, captionStyle)

      if (response.success && response.data) {
        setRenderResult(response.data)

        // Refresh the video details to show new render
        if (selectedVideo?.id === videoId) {
          await fetchSingleVideo(videoId)
        }

        // Refresh the videos list to update status
        await fetchVideosList(currentPage)
      } else {
        setError(response.error || 'Failed to create render job')
      }
    } catch (err) {
      setError('Failed to create render job')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideosList(1)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Videos API</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {deleteResult && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800 font-medium">Video Deleted Successfully!</p>
            <div className="text-xs text-green-700 mt-1">
              <p>• Video record: ✅</p>
              <p>• {deleteResult.deleted.captions} captions deleted</p>
              <p>• {deleteResult.deleted.renders} renders deleted</p>
              <p>• Files {deleteResult.deleted.files ? '✅' : '❌'} deleted</p>
            </div>
          </div>
        )}

        {captionResult && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800 font-medium">Captions Generated Successfully!</p>
            <div className="text-xs text-blue-700 mt-1">
              <p>• Generated {captionResult.captions.length} captions</p>
              <p>• Generated at: {new Date(captionResult.generatedAt).toLocaleString()}</p>
              <div className="mt-2 space-y-1">
                {captionResult.captions.map((caption: any, index: number) => (
                  <p key={index} className="text-xs">
                    {caption.startTime}s - {caption.endTime}s: &quot;{caption.text}&quot;
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {renderResult && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-md p-4">
            <p className="text-sm text-purple-800 font-medium">Render Job Created!</p>
            <div className="text-xs text-purple-700 mt-1">
              <p>• Render ID: {renderResult.renderId}</p>
              <p>• Style: {renderResult.captionStyle}</p>
              <p>• Status: {renderResult.status}</p>
              <p>• Created at: {new Date(renderResult.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Videos List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Videos List</h2>

            {/* Pagination Controls */}
            {pagination && (
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                  ({pagination.total} total videos)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchVideosList(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchVideosList(currentPage + 1)}
                    disabled={!pagination?.hasMore}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No videos found. Upload some videos first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => fetchSingleVideo(video.id)}
                      >
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVideoStatusColor(video.status)}`}>
                          {video.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGenerateCaptions(video.id)
                          }}
                          disabled={loading || video.status === 'captioning'}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                        >
                          {video.status === 'captioning' ? 'Generating...' : 'Generate Captions'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCreateRender(video.id, 'default')
                          }}
                          disabled={loading || video.status !== 'completed'}
                          className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                          title="Render with default style"
                        >
                          Render
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteVideo(video.id)
                          }}
                          disabled={loading}
                          className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div
                      className="text-sm text-gray-600 space-y-1 cursor-pointer"
                      onClick={() => fetchSingleVideo(video.id)}
                    >
                      <p>File: {video.fileName}</p>
                      <p>Duration: {formatDuration(video.duration)}</p>
                      <p>Uploaded: {formatDate(video.uploadedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Single Video Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Details</h2>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : !selectedVideo ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Click on a video to see details</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Video Info */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{selectedVideo.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateCaptions(selectedVideo.id)}
                        disabled={loading || selectedVideo.status === 'captioning'}
                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedVideo.status === 'captioning' ? 'Generating Captions...' : 'Generate Captions'}
                      </button>
                      <button
                        onClick={() => handleCreateRender(selectedVideo.id, 'default')}
                        disabled={loading || selectedVideo.status !== 'completed'}
                        className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Render
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Video ID:</strong> {selectedVideo.id}</p>
                    <p><strong>File:</strong> {selectedVideo.fileName}</p>
                    <p><strong>Path:</strong> {selectedVideo.filePath}</p>
                    <p><strong>Duration:</strong> {formatDuration(selectedVideo.duration)}</p>
                    <p><strong>Status:</strong>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getVideoStatusColor(selectedVideo.status)}`}>
                        {selectedVideo.status}
                      </span>
                    </p>
                    <p><strong>Uploaded:</strong> {formatDate(selectedVideo.uploadedAt)}</p>
                  </div>
                </div>

                {/* Captions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Captions ({selectedVideo.captions?.length || 0})
                  </h4>
                  {selectedVideo.captions?.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedVideo.captions.map((caption: any) => (
                        <div key={caption.id} className="text-sm border-l-2 border-blue-300 pl-3 py-1">
                          <p className="text-gray-700">{caption.text}</p>
                          <p className="text-xs text-gray-500">
                            {caption.startTime}s - {caption.endTime}s • {caption.language} • {caption.style}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No captions yet</p>
                  )}
                </div>

                {/* Renders */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Renders ({selectedVideo.renders?.length || 0})
                  </h4>
                  {selectedVideo.renders?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedVideo.renders.map((render: any) => (
                        <div key={render.id} className="text-sm border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium text-gray-900">{render.captionStyle}</span>
                              <span className="ml-2 text-xs text-gray-500">ID: {render.id.substring(0, 8)}...</span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRenderStatusColor(render.status)}`}>
                              {formatRenderStatus(render.status)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Created: {formatDate(render.createdAt)}</p>
                            {render.outputPath && (
                              <p className="text-green-600">
                                ✅ Output: {render.outputPath}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No renders yet. Generate captions first, then create renders.</p>
                  )}
                </div>

                {/* Raw JSON */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Raw Response</h4>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto max-h-60">
                    {JSON.stringify(selectedVideo, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Testing Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• This page tests GET, DELETE, and POST endpoints for videos, captions, and renders</li>
            <li>• Videos are fetched for hardcoded user ID: &lsquo;user1&rsquo;</li>
            <li>• Click on any video title to see detailed information including captions and renders</li>
            <li>• Use &quot;Generate Captions&quot; to test mock caption generation API (creates sample captions)</li>
            <li>• Use &quot;Create Render&quot; to test render job creation (placeholder for Remotion integration)</li>
            <li>• Use &quot;Delete&quot; to test video deletion (includes file cleanup)</li>
            <li>• Pagination controls allow browsing through multiple pages</li>
            <li>• Check the browser console for API request/response details</li>
            <li>• Upload videos first using the test upload page to populate data</li>
            <li>• Caption generation creates 3 mock captions with mixed languages</li>
            <li>• Render jobs are created with &lsquo;pending&rsquo; status (placeholder for actual rendering)</li>
            <li>• Render status can be checked via GET /api/videos/[videoId]/render/[renderId]</li>
          </ul>
        </div>
      </div>
    </div>
  )
}