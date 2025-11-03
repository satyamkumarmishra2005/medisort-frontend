import {
  validateFileType,
  validateFileSize,
  validateFile,
  extractFileMetadata,
  formatFileSize,
  isImageFile,
  isPDFFile,
  MAX_FILE_SIZE
} from '../fileValidation'

// Mock File constructor for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('File Validation Utilities', () => {
  describe('validateFileType', () => {
    it('should accept valid PDF files', () => {
      const file = createMockFile('prescription.pdf', 1000, 'application/pdf')
      const result = validateFileType(file)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid JPEG files', () => {
      const file = createMockFile('prescription.jpg', 1000, 'image/jpeg')
      const result = validateFileType(file)
      expect(result.isValid).toBe(true)
    })

    it('should accept valid PNG files', () => {
      const file = createMockFile('prescription.png', 1000, 'image/png')
      const result = validateFileType(file)
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid file types', () => {
      const file = createMockFile('document.txt', 1000, 'text/plain')
      const result = validateFileType(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please upload a PDF, JPG, or PNG file')
    })

    it('should accept files with valid extensions even if MIME type is missing', () => {
      const file = createMockFile('prescription.pdf', 1000, '')
      const result = validateFileType(file)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateFileSize', () => {
    it('should accept files under the size limit', () => {
      const file = createMockFile('small.pdf', 1024 * 1024, 'application/pdf') // 1MB
      const result = validateFileSize(file)
      expect(result.isValid).toBe(true)
    })

    it('should reject files over the size limit', () => {
      const file = createMockFile('large.pdf', MAX_FILE_SIZE + 1, 'application/pdf')
      const result = validateFileSize(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File size must be under 50MB')
    })

    it('should accept files exactly at the size limit', () => {
      const file = createMockFile('exact.pdf', MAX_FILE_SIZE, 'application/pdf')
      const result = validateFileSize(file)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateFile', () => {
    it('should pass comprehensive validation for valid files', () => {
      const file = createMockFile('prescription.pdf', 1024 * 1024, 'application/pdf')
      const result = validateFile(file)
      expect(result.isValid).toBe(true)
    })

    it('should fail if file type is invalid', () => {
      const file = createMockFile('document.txt', 1024, 'text/plain')
      const result = validateFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please upload a PDF, JPG, or PNG file')
    })

    it('should fail if file size is too large', () => {
      const file = createMockFile('large.pdf', MAX_FILE_SIZE + 1, 'application/pdf')
      const result = validateFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File size must be under 50MB')
    })
  })

  describe('extractFileMetadata', () => {
    it('should extract correct metadata from file', () => {
      const file = createMockFile('test.pdf', 1024 * 1024, 'application/pdf')
      const metadata = extractFileMetadata(file)
      
      expect(metadata.name).toBe('test.pdf')
      expect(metadata.size).toBe(1024 * 1024)
      expect(metadata.type).toBe('application/pdf')
      expect(metadata.sizeFormatted).toBe('1 MB')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB') // 1.5 KB
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB')
    })
  })

  describe('isImageFile', () => {
    it('should identify image files correctly', () => {
      const jpegFile = createMockFile('image.jpg', 1000, 'image/jpeg')
      const pngFile = createMockFile('image.png', 1000, 'image/png')
      const pdfFile = createMockFile('doc.pdf', 1000, 'application/pdf')
      
      expect(isImageFile(jpegFile)).toBe(true)
      expect(isImageFile(pngFile)).toBe(true)
      expect(isImageFile(pdfFile)).toBe(false)
    })
  })

  describe('isPDFFile', () => {
    it('should identify PDF files correctly', () => {
      const pdfFile = createMockFile('doc.pdf', 1000, 'application/pdf')
      const jpegFile = createMockFile('image.jpg', 1000, 'image/jpeg')
      const pdfWithoutMime = createMockFile('doc.pdf', 1000, '')
      
      expect(isPDFFile(pdfFile)).toBe(true)
      expect(isPDFFile(jpegFile)).toBe(false)
      expect(isPDFFile(pdfWithoutMime)).toBe(true)
    })
  })
})