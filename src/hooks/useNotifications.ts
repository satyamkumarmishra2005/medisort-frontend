import { useEffect, useState } from 'react'
import { notificationService } from '../services/notificationService'
import { backendNotificationPoller } from '../services/backendNotificationPoller'
import { customReminderNotificationService } from '../services/customReminderNotificationService'
import { refillNotificationService } from '../services/refillNotificationService'
import { useAuth } from '../contexts/AuthContext'

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      const initNotifications = async () => {
        const success = await notificationService.initialize()
        setIsInitialized(success)
        setHasPermission(Notification.permission === 'granted')
        
        // Start backend notification polling
        if (success) {
          console.log('🔔 Starting backend notification polling...')
          backendNotificationPoller.startPolling()
          
          // Start custom reminder notifications
          console.log('🔔 Starting custom reminder notifications...')
          customReminderNotificationService.start()
          
          // Ensure refill notification service is also initialized
          console.log('🔔 Ensuring refill notification service is initialized...')
          try {
            await refillNotificationService.initialize()
            console.log('✅ Refill notification service initialized successfully')
          } catch (error) {
            console.error('❌ Failed to initialize refill notification service:', error)
            // Continue anyway - the service will retry periodically
          }
        }
      }

      initNotifications()
    }
    
    // Cleanup on unmount or logout
    return () => {
      if (!isAuthenticated) {
        backendNotificationPoller.stopPolling()
        customReminderNotificationService.stop()
      }
    }
  }, [isAuthenticated, isInitialized])

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestNotificationPermission()
      setHasPermission(granted)
      return granted
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  const checkForReminders = async () => {
    if (isInitialized) {
      await notificationService.checkForReminders()
    }
  }

  return {
    isInitialized,
    hasPermission,
    requestPermission,
    checkForReminders,
    notificationService
  }
}