import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaptionTable, Caption } from "@/components/displays/CaptionTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  Save,
  Clock,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2
} from "lucide-react";

export interface CaptionManagerSectionProps {
  videoId: string;
  captions: Caption[];
  onCaptionsUpdate?: (captions: Caption[]) => void;
  isLoading?: boolean;
  isGenerating?: boolean;
  onGenerateClick?: () => void;
  onSaveClick?: (captions: Caption[]) => void;
}

export interface ExtendedCaption extends Caption {
  hasChanges?: boolean;
}

export function CaptionManagerSection({
  videoId,
  captions,
  onCaptionsUpdate,
  isLoading = false,
  isGenerating = false,
  onGenerateClick,
  onSaveClick
}: CaptionManagerSectionProps) {
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedCaption, setEditedCaption] = useState<ExtendedCaption | null>(null);
  const [localCaptions, setLocalCaptions] = useState<ExtendedCaption[]>(
    captions.map(cap => ({ ...cap, hasChanges: false }))
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update local captions when props change
  useEffect(() => {
    setLocalCaptions(captions.map(cap => ({ ...cap, hasChanges: false })));
    setHasUnsavedChanges(false);
  }, [captions]);

  const handleGenerateCaptions = useCallback(() => {
    onGenerateClick?.();
  }, [onGenerateClick]);

  const handleSaveChanges = useCallback(() => {
    const captionsToSave = localCaptions.map(({ hasChanges, ...caption }) => caption);
    onSaveClick?.(captionsToSave);
    setHasUnsavedChanges(false);
    setLocalCaptions(captionsToSave.map(cap => ({ ...cap, hasChanges: false })));
  }, [localCaptions, onSaveClick]);

  const handleCaptionSelect = useCallback((captionId: string) => {
    const caption = localCaptions.find(cap => cap.id === captionId);
    if (caption) {
      setSelectedCaptionId(captionId);
      setEditedCaption({ ...caption });
      setIsEditDialogOpen(true);
    }
  }, [localCaptions]);

  const handleEditCaption = useCallback((field: keyof ExtendedCaption, value: any) => {
    if (!editedCaption) return;

    const updated = { ...editedCaption, [field]: value, hasChanges: true };
    setEditedCaption(updated);

    // Update local captions immediately for real-time preview
    const updatedCaptions = localCaptions.map(cap =>
      cap.id === updated.id ? updated : cap
    );
    setLocalCaptions(updatedCaptions);
    setHasUnsavedChanges(true);
  }, [editedCaption, localCaptions]);

  const handleSaveEdit = useCallback(() => {
    if (!editedCaption) return;

    const updatedCaptions = localCaptions.map(cap =>
      cap.id === editedCaption.id ? editedCaption : cap
    );
    setLocalCaptions(updatedCaptions);
    setIsEditDialogOpen(false);
    setEditedCaption(null);
    setHasUnsavedChanges(true);
  }, [editedCaption, localCaptions]);

  const handleCancelEdit = useCallback(() => {
    // Revert changes
    const revertedCaptions = localCaptions.map(cap => {
      const original = captions.find(orig => orig.id === cap.id);
      return original ? { ...original, hasChanges: false } : cap;
    });
    setLocalCaptions(revertedCaptions);
    setHasUnsavedChanges(false);

    setIsEditDialogOpen(false);
    setEditedCaption(null);
  }, [localCaptions, captions]);

  const handleDeleteCaption = useCallback((captionId: string) => {
    if (window.confirm('Are you sure you want to delete this caption?')) {
      const updatedCaptions = localCaptions.filter(cap => cap.id !== captionId);
      setLocalCaptions(updatedCaptions);
      setHasUnsavedChanges(true);
      onCaptionsUpdate?.(updatedCaptions);
    }
  }, [localCaptions, onCaptionsUpdate]);

  const handleAddCaption = useCallback(() => {
    const newCaption: ExtendedCaption = {
      id: `caption_${Date.now()}`,
      videoId,
      text: '',
      startTime: 0,
      endTime: 1,
      language: 'en',
      style: 'default',
      createdAt: new Date().toISOString(),
      hasChanges: true
    };

    const updatedCaptions = [...localCaptions, newCaption].sort((a, b) => a.startTime - b.startTime);
    setLocalCaptions(updatedCaptions);
    setHasUnsavedChanges(true);
    onCaptionsUpdate?.(updatedCaptions);
  }, [localCaptions, videoId, onCaptionsUpdate]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isEmpty = localCaptions.length === 0;
  const hasChanges = hasUnsavedChanges;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Captions</span>
            {localCaptions.length > 0 && (
              <Badge variant="secondary">{localCaptions.length}</Badge>
            )}
          </CardTitle>

          <div className="flex items-center space-x-2">
            {isEmpty && !isLoading && (
              <Button onClick={handleGenerateCaptions} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Captions
                  </>
                )}
              </Button>
            )}

            {!isEmpty && (
              <>
                <Button variant="outline" onClick={handleAddCaption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Caption
                </Button>

                <Button
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || isGenerating}
                  variant={hasChanges ? "default" : "outline"}
                >
                  {hasChanges ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                {isGenerating ? 'Generating captions...' : 'Loading captions...'}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && isEmpty && (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No captions yet</h3>
              <p className="text-muted-foreground">
                Upload a video and click &quot;Generate Captions&quot; to get started
              </p>
            </div>
            {!isGenerating && (
              <Button onClick={handleGenerateCaptions} size="lg">
                <Wand2 className="h-5 w-5 mr-2" />
                Generate Captions
              </Button>
            )}
          </div>
        )}

        {/* Caption Table */}
        {!isLoading && !isEmpty && (
          <div className="space-y-4">
            {hasChanges && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
                </span>
              </div>
            )}

            <CaptionTable
              captions={localCaptions}
              selectedId={selectedCaptionId}
              onSelectCaption={handleCaptionSelect}
              isLoading={isLoading}
            />
          </div>
        )}
      </CardContent>

      {/* Edit Caption Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
          </DialogHeader>

          {editedCaption && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption-text">Text</Label>
                <Input
                  id="caption-text"
                  value={editedCaption.text}
                  onChange={(e) => handleEditCaption('text', e.target.value)}
                  placeholder="Enter caption text..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="number"
                    value={editedCaption.startTime}
                    onChange={(e) => handleEditCaption('startTime', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="number"
                    value={editedCaption.endTime}
                    onChange={(e) => handleEditCaption('endTime', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={editedCaption.language}
                    onValueChange={(value) => handleEditCaption('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select
                    value={editedCaption.style}
                    onValueChange={(value: 'default' | 'newsbar' | 'karaoke') => handleEditCaption('style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="newsbar">News Bar</SelectItem>
                      <SelectItem value="karaoke">Karaoke</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Duration: {formatTime(editedCaption.endTime - editedCaption.startTime)}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => editedCaption && handleDeleteCaption(editedCaption.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editedCaption}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}