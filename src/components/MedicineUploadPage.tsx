import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Eye, AlertTriangle, FileText, Pill } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { FileUploadZone } from './FileUploadZone'
import { OCRProcessingIndicator } from './OCRProcessingIndicator'
import { OCRResultsDisplay } from './OCRResultsDisplay'
import { EnhancedMedicineForm } from './EnhancedMedicineForm'
import { useFileUpload } from '../hooks/useFileUpload'
import { useOCRProcessing } from '../hooks/useOCRProcessing'
import { medicineApi, type MedicineRequest, type ExtractedMedicineData } from '../services/medicineApi'
import { type FileMetadata } from '../utils/fileValidation'
import { cn } from '../lib/utils'

type UploadStep = 'upload' | 'processing' | 'results' | 'review'

interface StepIndicatorProps {
  currentStep: UploadStep
  className?: string
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, className }) => {
  const steps = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'processing', label: 'Processing', icon: FileText },
    { key: 'results', label: 'Results', icon: Eye },
    { key: 'review', label: 'Review', icon: Pill }
  ]

  const getStepIndex = (step: UploadStep) => steps.findIndex(s => s.key === step)
  const currentIndex = getStepIndex(currentStep)

  return (
    <div className={cn('flex items-center justify-center space-x-4 mb-8', className)}>
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = index === currentIndex
        const isCompleted = index < currentIndex
        const isUpcoming = index > currentIndex

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isActive && 'bg-healthcare-blue border-healthcare-blue text-white scale-110',
                  isCompleted && 'bg-healthcare-green border-healthcare-green text-white',
                  isUpcoming && 'border-muted-foreground text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium transition-colors duration-300',
                  isActive && 'text-healthcare-blue',
                  isCompleted && 'text-healthcare-green',
                  isUpcoming && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-16 h-0.5 mx-4 transition-colors duration-300',
                  index < currentIndex ? 'bg-healthcare-green' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export const MedicineUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload')
  const [extractedData, setExtractedData] = useState<ExtractedMedicineData | null>(null)

  // File upload state
  const {
    selectedFile,
    fileMetadata,
    selectFile,
    removeFile,
    error: fileError,
    setError: setFileError,
    validateAndSelectFile
  } = useFileUpload()

  // OCR processing state
  const {
    isProcessing,
    error: ocrError,
    progress,
    processFile,
    retry,
    reset: resetOCR,
    setError: setOCRError
  } = useOCRProcessing()

  const handleFileSelect = useCallback(async (file: File, metadata: FileMetadata, preview?: string) => {
    const isValid = await validateAndSelectFile(file)
    if (!isValid) return

    selectFile(file, metadata, preview)
    setFileError(null)
  }, [validateAndSelectFile, selectFile, setFileError])

  const handleFileRemove = useCallback(() => {
    removeFile()
    setCurrentStep('upload')
    setExtractedData(null)
    resetOCR()
  }, [removeFile, resetOCR])

  const handleStartProcessing = useCallback(async () => {
    if (!selectedFile) return

    setCurrentStep('processing')
    setOCRError(null)

    try {
      const result = await processFile(selectedFile)
      if (result) {
        setExtractedData(result)
        setCurrentStep('results')
      } else {
        setCurrentStep('upload')
      }
    } catch (error) {
      console.error('OCR processing failed:', error)
      setCurrentStep('upload')
    }
  }, [selectedFile, processFile, setOCRError])

  const handleRetryProcessing = useCallback(async () => {
    if (!selectedFile) return

    setCurrentStep('processing')
    setOCRError(null)

    try {
      const result = await retry(selectedFile)
      if (result) {
        setExtractedData(result)
        setCurrentStep('results')
      } else {
        setCurrentStep('upload')
      }
    } catch (error) {
      console.error('OCR retry failed:', error)
      setCurrentStep('upload')
    }
  }, [selectedFile, retry, setOCRError])

  const handleProceedToReview = useCallback(() => {
    setCurrentStep('review')
  }, [])

  const handleManualEntry = useCallback(() => {
    setExtractedData(null)
    setCurrentStep('review')
  }, [])

  const handleMedicineSubmit = useCallback(async (medicineData: MedicineRequest) => {
    try {
      const createdMedicine = await medicineApi.createMedicineFromOCR(medicineData)
      
      // ✅ Clean up any automatic reminders created by backend
      if (createdMedicine.id) {
        try {
          console.log('🧹 Checking for automatic reminders created by backend...')
          const automaticReminders = await medicineApi.getMedicineReminders(createdMedicine.id)
          
          if (automaticReminders.length > 0) {
            console.log(`🗑️ Found ${automaticReminders.length} automatic reminders, deleting them...`)
            
            // Delete all automatic reminders
            for (const reminder of automaticReminders) {
              if (reminder.id) {
                await medicineApi.deleteReminder(reminder.id)
                console.log(`✅ Deleted automatic reminder: ${reminder.reminderTime}`)
              }
            }
            
            console.log('✅ All automatic reminders cleaned up successfully')
          }
        } catch (reminderError) {
          console.error('⚠️ Error cleaning up automatic reminders:', reminderError)
          // Don't fail the whole operation
        }
      }
      
      navigate('/medicines', {
        state: {
          message: 'Medicine added successfully from prescription upload! Set custom reminder times in the Reminders section if needed.',
          type: 'success'
        }
      })
    } catch (error) {
      console.error('Failed to create medicine:', error)
      throw error
    }
  }, [navigate])

  const handleCancel = useCallback(() => {
    navigate('/medicines')
  }, [navigate])

  const handleBackToUpload = useCallback(() => {
    setCurrentStep('upload')
    setExtractedData(null)
    resetOCR()
  }, [resetOCR])

  const handleBackToResults = useCallback(() => {
    setCurrentStep('results')
  }, [])

  // Auto-start processing when file is selected
  useEffect(() => {
    if (selectedFile && currentStep === 'upload' && !isProcessing) {
      handleStartProcessing()
    }
  }, [selectedFile, currentStep, isProcessing, handleStartProcessing])

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Upload Your Prescription</h2>
              <p className="text-muted-foreground">
                Upload a photo or PDF of your prescription to automatically extract medicine information
              </p>
            </div>

            <FileUploadZone
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              error={fileError || ocrError || undefined}
            />

            {selectedFile && !isProcessing && (
              <div className="flex justify-center">
                <Button
                  onClick={handleStartProcessing}
                  variant="healthcare"
                  size="lg"
                  className="min-w-48"
                >
                  Process Prescription
                </Button>
              </div>
            )}
          </div>
        )

      case 'processing':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Processing Your Prescription</h2>
              <p className="text-muted-foreground">
                Our AI is extracting medicine information from your prescription...
              </p>
            </div>

            <OCRProcessingIndicator
              isProcessing={isProcessing}
              progress={progress}
              error={ocrError}
              fileName={fileMetadata?.name}
            />

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleBackToUpload}
                disabled={isProcessing}
              >
                Cancel Processing
              </Button>
            </div>
          </div>
        )

      case 'results':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Extraction Results</h2>
              <p className="text-muted-foreground">
                Review the extracted information and proceed to edit if needed
              </p>
            </div>

            {extractedData && (
              <OCRResultsDisplay
                extractedData={extractedData}
                onProceedToReview={handleProceedToReview}
                onRetry={handleRetryProcessing}
                onManualEntry={handleManualEntry}
              />
            )}

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleBackToUpload}
              >
                Upload Different File
              </Button>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Review & Save Medicine</h2>
              <p className="text-muted-foreground">
                {extractedData
                  ? 'Review and edit the extracted information before saving'
                  : 'Enter your medicine information manually'
                }
              </p>
            </div>

            <EnhancedMedicineForm
              extractedData={extractedData}
              onSubmit={handleMedicineSubmit}
              onCancel={handleCancel}
              showAutoFillIndicators={!!extractedData}
            />

            <div className="flex justify-center gap-4">
              {extractedData && (
                <Button
                  variant="outline"
                  onClick={handleBackToResults}
                >
                  Back to Results
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleBackToUpload}
              >
                Upload Different File
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/medicines')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">OCR Medicine Upload</h1>
            <p className="text-muted-foreground">Digitize your prescriptions with AI</p>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Main Content */}
        <Card className="p-8">
          {renderStepContent()}
        </Card>

        {/* Error Boundary */}
        {(fileError || ocrError) && currentStep !== 'upload' && (
          <Card className="mt-6 p-4 border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <p className="text-destructive font-medium">
                {fileError || ocrError}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}