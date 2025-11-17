"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FileUploadInput } from "@/components/forms/FileUploadInput";
import { CaptionStyleSelector } from "@/components/forms/CaptionStyleSelector";
import { VideoMetadataForm } from "@/components/forms/VideoMetadataForm";
import { VideoCard, VideoData } from "@/components/displays/VideoCard";
import { CaptionTable, Caption } from "@/components/displays/CaptionTable";
import { StatusBadge } from "@/components/displays/StatusBadge";
import { ProgressIndicator } from "@/components/displays/ProgressIndicator";
import { VideoUploadSection } from "@/components/VideoUploadSection";
import { CaptionManagerSection } from "@/components/CaptionManagerSection";
import { RenderPreviewSection } from "@/components/RenderPreviewSection";
import { VideoListSection } from "@/components/VideoListSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Sample data for testing
const sampleVideos: VideoData[] = [
  {
    id: "1",
    title: "Sample Video 1",
    fileName: "sample1.mp4",
    status: "completed",
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    duration: 120,
    fileSize: 50 * 1024 * 1024, // 50MB
    captionCount: 25
  },
  {
    id: "2",
    title: "Sample Video 2",
    fileName: "sample2.mp4",
    status: "captioning",
    uploadedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    duration: 180,
    fileSize: 75 * 1024 * 1024, // 75MB
    captionCount: 10
  },
  {
    id: "3",
    title: "Sample Video 3",
    fileName: "sample3.mp4",
    status: "processing",
    uploadedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    duration: 90,
    fileSize: 30 * 1024 * 1024 // 30MB
  }
];

const sampleCaptions: Caption[] = [
  {
    id: "1",
    videoId: "1",
    startTime: 0,
    endTime: 3.5,
    text: "Hello and welcome to this video captioning demonstration",
    language: "en",
    style: "default",
    confidence: 0.95,
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    videoId: "1",
    startTime: 3.5,
    endTime: 7.2,
    text: "This platform uses advanced AI to generate accurate captions",
    language: "en",
    style: "default",
    confidence: 0.92,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    videoId: "1",
    startTime: 7.2,
    endTime: 11.8,
    text: "यह हिंदी और इंग्लिश दोनों में कैप्शन का समर्थन करता है",
    language: "hi",
    style: "default",
    confidence: 0.88,
    createdAt: new Date().toISOString()
  }
];

export default function TestComponents() {
  const [selectedStyle, setSelectedStyle] = useState("default");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("My Awesome Video");

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file);
    alert(`File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
    console.log("Video selected:", videoId);
  };

  const handleVideoDelete = (videoId: string) => {
    console.log("Video deleted:", videoId);
    alert(`Video ${videoId} would be deleted`);
  };

  const handleCaptionSelect = (captionId: string) => {
    setSelectedCaption(captionId);
    console.log("Caption selected:", captionId);
  };

  return (
    <MainLayout
      headerProps={{
        title: "Component Test Page",
        showStatus: true,
        apiStatus: "healthy"
      }}
      showSidebar={true}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">shadcn/ui Component Test</h1>
          <p className="text-muted-foreground">
            Test page for all the custom components created with shadcn/ui and Tailwind CSS.
          </p>
        </div>

        <Tabs defaultValue="major" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="major">Major Sections</TabsTrigger>
            <TabsTrigger value="forms">Form Components</TabsTrigger>
            <TabsTrigger value="displays">Display Components</TabsTrigger>
            <TabsTrigger value="layout">Layout Components</TabsTrigger>
          </TabsList>

          {/* Major Sections Tab */}
          <TabsContent value="major" className="space-y-8">
            <div className="space-y-6">
              {/* Video Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Upload Section</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Main upload interface with progress tracking and error handling
                  </p>
                </CardHeader>
                <CardContent>
                  <VideoUploadSection
                    onUploadStart={() => console.log("Upload started")}
                    onUploadComplete={(videoId) => console.log("Upload completed:", videoId)}
                    onError={(error) => console.log("Upload error:", error)}
                  />
                </CardContent>
              </Card>

              {/* Caption Manager Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Caption Manager Section</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Interface for viewing, editing, and managing video captions
                  </p>
                </CardHeader>
                <CardContent>
                  <CaptionManagerSection
                    videoId="test-video-1"
                    captions={sampleCaptions}
                    onCaptionsUpdate={(captions) => console.log("Captions updated:", captions)}
                    onGenerateClick={() => console.log("Generate captions clicked")}
                    onSaveClick={(captions) => console.log("Save captions clicked:", captions)}
                  />
                </CardContent>
              </Card>

              {/* Render Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Render Preview Section</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Video preview with caption overlay and rendering controls
                  </p>
                </CardHeader>
                <CardContent>
                  <RenderPreviewSection
                    videoId="test-video-1"
                    captions={sampleCaptions}
                    onRenderClick={(style) => console.log("Render clicked with style:", style)}
                    onDownloadClick={() => console.log("Download clicked")}
                  />
                </CardContent>
              </Card>

              {/* Video List Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Video List Section</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Grid/list view of all videos with filtering and search
                  </p>
                </CardHeader>
                <CardContent>
                  <VideoListSection
                    videos={sampleVideos}
                    onSelectVideo={(videoId) => console.log("Video selected:", videoId)}
                    onDeleteVideo={(videoId) => console.log("Video deleted:", videoId)}
                    onLoadMore={() => console.log("Load more clicked")}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Form Components Tab */}
          <TabsContent value="forms" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload Input */}
              <Card>
                <CardHeader>
                  <CardTitle>File Upload Input</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUploadInput
                    onFileSelect={handleFileSelect}
                    accept=".mp4"
                    maxSizeMB={500}
                  />
                </CardContent>
              </Card>

              {/* Caption Style Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Caption Style Selector</CardTitle>
                </CardHeader>
                <CardContent>
                  <CaptionStyleSelector
                    value={selectedStyle}
                    onChange={setSelectedStyle}
                  />
                </CardContent>
              </Card>

              {/* Video Metadata Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Video Metadata Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoMetadataForm
                    title={videoTitle}
                    onTitleChange={setVideoTitle}
                    metadata={{
                      fileName: "sample-video.mp4",
                      fileSize: 123456789,
                      duration: 300,
                      uploadedAt: new Date().toISOString(),
                      resolution: "1920x1080",
                      format: "MP4"
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Display Components Tab */}
          <TabsContent value="displays" className="space-y-6">
            {/* Status Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Status Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <StatusBadge status="uploading" />
                  <StatusBadge status="processing" />
                  <StatusBadge status="captioning" />
                  <StatusBadge status="completed" />
                  <StatusBadge status="failed" />
                  <StatusBadge status="processing" size="sm" />
                  <StatusBadge status="completed" size="lg" />
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressIndicator value={25} label="Upload Progress" animated />
                <ProgressIndicator value={60} label="Processing" animated showPercentage />
                <ProgressIndicator value={100} label="Complete" />
                <ProgressIndicator value={45} size="sm" />
                <ProgressIndicator value={75} size="lg" animated />
              </CardContent>
            </Card>

            {/* Video Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Video Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sampleVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onSelect={handleVideoSelect}
                      onDelete={handleVideoDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Caption Table */}
            <Card>
              <CardHeader>
                <CardTitle>Caption Table</CardTitle>
              </CardHeader>
              <CardContent>
                <CaptionTable
                  captions={sampleCaptions}
                  selectedId={selectedCaption}
                  onSelectCaption={handleCaptionSelect}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Components Tab */}
          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Header Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The header is already displayed at the top of this page.
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Features: Logo, title, API status indicator, GitHub link, responsive mobile menu
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sidebar Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The sidebar is visible on the left side of this page (desktop) or accessible via the menu button (mobile).
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Features: Navigation menu, status indicators, storage info, responsive design
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>MainLayout Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This entire page is wrapped in the MainLayout component.
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Features: Combines header, sidebar, and main content area, responsive grid layout
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Footer Component</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The footer is displayed at the bottom of this page.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Features: Technology links, resources, legal information, responsive layout
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}