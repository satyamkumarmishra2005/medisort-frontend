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
    } else if (!isAuthenticated && isInitialized) {
      // User logged out - stop all services immediately
      console.log('🔐 User logged out - stopping all notification services...')
      
      try {
        notificationService.destroy()
        console.log('✅ Stopped notification service')
      } catch (error) {
        console.error('❌ Error stopping notification service:', error)
      }
      
      try {
        backendNotificationPoller.stopPolling()
        console.log('✅ Stopped backend notification poller')
      } catch (error) {
        console.error('❌ Error stopping backend poller:', error)
      }
      
      try {
        customReminderNotificationService.stop()
        console.log('✅ Stopped custom reminder notification service')
      } catch (error) {
        console.error('❌ Error stopping custom reminder service:', error)
      }
      
      try {
        refillNotificationService.destroy()
        console.log('✅ Stopped refill notification service')
      } catch (error) {
        console.error('❌ Error stopping refill service:', error)
      }
      
      setIsInitialized(false)
      console.log('🔐 All notification services stopped due to logout')
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