import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Image, AlertCircle, X, Check } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { LoadingSpinner } from './ui/loading'
import { cn } from '../lib/utils'
import { 
  validateFile, 
  extractFileMetadata, 
  createFilePreview, 
  isImageFile, 
  isPDFFile,
  type FileMetadata 
} from '../utils/fileValidation'

interface FileUploadZoneProps {
  onFileSelect: (file: File, metadata: FileMetadata, preview?: string) => void
  onFileRemove: () => void
  selectedFile: File | null
  isUploading?: boolean
  error?: string
  className?: string
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isUploading = false,
  error,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessingPreview, setIsProcessingPreview] = useState(false)
  const [filePreview, setFilePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelection = useCallback(async (file: File) => {
    // Validate the file
    const validation = validateFile(file)
    if (!validation.isValid) {
      // Let parent handle the error
      return
    }

    // Extract metadata
    const metadata = extractFileMetadata(file)
    
    // Create preview for images
    let preview = ''
    if (isImageFile(file)) {
      setIsProcessingPreview(true)
      try {
        preview = await createFilePreview(file)
        setFilePreview(preview)
      } catch (error) {
        console.warn('Failed to create file preview:', error)
      } finally {
        setIsProcessingPreview(false)
      }
    }

    onFileSelect(file, metadata, preview)
  }, [onFileSelect])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [handleFileSelection])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [handleFileSelection])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback(() => {
    setFilePreview('')
    onFileRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFileRemove])

  const getFileIcon = (file: File) => {
    if (isImageFile(file)) {
      return <Image className="w-8 h-8 text-healthcare-blue" />
    }
    if (isPDFFile(file)) {
      return <FileText className="w-8 h-8 text-healthcare-blue" />
    }
    return <FileText className="w-8 h-8 text-healthcare-blue" />
  }

  if (selectedFile) {
    const metadata = extractFileMetadata(selectedFile)
    
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Selected File</h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRemoveFile}
              disabled={isUploading}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getFileIcon(selectedFile)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium text-foreground truncate">{metadata.name}</p>
                {!isUploading && (
                  <Check className="w-4 h-4 text-healthcare-green flex-shrink-0" />
                )}
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Size: {metadata.sizeFormatted}</p>
                <p>Type: {metadata.type || 'Unknown'}</p>
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 mt-3">
                  <LoadingSpinner size="sm" variant="healthcare" />
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {filePreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Preview:</p>
              <div className="relative max-w-xs">
                <img
                  src={filePreview}
                  alt="File preview"
                  className="w-full h-auto max-h-48 object-contain rounded-md border border-border"
                />
                {isProcessingPreview && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-md">
                    <LoadingSpinner size="sm" variant="healthcare" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF Preview Placeholder */}
          {isPDFFile(selectedFile) && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">PDF Document:</p>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <FileText className="w-5 h-5 text-healthcare-blue" />
                <span className="text-sm text-muted-foreground">
                  PDF ready for processing
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer',
          isDragOver 
            ? 'border-healthcare-blue bg-healthcare-blue/5 scale-105' 
            : 'border-border hover:border-healthcare-blue/50 hover:bg-muted/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
              isDragOver 
                ? 'bg-healthcare-blue text-white scale-110' 
                : 'bg-muted text-muted-foreground'
            )}>
              <Upload className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isDragOver ? 'Drop your file here' : 'Upload Prescription'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your prescription file here, or click to browse
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, JPG, PNG
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 50MB
            </p>
          </div>

          <Button
            variant="healthcare-outline"
            size="lg"
            className="mt-4"
            disabled={isUploading}
          >
            Choose File
          </Button>
        </div>

        {isDragOver && (
          <div className="absolute inset-0 bg-healthcare-blue/10 rounded-lg flex items-center justify-center">
            <div className="text-healthcare-blue font-medium">
              Release to upload
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mt-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </Card>
  )
}