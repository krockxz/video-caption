import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { useState, useRef, useCallback } from "react";

export interface FileUploadInputProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function FileUploadInput({
  onFileSelect,
  accept = ".mp4",
  maxSizeMB = 500,
  disabled = false,
  error,
  className
}: FileUploadInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (accept && !accept.split(',').some(ext => {
      const cleanExt = ext.trim().toLowerCase();
      if (cleanExt.startsWith('.')) {
        return file.name.toLowerCase().endsWith(cleanExt);
      }
      return file.type.toLowerCase() === cleanExt;
    })) {
      return `Invalid file type. Only ${accept} files are allowed.`;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit. Selected file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`;
    }

    return null;
  }, [accept, maxSizeBytes, maxSizeMB]);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setInternalError(validationError);
      setSelectedFile(null);
      return;
    }

    setInternalError(null);
    setSelectedFile(file);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setInternalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const displayError = error || internalError;

  return (
    <div className={className}>
      {/* Drag and drop area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/25'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${displayError ? 'border-destructive bg-destructive/5' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {/* Content */}
        <div className="space-y-3">
          {selectedFile ? (
            // Show selected file info
            <div className="flex items-center justify-center space-x-3">
              <File className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="ml-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ) : (
            // Show upload prompt
            <div className="space-y-3">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drop your {accept.replace('.', '').toUpperCase()} file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file size: {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {displayError && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {displayError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}