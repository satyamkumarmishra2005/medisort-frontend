import React from 'react'
import { Card } from './ui/card'
import { LoadingSpinner } from './ui/loading'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { AlertCircle, RefreshCw, FileText } from 'lucide-react'
import { cn } from '../lib/utils'

interface OCRProcessingIndicatorProps {
  isProcessing: boolean
  progress: number
  error: string | null
  fileName?: string
  onRetry?: () => void
  onCancel?: () => void
  onManualEntry?: () => void
  className?: string
}

export const OCRProcessingIndicator: React.FC<OCRProcessingIndicatorProps> = ({
  isProcessing,
  progress,
  error,
  fileName,
  onRetry,
  onCancel,
  onManualEntry,
  className
}) => {
  if (!isProcessing && !error) {
    return null
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-healthcare-blue/10 flex items-center justify-center">
              {isProcessing ? (
                <LoadingSpinner variant="healthcare" size="lg" />
              ) : error ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : (
                <FileText className="w-8 h-8 text-healthcare-blue" />
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isProcessing ? 'Processing Your Prescription' : 'Processing Failed'}
          </h3>
          
          {fileName && (
            <p className="text-sm text-muted-foreground mb-4">
              File: {fileName}
            </p>
          )}
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Extracting medicine information from your prescription...
              </p>
              <p className="text-xs text-muted-foreground">
                This may take up to 60 seconds
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
                variant="healthcare"
              />
            </div>

            {/* Processing Steps */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className={cn(
                'flex items-center gap-2 transition-opacity',
                progress > 10 ? 'opacity-100' : 'opacity-50'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  progress > 10 ? 'bg-healthcare-blue' : 'bg-muted'
                )} />
                <span>Uploading file...</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-2 transition-opacity',
                progress > 30 ? 'opacity-100' : 'opacity-50'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  progress > 30 ? 'bg-healthcare-blue' : 'bg-muted'
                )} />
                <span>Analyzing document...</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-2 transition-opacity',
                progress > 60 ? 'opacity-100' : 'opacity-50'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  progress > 60 ? 'bg-healthcare-blue' : 'bg-muted'
                )} />
                <span>Extracting medicine data...</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-2 transition-opacity',
                progress > 90 ? 'opacity-100' : 'opacity-50'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  progress > 90 ? 'bg-healthcare-blue' : 'bg-muted'
                )} />
                <span>Finalizing results...</span>
              </div>
            </div>

            {/* Cancel Button */}
            {onCancel && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                >
                  Cancel Processing
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && !isProcessing && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Don't worry! You can try again or enter the medicine information manually.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onRetry && (
                <Button
                  variant="healthcare-outline"
                  onClick={onRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              )}
              
              {onManualEntry && (
                <Button
                  variant="outline"
                  onClick={onManualEntry}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Enter Manually
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Tips for better results:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ensure the prescription is clearly visible and well-lit</li>
            <li>• Avoid shadows or glare on the document</li>
            <li>• Use high-resolution images when possible</li>
            <li>• Make sure all text is readable in the image</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}