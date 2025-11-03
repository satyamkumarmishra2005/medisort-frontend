import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OCRResultsDisplay } from '../OCRResultsDisplay'
import { type ExtractedMedicineData } from '../../services/medicineApi'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Pill: () => <div data-testid="pill-icon" />
}))

const mockHighConfidenceData: ExtractedMedicineData = {
  name: 'Paracetamol',
  dosage: '500mg',
  category: 'painkiller',
  manufacturer: 'ABC Pharma',
  dosesPerDay: 3,
  durationDays: 7,
  reminderTimes: ['08:00', '14:00', '20:00'],
  confidence: 0.92,
  rawText: 'Paracetamol 500mg\nTake 3 times daily\nDuration: 7 days',
  instructions: 'Take after meals'
}

const mockMediumConfidenceData: ExtractedMedicineData = {
  name: 'Aspirin',
  dosage: '100mg',
  category: '',
  manufacturer: '',
  dosesPerDay: 1,
  durationDays: 0,
  reminderTimes: ['09:00'],
  confidence: 0.75,
  rawText: 'Aspirin 100mg daily',
  instructions: ''
}

const mockLowConfidenceData: ExtractedMedicineData = {
  name: '',
  dosage: '250mg',
  category: '',
  manufacturer: '',
  dosesPerDay: 0,
  durationDays: 0,
  reminderTimes: [],
  confidence: 0.45,
  rawText: 'Unclear prescription text...',
  instructions: ''
}

describe('OCRResultsDisplay', () => {
  const mockOnProceedToReview = jest.fn()
  const mockOnRetry = jest.fn()
  const mockOnManualEntry = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('High Confidence Results', () => {
    it('should display high confidence results correctly', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByText('OCR Extraction Results')).toBeInTheDocument()
      expect(screen.getByText('92%')).toBeInTheDocument()
      expect(screen.getByText('High confidence - Data looks accurate')).toBeInTheDocument()
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    })

    it('should show extracted fields for high confidence data', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByText('Paracetamol')).toBeInTheDocument()
      expect(screen.getByText('500mg')).toBeInTheDocument()
      expect(screen.getByText('painkiller')).toBeInTheDocument()
      expect(screen.getByText('ABC Pharma')).toBeInTheDocument()
      expect(screen.getByText('Take after meals')).toBeInTheDocument()
    })

    it('should display reminder times', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByText('Reminder Times (3)')).toBeInTheDocument()
      expect(screen.getByText('08:00')).toBeInTheDocument()
      expect(screen.getByText('14:00')).toBeInTheDocument()
      expect(screen.getByText('20:00')).toBeInTheDocument()
    })

    it('should show correct field counts', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      // All fields are filled in high confidence data
      expect(screen.getByText('Extracted Fields (7)')).toBeInTheDocument()
      expect(screen.getByText('Missing Fields (0)')).toBeInTheDocument()
    })
  })

  describe('Medium Confidence Results', () => {
    it('should display medium confidence results with warning', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockMediumConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('Medium confidence - Please review carefully')).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('should show missing fields for medium confidence data', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockMediumConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByText('Missing Fields')).toBeInTheDocument()
      expect(screen.getByText('Not detected - you can add this manually')).toBeInTheDocument()
    })
  })

  describe('Low Confidence Results', () => {
    it('should display low confidence results with error styling', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockLowConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('Low confidence - Manual review recommended')).toBeInTheDocument()
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
    })

    it('should show low confidence warning', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockLowConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByText('Low Confidence Detection')).toBeInTheDocument()
      expect(screen.getByText(/The OCR system had difficulty reading/)).toBeInTheDocument()
      expect(screen.getByText(/Ensure the image is well-lit/)).toBeInTheDocument()
    })
  })

  describe('Raw OCR Text', () => {
    it('should toggle raw OCR text visibility', async () => {
      const user = userEvent.setup()

      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      // Initially hidden
      expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument()

      // Click to show
      const viewButton = screen.getByRole('button', { name: /view/i })
      await user.click(viewButton)

      expect(screen.getByText(/Paracetamol 500mg/)).toBeInTheDocument()

      // Click to hide
      const hideButton = screen.getByRole('button', { name: /hide/i })
      await user.click(hideButton)

      expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument()
    })

    it('should handle empty raw text', async () => {
      const user = userEvent.setup()
      const dataWithoutRawText = { ...mockHighConfidenceData, rawText: '' }

      render(
        <OCRResultsDisplay
          extractedData={dataWithoutRawText}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      const viewButton = screen.getByRole('button', { name: /view/i })
      await user.click(viewButton)

      expect(screen.getByText('No raw text available')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should call onProceedToReview when proceed button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      const proceedButton = screen.getByRole('button', { name: /proceed to review/i })
      await user.click(proceedButton)

      expect(mockOnProceedToReview).toHaveBeenCalled()
    })

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      const retryButton = screen.getByRole('button', { name: /try different file/i })
      await user.click(retryButton)

      expect(mockOnRetry).toHaveBeenCalled()
    })

    it('should call onManualEntry when manual entry button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <OCRResultsDisplay
          extractedData={mockHighConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      const manualButton = screen.getByRole('button', { name: /manual entry instead/i })
      await user.click(manualButton)

      expect(mockOnManualEntry).toHaveBeenCalled()
    })

    it('should show different button text for low confidence', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockLowConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.getByRole('button', { name: /review & edit/i })).toBeInTheDocument()
    })
  })

  describe('Field Categorization', () => {
    it('should correctly categorize filled and empty fields', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockMediumConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      // Should show filled fields
      expect(screen.getByText('Aspirin')).toBeInTheDocument()
      expect(screen.getByText('100mg')).toBeInTheDocument()

      // Should show missing fields section
      expect(screen.getByText('Missing Fields')).toBeInTheDocument()
    })

    it('should handle empty reminder times array', () => {
      render(
        <OCRResultsDisplay
          extractedData={mockLowConfidenceData}
          onProceedToReview={mockOnProceedToReview}
          onRetry={mockOnRetry}
          onManualEntry={mockOnManualEntry}
        />
      )

      expect(screen.queryByText('Reminder Times')).not.toBeInTheDocument()
    })
  })
})