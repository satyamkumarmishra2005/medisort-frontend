import { renderHook, act, waitFor } from '@testing-library/react'
import { useOCRProcessing } from '../useOCRProcessing'
import { medicineApi } from '../../services/medicineApi'

// Mock the medicine API
jest.mock('../../services/medicineApi', () => ({
  medicineApi: {
    uploadAndExtractMedicine: jest.fn()
  }
}))

const mockMedicineApi = medicineApi as jest.Mocked<typeof medicineApi>

const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const mockExtractedData = {
  name: 'Paracetamol',
  dosage: '500mg',
  category: 'painkiller',
  manufacturer: 'ABC Pharma',
  dosesPerDay: 3,
  durationDays: 7,
  reminderTimes: ['08:00', '14:00', '20:00'],
  confidence: 0.85,
  rawText: 'OCR extracted text...',
  instructions: 'Take after meals'
}

describe('useOCRProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useOCRProcessing())

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.extractedData).toBe(null)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBe(0)
    })
  })

  describe('processFile', () => {
    it('should successfully process a file and extract data', async () => {
      const mockResponse = {
        success: true,
        extractedInfo: mockExtractedData,
        message: 'Success'
      }
      
      mockMedicineApi.uploadAndExtractMedicine.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useOCRProcessing())
      const file = createMockFile('prescription.pdf', 1024, 'application/pdf')

      let processPromise: Promise<any>
      
      act(() => {
        processPromise = result.current.processFile(file)
      })

      // Check processing state
      expect(result.current.isProcessing).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBe(0)

      // Fast-forward timers to simulate progress
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Wait for the API call to complete
      await act(async () => {
        const extractedData = await processPromise!
        expect(extractedData).toEqual(mockExtractedData)
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.extractedData).toEqual(mockExtractedData)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBe(100)
    })

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error - please check your connection')
      mockMedicineApi.uploadAndExtractMedicine.mockRejectedValue(mockError)

      const { result } = renderHook(() => useOCRProcessing())
      const file = createMockFile('prescription.pdf', 1024, 'application/pdf')

      let processPromise: Promise<any>
      
      act(() => {
        processPromise = result.current.processFile(file)
      })

      await act(async () => {
        const extractedData = await processPromise!
        expect(extractedData).toBe(null)
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.extractedData).toBe(null)
      expect(result.current.error).toBe('Network error. Please check your connection and try again.')
      expect(result.current.progress).toBe(0)
    })

    it('should handle unsuccessful API responses', async () => {
      const mockResponse = {
        success: false,
        extractedInfo: null,
        message: 'Failed to process image',
        error: 'Low quality image'
      }
      
      mockMedicineApi.uploadAndExtractMedicine.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useOCRProcessing())
      const file = createMockFile('prescription.pdf', 1024, 'application/pdf')

      let processPromise: Promise<any>
      
      act(() => {
        processPromise = result.current.processFile(file)
      })

      await act(async () => {
        const extractedData = await processPromise!
        expect(extractedData).toBe(null)
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBe('Low quality image')
    })

    it('should handle timeout scenarios', async () => {
      // Mock a long-running API call
      mockMedicineApi.uploadAndExtractMedicine.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 70000)) // 70 seconds
      )

      const { result } = renderHook(() => useOCRProcessing())
      const file = createMockFile('prescription.pdf', 1024, 'application/pdf')

      act(() => {
        result.current.processFile(file)
      })

      expect(result.current.isProcessing).toBe(true)

      // Fast-forward past the timeout
      act(() => {
        jest.advanceTimersByTime(61000) // 61 seconds
      })

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
        expect(result.current.error).toContain('timed out')
      })
    })

    it('should handle different error types with appropriate messages', async () => {
      const errorScenarios = [
        {
          error: new Error('HTTP error! status: 401'),
          expectedMessage: 'Authentication error. Please log in again.'
        },
        {
          error: new Error('HTTP error! status: 413'),
          expectedMessage: 'File is too large. Please use a smaller file or compress the image.'
        },
        {
          error: new Error('HTTP error! status: 415'),
          expectedMessage: 'Unsupported file format. Please use PDF, JPG, or PNG files.'
        },
        {
          error: new Error('HTTP error! status: 503'),
          expectedMessage: 'OCR service temporarily unavailable. You can enter the information manually.'
        }
      ]

      for (const scenario of errorScenarios) {
        mockMedicineApi.uploadAndExtractMedicine.mockRejectedValue(scenario.error)

        const { result } = renderHook(() => useOCRProcessing())
        const file = createMockFile('prescription.pdf', 1024, 'application/pdf')

        await act(async () => {
          await result.current.processFile(file)
        })

        expect(result.current.error).toBe(scenario.expectedMessage)
      }
    })
  })

  describe('retry', () => {
    it('should reset error state and retry processing', async () => {
      const mockResponse = {
        success: true,
        extractedInfo: mockExtractedData,
        message: 'Success'
      }

      // First call fails, second succeeds
      mockMedicineApi.uploadAndExtractMedicine
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useOCRProcessing())
      const file = createMockFile('prescription.pdf', 1024, 'application/pdf')

      // First attempt fails
      await act(async () => {
        await result.current.processFile(file)
      })

      expect(result.current.error).toBeTruthy()

      // Retry succeeds
      await act(async () => {
        const extractedData = await result.current.retry(file)
        expect(extractedData).toEqual(mockExtractedData)
      })

      expect(result.current.error).toBe(null)
      expect(result.current.extractedData).toEqual(mockExtractedData)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const mockResponse = {
        success: true,
        extractedInfo: mockExtractedData,
        message: 'Success'
      }
      
      mockMedicineApi.uploadAndExtractMedicine.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useOCRProcessing())
      const file = createMockFile('prescription.pdf', 1024, 'application/pdf')

      // Process a file first
      await act(async () => {
        await result.current.processFile(file)
      })

      expect(result.current.extractedData).toEqual(mockExtractedData)

      // Reset state
      act(() => {
        result.current.reset()
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.extractedData).toBe(null)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBe(0)
    })
  })

  describe('setError', () => {
    it('should set error and stop processing', () => {
      const { result } = renderHook(() => useOCRProcessing())

      act(() => {
        result.current.setError('Custom error message')
      })

      expect(result.current.error).toBe('Custom error message')
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.progress).toBe(0)
    })
  })
})