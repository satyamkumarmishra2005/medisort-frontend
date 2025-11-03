import React, { useState, useEffect } from 'react'
import { NotificationReminder, notificationService } from '../services/notificationService'

interface InAppNotificationProps {
  reminder: NotificationReminder
  onTaken: (reminderId: number) => void
  onDismiss: (reminderId: number) => void
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({
  reminder,
  onTaken,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMarkAsTaken = async () => {
    setIsProcessing(true)
    try {
      const success = await notificationService.markReminderAsTaken(reminder.id)
      if (success) {
        onTaken(reminder.id)
        setIsVisible(false)
      }
    } catch (error) {
      console.error('Error marking reminder as taken:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismiss = () => {
    notificationService.dismissNotification(reminder.id)
    onDismiss(reminder.id)
    setIsVisible(false)
  }

  const getNotificationStyle = () => {
    switch (reminder.type) {
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'due':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'upcoming':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (reminder.type) {
      case 'overdue':
        return '🚨'
      case 'due':
        return '💊'
      case 'upcoming':
        return '⏰'
      default:
        return '💊'
    }
  }

  const getTimeDisplay = () => {
    const time = new Date(reminder.scheduledFor).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    switch (reminder.type) {
      case 'overdue':
        return `Due at ${time}`
      case 'due':
        return 'Due now'
      case 'upcoming':
        return `Due at ${time}`
      default:
        return time
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${getNotificationStyle()} animate-slide-in`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getIcon()}</span>
          </div>
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-semibold">
              {reminder.type === 'overdue' ? 'Overdue Reminder' : 
               reminder.type === 'due' ? 'Medicine Time!' : 
               'Upcoming Reminder'}
            </h4>
            <p className="text-sm mt-1">
              <strong>{reminder.medicineName}</strong> ({reminder.dosage})
            </p>
            <p className="text-xs mt-1 opacity-75">
              {getTimeDisplay()}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleMarkAsTaken}
            disabled={isProcessing}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Mark as Taken'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}