import { useState, useCallback } from 'react'
import { medicineApi, type ExtractedMedicineData, type OCRApiResponse } from '../services/medicineApi'

interface OCRProcessingState {
  isProcessing: boolean
  extractedData: ExtractedMedicineData | null
  error: string | null
  progress: number
  timeoutId: NodeJS.Timeout | null
}

interface OCRProcessingActions {
  processFile: (file: File) => Promise<ExtractedMedicineData | null>
  retry: (file: File) => Promise<ExtractedMedicineData | null>
  reset: () => void
  setError: (error: string | null) => void
}

const OCR_TIMEOUT_MS = 60000 // 60 seconds
const PROGRESS_INTERVAL_MS = 500 // Update progress every 500ms

export const useOCRProcessing = (): OCRProcessingState & OCRProcessingActions => {
  const [state, setState] = useState<OCRProcessingState>({
    isProcessing: false,
    extractedData: null,
    error: null,
    progress: 0,
    timeoutId: null
  })

  const simulateProgress = useCallback(() => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 // Random progress increments
      if (progress > 90) progress = 90 // Cap at 90% until completion
      
      setState(prev => ({ ...prev, progress }))
    }, PROGRESS_INTERVAL_MS)

    return interval
  }, [])

  const processFile = useCallback(async (file: File): Promise<ExtractedMedicineData | null> => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      progress: 0,
      extractedData: null
    }))

    // Start progress simulation
    const progressInterval = simulateProgress()

    // Set up timeout
    const timeoutId = setTimeout(() => {
      clearInterval(progressInterval)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'OCR processing timed out. Please try again or enter the information manually.',
        progress: 0
      }))
    }, OCR_TIMEOUT_MS)

    try {
      const response: OCRApiResponse = await medicineApi.uploadAndExtractMedicine(file)
      
      // Clear timeout and progress interval
      clearTimeout(timeoutId)
      clearInterval(progressInterval)

      if (response.success && response.extractedInfo) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          extractedData: response.extractedInfo,
          progress: 100,
          error: null
        }))
        
        return response.extractedInfo
      } else {
        const errorMessage = response.error || response.message || 'Failed to extract medicine information'
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
          progress: 0
        }))
        
        return null
      }
    } catch (error: any) {
      // Clear timeout and progress interval
      clearTimeout(timeoutId)
      clearInterval(progressInterval)

      let errorMessage = 'An unexpected error occurred during OCR processing'
      
      if (error.message) {
        if (error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'OCR processing timed out. Please try again or enter the information manually.'
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication error. Please log in again.'
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          errorMessage = 'File is too large. Please use a smaller file or compress the image.'
        } else if (error.message.includes('415') || error.message.includes('Unsupported')) {
          errorMessage = 'Unsupported file format. Please use PDF, JPG, or PNG files.'
        } else if (error.message.includes('503') || error.message.includes('unavailable')) {
          errorMessage = 'OCR service temporarily unavailable. You can enter the information manually.'
        } else {
          errorMessage = error.message
        }
      }

      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        progress: 0
      }))

      return null
    }
  }, [simulateProgress])

  const retry = useCallback(async (file: File): Promise<ExtractedMedicineData | null> => {
    // Reset state and try again
    setState(prev => ({
      ...prev,
      error: null,
      extractedData: null
    }))
    
    return processFile(file)
  }, [processFile])

  const reset = useCallback(() => {
    // Clear any existing timeout
    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
    }

    setState({
      isProcessing: false,
      extractedData: null,
      error: null,
      progress: 0,
      timeoutId: null
    })
  }, [state.timeoutId])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      isProcessing: false,
      progress: 0
    }))
  }, [])

  return {
    ...state,
    processFile,
    retry,
    reset,
    setError
  }
}