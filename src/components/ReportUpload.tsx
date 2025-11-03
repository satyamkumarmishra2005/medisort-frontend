import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, FileText, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface ReportUploadProps {
  onUploadSuccess?: (report: any) => void
  onClose?: () => void
}

const ReportUpload: React.FC<ReportUploadProps> = ({ onUploadSuccess, onClose }) => {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Only PDF and image files (JPG, PNG, GIF, BMP, WebP) are allowed')
        setUploadStatus('error')
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be less than 10MB')
        setUploadStatus('error')
        return
      }

      setSelectedFile(file)
      setUploadStatus('idle')
      setErrorMessage('')
      setSuccessMessage('')
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      // Validate file type directly instead of using synthetic event
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Only PDF and image files (JPG, PNG, GIF, BMP, WebP) are allowed')
        setUploadStatus('error')
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be less than 10MB')
        setUploadStatus('error')
        return
      }

      setSelectedFile(file)
      setUploadStatus('idle')
      setErrorMessage('')
      setSuccessMessage('')
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setErrorMessage('Please select a file and ensure you are logged in')
      setUploadStatus('error')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      console.log('🚀 Starting report upload...')
      console.log('📁 File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      })
      console.log('👤 User details:', {
        id: user.id,
        email: user.email,
        name: user.name
      })

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Check if we have a valid token
      const token = localStorage.getItem('medisort_token')
      console.log('🔑 Token available:', !!token)
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'No token')

      // Try to parse user ID as fallback
      let fallbackUserId: number | undefined
      const parsedUserId = parseInt(user.id)
      if (!isNaN(parsedUserId)) {
        fallbackUserId = parsedUserId
      }

      console.log('🔢 Fallback user ID:', fallbackUserId)

      const result = await ApiService.uploadReport(selectedFile, fallbackUserId)

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('📡 Upload result:', result)

      if (result.success) {
        setUploadStatus('success')
        setSuccessMessage('Report uploaded successfully!')
        
        // Call success callback if provided
        if (onUploadSuccess && result.data) {
          onUploadSuccess(result.data)
        }

        // Reset form after a delay
        setTimeout(() => {
          setSelectedFile(null)
          setUploadProgress(0)
          setUploadStatus('idle')
          setSuccessMessage('')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 2000)
      } else {
        setUploadStatus('error')
        setErrorMessage(result.message || 'Upload failed')
        console.error('❌ Upload failed:', result.message)
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      setUploadStatus('error')
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setErrorMessage('')
    setSuccessMessage('')
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    return <ImageIcon className="w-8 h-8 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Report
              </CardTitle>
              <CardDescription>
                Upload your medical reports (PDF or images, max 10MB)
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Drop Zone */}
          {!selectedFile && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, JPG, PNG, GIF, BMP, WebP (max 10MB)
              </p>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Selected File Display */}
          {selectedFile && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === 'success' && successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
              variant="healthcare-gradient"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Report
                </>
              )}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ReportUpload