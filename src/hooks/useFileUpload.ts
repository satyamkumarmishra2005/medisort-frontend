import { useState, useCallback } from 'react'
import { validateFile, type FileMetadata } from '../utils/fileValidation'

interface UseFileUploadState {
  selectedFile: File | null
  fileMetadata: FileMetadata | null
  filePreview: string | null
  error: string | null
  isUploading: boolean
}

interface UseFileUploadActions {
  selectFile: (file: File, metadata: FileMetadata, preview?: string) => void
  removeFile: () => void
  setError: (error: string | null) => void
  setUploading: (uploading: boolean) => void
  validateAndSelectFile: (file: File) => Promise<boolean>
}

export const useFileUpload = (): UseFileUploadState & UseFileUploadActions => {
  const [state, setState] = useState<UseFileUploadState>({
    selectedFile: null,
    fileMetadata: null,
    filePreview: null,
    error: null,
    isUploading: false
  })

  const selectFile = useCallback((file: File, metadata: FileMetadata, preview?: string) => {
    setState(prev => ({
      ...prev,
      selectedFile: file,
      fileMetadata: metadata,
      filePreview: preview || null,
      error: null
    }))
  }, [])

  const removeFile = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedFile: null,
      fileMetadata: null,
      filePreview: null,
      error: null
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }))
  }, [])

  const setUploading = useCallback((uploading: boolean) => {
    setState(prev => ({
      ...prev,
      isUploading: uploading
    }))
  }, [])

  const validateAndSelectFile = useCallback(async (file: File): Promise<boolean> => {
    const validation = validateFile(file)
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return false
    }

    setError(null)
    return true
  }, [setError])

  return {
    ...state,
    selectFile,
    removeFile,
    setError,
    setUploading,
    validateAndSelectFile
  }
}