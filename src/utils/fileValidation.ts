// File validation utilities for OCR medicine upload

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified: number
  sizeFormatted: string
}

// Supported file types for OCR processing
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png'
] as const

export const SUPPORTED_FILE_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png'
] as const

// Maximum file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes

/**
 * Validates if the file type is supported for OCR processing
 */
export const validateFileType = (file: File): FileValidationResult => {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  // Check MIME type first
  if (SUPPORTED_FILE_TYPES.includes(fileType as any)) {
    return { isValid: true }
  }
  
  // Fallback to file extension check
  const hasValidExtension = SUPPORTED_FILE_EXTENSIONS.some(ext => 
    fileName.endsWith(ext)
  )
  
  if (hasValidExtension) {
    return { isValid: true }
  }
  
  return {
    isValid: false,
    error: 'Please upload a PDF, JPG, or PNG file'
  }
}

/**
 * Validates if the file size is within the allowed limit
 */
export const validateFileSize = (file: File): FileValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
    const fileSizeMB = Math.round(file.size / (1024 * 1024))
    
    return {
      isValid: false,
      error: `File size must be under ${maxSizeMB}MB. Your file is ${fileSizeMB}MB`
    }
  }
  
  return { isValid: true }
}

/**
 * Comprehensive file validation combining type and size checks
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check file type first
  const typeValidation = validateFileType(file)
  if (!typeValidation.isValid) {
    return typeValidation
  }
  
  // Check file size
  const sizeValidation = validateFileSize(file)
  if (!sizeValidation.isValid) {
    return sizeValidation
  }
  
  return { isValid: true }
}

/**
 * Extracts metadata from a file for preview purposes
 */
export const extractFileMetadata = (file: File): FileMetadata => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    sizeFormatted: formatFileSize(file.size)
  }
}

/**
 * Formats file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Creates a preview URL for image files
 */
export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      // For PDFs, we'll return a placeholder or use a PDF preview library
      resolve('')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = () => {
      reject(new Error('Failed to create file preview'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Checks if the file is an image that can be previewed
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

/**
 * Checks if the file is a PDF
 */
export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}