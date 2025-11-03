import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, Pill, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

export interface ReminderData {
  id: number
  medicineId: number
  medicineName: string
  dosage: string
  reminderTime: string
  type: 'upcoming' | 'due' | 'overdue'
  isOverdue?: boolean
  scheduledFor: Date
}

interface ReminderPopupProps {
  reminder: ReminderData
  onTaken: (reminderId: number) => Promise<void>
  onSkip: (reminderId: number) => void
  onDismiss: (reminderId: number) => void
  className?: string
}

export const ReminderPopup: React.FC<ReminderPopupProps> = ({
  reminder,
  onTaken,
  onSkip,
  onDismiss,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionTaken, setActionTaken] = useState<'taken' | 'skipped' | null>(null)

  const handleTaken = async () => {
    try {
      setIsProcessing(true)
      await onTaken(reminder.id)
      setActionTaken('taken')
      
      // Auto-dismiss after 2 seconds
      setTimeout(() => {
        onDismiss(reminder.id)
      }, 2000)
    } catch (error) {
      console.error('Failed to mark reminder as taken:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkip = () => {
    setActionTaken('skipped')
    onSkip(reminder.id)
    
    // Auto-dismiss after 1 second
    setTimeout(() => {
      onDismiss(reminder.id)
    }, 1000)
  }

  const getTimeDisplay = () => {
    const now = new Date()
    const reminderTime = new Date(reminder.scheduledFor)
    const diffMinutes = Math.floor((now.getTime() - reminderTime.getTime()) / (1000 * 60))
    
    if (diffMinutes > 0) {
      return `${diffMinutes} minutes overdue`
    } else if (diffMinutes > -5) {
      return 'Due now'
    } else {
      return `Due in ${Math.abs(diffMinutes)} minutes`
    }
  }

  const getVariantStyles = () => {
    switch (reminder.type) {
      case 'overdue':
        return {
          cardClass: 'border-red-500 bg-red-50',
          badgeVariant: 'destructive' as const,
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />
        }
      case 'due':
        return {
          cardClass: 'border-yellow-500 bg-yellow-50',
          badgeVariant: 'warning' as const,
          icon: <Clock className="w-5 h-5 text-yellow-600" />
        }
      case 'upcoming':
        return {
          cardClass: 'border-blue-500 bg-blue-50',
          badgeVariant: 'secondary' as const,
          icon: <Clock className="w-5 h-5 text-blue-500" />
        }
      default:
        return {
          cardClass: 'border-border bg-background',
          badgeVariant: 'secondary' as const,
          icon: <Pill className="w-5 h-5 text-primary" />
        }
    }
  }

  const { cardClass, badgeVariant, icon } = getVariantStyles()

  // Show success state
  if (actionTaken === 'taken') {
    return (
      <Card className={`p-4 border-green-500 bg-green-50 ${className}`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Medicine Taken!</p>
            <p className="text-sm text-green-600">{reminder.medicineName}</p>
          </div>
        </div>
      </Card>
    )
  }

  // Show skipped state
  if (actionTaken === 'skipped') {
    return (
      <Card className={`p-4 border-gray-400 bg-gray-50 ${className}`}>
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-gray-600" />
          <div className="flex-1">
            <p className="font-medium text-gray-800">Reminder Skipped</p>
            <p className="text-sm text-gray-600">{reminder.medicineName}</p>
          </div>
        </div>
      </Card>
    )
  }

  // Main reminder display
  return (
    <Card className={`p-4 ${cardClass} ${className} animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-foreground">{reminder.medicineName}</h3>
              <p className="text-sm text-muted-foreground">{reminder.dosage}</p>
            </div>
            <Badge variant={badgeVariant} className="ml-2">
              {reminder.type}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {getTimeDisplay()}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleTaken}
              disabled={isProcessing}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Taken
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSkip}
              disabled={isProcessing}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Skip
            </Button>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(reminder.id)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          disabled={isProcessing}
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </Card>
  )
}