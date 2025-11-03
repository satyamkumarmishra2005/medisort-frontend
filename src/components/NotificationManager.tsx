import React, { useState, useEffect } from 'react'
import { NotificationReminder } from '../services/notificationService'
import { InAppNotification } from './InAppNotification'
import { CustomReminderNotification } from './CustomReminderNotification'
import { RefillAlertNotification } from './RefillAlertNotification'
import { SimpleRefillAlert } from '../services/simpleRefillService'

interface CustomReminderNotificationData {
  id: number
  title: string
  time: string
  category: string
  notes?: string
  reminder: any
}

export const NotificationManager: React.FC = () => {
  const [activeNotifications, setActiveNotifications] = useState<NotificationReminder[]>([])
  const [activeCustomReminders, setActiveCustomReminders] = useState<CustomReminderNotificationData[]>([])
  const [activeRefillAlerts, setActiveRefillAlerts] = useState<SimpleRefillAlert[]>([])

  useEffect(() => {
    // Listen for new medicine notifications
    const handleNewNotification = (event: CustomEvent<NotificationReminder>) => {
      const reminder = event.detail
      
      // Check if notification already exists
      setActiveNotifications(prev => {
        const exists = prev.some(n => n.id === reminder.id)
        if (exists) {
          return prev
        }
        return [...prev, reminder]
      })
    }

    // Listen for new custom reminder notifications
    const handleCustomReminderNotification = (event: CustomEvent<CustomReminderNotificationData>) => {
      const reminder = event.detail
      
      console.log('📱 Received custom reminder notification:', reminder.title)
      
      // Check if notification already exists
      setActiveCustomReminders(prev => {
        const exists = prev.some(n => n.id === reminder.id)
        if (exists) {
          return prev
        }
        return [...prev, reminder]
      })
    }

    // Listen for new refill alert notifications
    const handleRefillAlertNotification = (event: CustomEvent<SimpleRefillAlert>) => {
      const alert = event.detail
      
      console.log('📦 Received refill alert notification:', alert.medicineName)
      
      // Check if notification already exists
      setActiveRefillAlerts(prev => {
        const exists = prev.some(n => n.id === alert.id)
        if (exists) {
          return prev
        }
        return [...prev, alert]
      })
    }

    // Listen for notification dismissals
    const handleNotificationDismissed = (event: CustomEvent<{ reminderId: number }>) => {
      const { reminderId } = event.detail
      setActiveNotifications(prev => prev.filter(n => n.id !== reminderId))
    }

    // Listen for reminders marked as taken
    const handleReminderTaken = (event: CustomEvent<{ reminderId: number }>) => {
      const { reminderId } = event.detail
      setActiveNotifications(prev => prev.filter(n => n.id !== reminderId))
    }

    // Add event listeners
    window.addEventListener('medicine-notification', handleNewNotification as EventListener)
    window.addEventListener('custom-reminder-notification', handleCustomReminderNotification as EventListener)
    window.addEventListener('refill-alert-notification', handleRefillAlertNotification as EventListener)
    window.addEventListener('notification-dismissed', handleNotificationDismissed as EventListener)
    window.addEventListener('reminder-taken', handleReminderTaken as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('medicine-notification', handleNewNotification as EventListener)
      window.removeEventListener('custom-reminder-notification', handleCustomReminderNotification as EventListener)
      window.removeEventListener('refill-alert-notification', handleRefillAlertNotification as EventListener)
      window.removeEventListener('notification-dismissed', handleNotificationDismissed as EventListener)
      window.removeEventListener('reminder-taken', handleReminderTaken as EventListener)
    }
  }, [])

  const handleNotificationTaken = (reminderId: number) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== reminderId))
  }

  const handleNotificationDismiss = (reminderId: number) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== reminderId))
  }

  const handleCustomReminderDismiss = (reminderId: number) => {
    setActiveCustomReminders(prev => prev.filter(n => n.id !== reminderId))
  }

  const handleCustomReminderComplete = (reminderId: number) => {
    // Mark reminder as completed in localStorage
    const today = new Date().toDateString()
    const completedKey = `completed_reminders_${today}`
    const existing = localStorage.getItem(completedKey)
    
    let completedIds: number[] = []
    if (existing) {
      try {
        completedIds = JSON.parse(existing)
      } catch (error) {
        completedIds = []
      }
    }
    
    if (!completedIds.includes(reminderId)) {
      completedIds.push(reminderId)
      localStorage.setItem(completedKey, JSON.stringify(completedIds))
    }
    
    setActiveCustomReminders(prev => prev.filter(n => n.id !== reminderId))
  }

  const handleRefillAlertDismiss = (alertId: number) => {
    setActiveRefillAlerts(prev => prev.filter(n => n.id !== alertId))
  }

  const handleRefillAlertRefilled = (alertId: number) => {
    // Mark as refilled and remove from active alerts
    setActiveRefillAlerts(prev => prev.filter(n => n.id !== alertId))
    
    // Dispatch event to update refill service
    window.dispatchEvent(new CustomEvent('refill-confirmed', {
      detail: { alertId }
    }))
  }

  // Calculate total notifications for positioning
  const totalNotifications = activeNotifications.length + activeCustomReminders.length + activeRefillAlerts.length

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {/* Medicine notifications */}
      {activeNotifications.map((reminder, index) => (
        <div
          key={`medicine-${reminder.id}`}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        >
          <InAppNotification
            reminder={reminder}
            onTaken={handleNotificationTaken}
            onDismiss={handleNotificationDismiss}
          />
        </div>
      ))}
      
      {/* Custom reminder notifications */}
      {activeCustomReminders.map((reminder, index) => (
        <div
          key={`custom-${reminder.id}`}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${(activeNotifications.length + index) * 10}px)`,
            zIndex: 1000 - (activeNotifications.length + index)
          }}
        >
          <CustomReminderNotification
            notification={reminder}
            onDismiss={handleCustomReminderDismiss}
            onComplete={handleCustomReminderComplete}
          />
        </div>
      ))}
      
      {/* Refill alert notifications */}
      {activeRefillAlerts.map((alert, index) => (
        <div
          key={`refill-${alert.id}`}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${(activeNotifications.length + activeCustomReminders.length + index) * 10}px)`,
            zIndex: 1000 - (activeNotifications.length + activeCustomReminders.length + index)
          }}
        >
          <RefillAlertNotification
            alert={alert}
            onDismiss={handleRefillAlertDismiss}
            onRefilled={handleRefillAlertRefilled}
          />
        </div>
      ))}
    </div>
  )
}