import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Plus, X, Clock, Sparkles, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'

interface ReminderTimeManagerProps {
  reminderTimes: string[]
  dosesPerDay: number
  onChange: (times: string[]) => void
  autoFilled?: boolean
  className?: string
}

export const ReminderTimeManager: React.FC<ReminderTimeManagerProps> = ({
  reminderTimes,
  dosesPerDay,
  onChange,
  autoFilled = false,
  className
}) => {
  const [times, setTimes] = useState<string[]>(reminderTimes)
  const [errors, setErrors] = useState<Record<number, string>>({})

  // Update local state when props change
  useEffect(() => {
    setTimes(reminderTimes)
  }, [reminderTimes])

  // Auto-generate reminder times based on dosesPerDay if none exist
  useEffect(() => {
    if (dosesPerDay > 0 && times.length === 0 && !autoFilled) {
      const generatedTimes = generateDefaultReminderTimes(dosesPerDay)
      setTimes(generatedTimes)
      onChange(generatedTimes)
    }
  }, [dosesPerDay, times.length, autoFilled, onChange])

  const generateDefaultReminderTimes = (doses: number): string[] => {
    const defaultTimes: string[] = []
    
    switch (doses) {
      case 1:
        defaultTimes.push('09:00')
        break
      case 2:
        defaultTimes.push('09:00', '21:00')
        break
      case 3:
        defaultTimes.push('08:00', '14:00', '20:00')
        break
      case 4:
        defaultTimes.push('08:00', '12:00', '16:00', '20:00')
        break
      default:
        // For more than 4 doses, distribute evenly throughout the day
        const interval = Math.floor(24 / doses)
        let startHour = 8
        for (let i = 0; i < doses; i++) {
          const hour = (startHour + (i * interval)) % 24
          defaultTimes.push(`${hour.toString().padStart(2, '0')}:00`)
        }
    }
    
    return defaultTimes
  }

  const validateTime = (time: string): string | null => {
    if (!time) return 'Time is required'
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(time)) {
      return 'Please enter time in HH:MM format (e.g., 09:30)'
    }
    
    return null
  }

  const validateAllTimes = (timeList: string[]): Record<number, string> => {
    const newErrors: Record<number, string> = {}
    const uniqueTimes = new Set<string>()
    
    timeList.forEach((time, index) => {
      const error = validateTime(time)
      if (error) {
        newErrors[index] = error
      } else if (uniqueTimes.has(time)) {
        newErrors[index] = 'Duplicate time - each reminder must be unique'
      } else {
        uniqueTimes.add(time)
      }
    })
    
    return newErrors
  }

  const handleTimeChange = useCallback((index: number, value: string) => {
    const newTimes = [...times]
    newTimes[index] = value
    setTimes(newTimes)
    
    // Validate and update errors
    const newErrors = validateAllTimes(newTimes)
    setErrors(newErrors)
    
    // Only call onChange if there are no errors
    if (Object.keys(newErrors).length === 0) {
      onChange(newTimes)
    }
  }, [times, onChange])

  const handleAddTime = useCallback(() => {
    const newTimes = [...times, '']
    setTimes(newTimes)
  }, [times])

  const handleRemoveTime = useCallback((index: number) => {
    const newTimes = times.filter((_, i) => i !== index)
    setTimes(newTimes)
    
    // Clear errors for removed index and revalidate
    const newErrors = validateAllTimes(newTimes)
    setErrors(newErrors)
    
    onChange(newTimes)
  }, [times, onChange, validateAllTimes])

  const handleGenerateOptimal = useCallback(() => {
    if (dosesPerDay > 0) {
      const optimalTimes = generateDefaultReminderTimes(dosesPerDay)
      setTimes(optimalTimes)
      setErrors({})
      onChange(optimalTimes)
    }
  }, [dosesPerDay, onChange, validateAllTimes])

  const sortTimes = useCallback(() => {
    const sortedTimes = [...times].sort((a, b) => {
      const timeA = a.split(':').map(Number)
      const timeB = b.split(':').map(Number)
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
    })
    setTimes(sortedTimes)
    onChange(sortedTimes)
  }, [times, onChange])

  const formatTimeDisplay = (time: string): string => {
    if (!time) return ''
    try {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return time
    }
  }

  const hasErrors = Object.keys(errors).length > 0
  const timesCount = times.filter(t => t.trim()).length
  const expectedCount = dosesPerDay || 0

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-healthcare-blue" />
            <h4 className="text-sm font-semibold text-foreground">Reminder Times</h4>
            {autoFilled && (
              <Badge variant="default" className="bg-healthcare-blue/10 text-healthcare-blue text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Auto-filled
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {dosesPerDay > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateOptimal}
                className="text-xs"
              >
                Generate Optimal
              </Button>
            )}
            {times.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={sortTimes}
                className="text-xs"
              >
                Sort Times
              </Button>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {timesCount} of {expectedCount} reminder{expectedCount !== 1 ? 's' : ''} set
            </span>
            {timesCount !== expectedCount && expectedCount > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Mismatch with doses per day</span>
              </div>
            )}
          </div>
          {hasErrors && (
            <span className="text-red-500">Please fix errors below</span>
          )}
        </div>

        {/* Time Inputs */}
        <div className="space-y-3">
          {times.map((time, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className={cn(
                      'text-sm',
                      errors[index] && 'border-red-500',
                      autoFilled && !errors[index] && 'border-healthcare-blue bg-healthcare-blue/5'
                    )}
                    placeholder="HH:MM"
                  />
                  {time && (
                    <span className="text-xs text-muted-foreground min-w-[60px]">
                      {formatTimeDisplay(time)}
                    </span>
                  )}
                </div>
                {errors[index] && (
                  <p className="text-red-500 text-xs mt-1">{errors[index]}</p>
                )}
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveTime(index)}
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Time Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTime}
          className="w-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Reminder Time
        </Button>

        {/* Suggestions */}
        {dosesPerDay > 0 && timesCount === 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <h5 className="text-xs font-medium text-foreground mb-2">Suggested Times:</h5>
            <div className="flex flex-wrap gap-2">
              {generateDefaultReminderTimes(dosesPerDay).map((suggestedTime, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newTimes = [...times]
                    if (newTimes.length <= index) {
                      newTimes.push(suggestedTime)
                    } else {
                      newTimes[index] = suggestedTime
                    }
                    setTimes(newTimes)
                    onChange(newTimes)
                  }}
                  className="text-xs h-6 px-2"
                >
                  {formatTimeDisplay(suggestedTime)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-muted/30 rounded-lg p-3">
          <h5 className="text-xs font-medium text-foreground mb-1">Tips:</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Set reminders to match your daily routine</li>
            <li>• Space doses evenly throughout the day when possible</li>
            <li>• Consider meal times if medication should be taken with food</li>
            {dosesPerDay > 0 && (
              <li>• You need {dosesPerDay} reminder{dosesPerDay !== 1 ? 's' : ''} for {dosesPerDay} dose{dosesPerDay !== 1 ? 's' : ''} per day</li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  )
}