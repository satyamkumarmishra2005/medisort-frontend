import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  EyeOff, 
  ArrowRight,
  FileText,
  Pill
} from 'lucide-react'
import { cn } from '../lib/utils'
import { type ExtractedMedicineData } from '../services/medicineApi'

interface OCRResultsDisplayProps {
  extractedData: ExtractedMedicineData
  onProceedToReview: () => void
  onRetry: () => void
  onManualEntry: () => void
  className?: string
}

export const OCRResultsDisplay: React.FC<OCRResultsDisplayProps> = ({
  extractedData,
  onProceedToReview,
  onRetry,
  onManualEntry,
  className
}) => {
  const [showRawText, setShowRawText] = useState(false)

  const confidence = extractedData.confidence * 100 // Convert to percentage
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 85) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (confidence >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }



  const getConfidenceMessage = (confidence: number) => {
    if (confidence >= 85) return 'High confidence - Data looks accurate'
    if (confidence >= 70) return 'Medium confidence - Please review carefully'
    return 'Low confidence - Manual review recommended'
  }

  const extractedFields = [
    { label: 'Medicine Name', value: extractedData.name, key: 'name' },
    { label: 'Dosage', value: extractedData.dosage, key: 'dosage' },
    { label: 'Category', value: extractedData.category, key: 'category' },
    { label: 'Manufacturer', value: extractedData.manufacturer, key: 'manufacturer' },
    { label: 'Doses Per Day', value: extractedData.dosesPerDay?.toString(), key: 'dosesPerDay' },
    { label: 'Duration (Days)', value: extractedData.durationDays?.toString(), key: 'durationDays' },
    { label: 'Instructions', value: extractedData.instructions, key: 'instructions' }
  ]

  const filledFields = extractedFields.filter(field => field.value && field.value.trim() !== '')
  const emptyFields = extractedFields.filter(field => !field.value || field.value.trim() === '')

  return (
    <div className={cn('space-y-6', className)}>
      {/* Confidence Score Header */}
      <Card className={cn(
        'border-2 transition-all duration-300',
        confidence >= 85 && 'border-green-200 bg-green-50/50',
        confidence >= 70 && confidence < 85 && 'border-yellow-200 bg-yellow-50/50',
        confidence < 70 && 'border-red-200 bg-red-50/50'
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-healthcare-blue/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-healthcare-blue" />
              </div>
              OCR Extraction Results
            </CardTitle>
            {getConfidenceIcon(confidence)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Confidence Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Confidence Score</span>
              <span className={cn('text-lg font-bold', getConfidenceColor(confidence))}>
                {Math.round(confidence)}%
              </span>
            </div>
            
            <Progress 
              value={confidence} 
              className="h-3"
              variant={confidence >= 70 ? 'default' : 'danger'}
            />
            
            <div className="flex items-center gap-2">
              {getConfidenceIcon(confidence)}
              <span className={cn('text-sm', getConfidenceColor(confidence))}>
                {getConfidenceMessage(confidence)}
              </span>
            </div>
          </div>

          {/* Extraction Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{filledFields.length}</div>
              <div className="text-sm text-muted-foreground">Fields Extracted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{emptyFields.length}</div>
              <div className="text-sm text-muted-foreground">Fields Missing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extracted Information
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filled Fields */}
          {filledFields.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Extracted Fields ({filledFields.length})
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filledFields.map((field) => (
                  <div 
                    key={field.key}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="text-xs font-medium text-green-800 mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm text-green-900 font-medium">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminder Times */}
          {extractedData.reminderTimes && extractedData.reminderTimes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Reminder Times ({extractedData.reminderTimes.length})
              </h4>
              
              <div className="flex flex-wrap gap-2">
                {extractedData.reminderTimes.map((time, index) => (
                  <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Empty Fields */}
          {emptyFields.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Missing Fields ({emptyFields.length})
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emptyFields.map((field) => (
                  <div 
                    key={field.key}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="text-xs font-medium text-yellow-800 mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm text-yellow-700 italic">
                      Not detected - you can add this manually
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw OCR Text */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Raw OCR Text
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center gap-2"
            >
              {showRawText ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  View
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {showRawText && (
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                {extractedData.rawText || 'No raw text available'}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button
          onClick={onProceedToReview}
          className="flex items-center gap-2"
          size="lg"
          variant={confidence >= 70 ? 'healthcare' : 'healthcare-outline'}
        >
          <ArrowRight className="w-4 h-4" />
          {confidence >= 70 ? 'Proceed to Review' : 'Review & Edit'}
        </Button>
        
        <Button
          variant="outline"
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Try Different File
        </Button>
        
        <Button
          variant="ghost"
          onClick={onManualEntry}
          className="flex items-center gap-2"
        >
          Manual Entry Instead
        </Button>
      </div>

      {/* Warning for Low Confidence */}
      {confidence < 70 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-yellow-800">
                  Low Confidence Detection
                </h4>
                <p className="text-sm text-yellow-700">
                  The OCR system had difficulty reading your prescription. Please carefully review 
                  all extracted information in the next step, or consider uploading a clearer image.
                </p>
                <div className="text-xs text-yellow-600 space-y-1">
                  <p>• Ensure the image is well-lit and in focus</p>
                  <p>• Avoid shadows or glare on the prescription</p>
                  <p>• Try a higher resolution image if available</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}