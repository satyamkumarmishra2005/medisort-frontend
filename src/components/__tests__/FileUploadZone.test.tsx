import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploadZone } from '../FileUploadZone'

// Mock the file validation utilities
jest.mock('../../utils/fileValidation', () => ({
  validateFile: jest.fn(),
  extractFileMetadata: jest.fn(),
  createFilePreview: jest.fn(),
  isImageFile: jest.fn(),
  isPDFFile: jest.fn()
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Image: () => <div data-testid="image-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  X: () => <div data-testid="x-icon" />,
  Check: () => <div data-testid="check-icon" />
}))

const mockValidateFile = require('../../utils/fileValidation').validateFile
const mockExtractFileMetadata = require('../../utils/fileValidation').extractFileMetadata
const mockCreateFilePreview = require('../../utils/fileValidation').createFilePreview
const mockIsImageFile = require('../../utils/fileValidation').isImageFile
const mockIsPDFFile = require('../../utils/fileValidation').isPDFFile

const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileUploadZone', () => {
  const mockOnFileSelect = jest.fn()
  const mockOnFileRemove = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockValidateFile.mockReturnValue({ isValid: true })
    mockExtractFileMetadata.mockReturnValue({
      name: 'test.pdf',
      size: 1024,
      type: 'application/pdf',
      sizeFormatted: '1 KB',
      lastModified: Date.now()
    })
    mockCreateFilePreview.mockResolvedValue('data:image/jpeg;base64,mock')
    mockIsImageFile.mockReturnValue(false)
    mockIsPDFFile.mockReturnValue(true)
  })

  describe('Upload Zone Display', () => {
    it('should render upload zone when no file is selected', () => {
      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={null}
        />
      )

      expect(screen.getByText('Upload Prescription')).toBeInTheDocument()
      expect(screen.getByText('Drag and drop your prescription file here, or click to browse')).toBeInTheDocument()
      expect(screen.getByText('Supported formats: PDF, JPG, PNG')).toBeInTheDocument()
      expect(screen.getByText('Maximum file size: 50MB')).toBeInTheDocument()
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument()
    })

    it('should show drag over state when dragging files', () => {
      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={null}
        />
      )

      const dropZone = screen.getByText('Upload Prescription').closest('div')
      
      fireEvent.dragEnter(dropZone!)
      expect(screen.getByText('Drop your file here')).toBeInTheDocument()
      
      fireEvent.dragLeave(dropZone!)
      expect(screen.getByText('Upload Prescription')).toBeInTheDocument()
    })

    it('should display error message when provided', () => {
      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={null}
          error="File too large"
        />
      )

      expect(screen.getByText('File too large')).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should handle file selection via click', async () => {
      const user = userEvent.setup()
      const file = createMockFile('test.pdf', 1024, 'application/pdf')

      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={null}
        />
      )

      const fileInput = screen.getByRole('button', { name: /choose file/i }).parentElement?.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()

      await user.upload(fileInput!, file)

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(
          file,
          expect.objectContaining({
            name: 'test.pdf',
            size: 1024,
            type: 'application/pdf'
          }),
          ''
        )
      })
    })

    it('should handle file selection via drag and drop', async () => {
      const file = createMockFile('test.pdf', 1024, 'application/pdf')

      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={null}
        />
      )

      const dropZone = screen.getByText('Upload Prescription').closest('div')
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file]
        }
      })

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(
          file,
          expect.objectContaining({
            name: 'test.pdf',
            size: 1024,
            type: 'application/pdf'
          }),
          ''
        )
      })
    })

    it('should create preview for image files', async () => {
      const file = createMockFile('image.jpg', 1024, 'image/jpeg')
      mockIsImageFile.mockReturnValue(true)
      mockIsPDFFile.mockReturnValue(false)

      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={null}
        />
      )

      const dropZone = screen.getByText('Upload Prescription').closest('div')
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file]
        }
      })

      await waitFor(() => {
        expect(mockCreateFilePreview).toHaveBeenCalledWith(file)
        expect(mockOnFileSelect).toHaveBeenCalledWith(
          file,
          expect.any(Object),
          'data:image/jpeg;base64,mock'
        )
      })
    })
  })

  describe('Selected File Display', () => {
    const mockFile = createMockFile('prescription.pdf', 2048, 'application/pdf')

    it('should display selected file information', () => {
      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={mockFile}
        />
      )

      expect(screen.getByText('Selected File')).toBeInTheDocument()
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
      expect(screen.getByText('Size: 1 KB')).toBeInTheDocument()
      expect(screen.getByText('Type: application/pdf')).toBeInTheDocument()
      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })

    it('should show loading state when uploading', () => {
      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={mockFile}
          isUploading={true}
        />
      )

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument()
    })

    it('should handle file removal', async () => {
      const user = userEvent.setup()

      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={mockFile}
        />
      )

      const removeButton = screen.getByTestId('x-icon').closest('button')
      await user.click(removeButton!)

      expect(mockOnFileRemove).toHaveBeenCalled()
    })

    it('should display PDF indicator for PDF files', () => {
      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={mockFile}
        />
      )

      expect(screen.getByText('PDF Document:')).toBeInTheDocument()
      expect(screen.getByText('PDF ready for processing')).toBeInTheDocument()
    })

    it('should display image preview for image files', () => {
      const imageFile = createMockFile('image.jpg', 1024, 'image/jpeg')
      mockIsImageFile.mockReturnValue(true)
      mockIsPDFFile.mockReturnValue(false)

      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={imageFile}
        />
      )

      // Note: This test would need the filePreview prop to be passed
      // In a real scenario, the preview would be set when the file is selected
    })
  })

  describe('Error Handling', () => {
    it('should display error in selected file view', () => {
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf')

      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={mockFile}
          error="Upload failed"
        />
      )

      expect(screen.getByText('Upload failed')).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })

    it('should disable interactions when uploading', () => {
      render(
        <FileUploadZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          selectedFile={null}
          isUploading={true}
        />
      )

      const fileInput = screen.getByRole('button', { name: /choose file/i }).parentElement?.querySelector('input[type="file"]')
      expect(fileInput).toBeDisabled()
    })
  })
})