/**
 * Backend Notification Polling Service
 * Polls the backend for new notifications and displays browser notifications
 */

import ApiService from './api'

interface BackendNotification {
  id: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

class BackendNotificationPoller {
  private pollingInterval: NodeJS.Timeout | null = null
  private lastCheckedId: number = 0
  private isPolling: boolean = false

  // Start polling for new notifications
  startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    console.log('🔔 Starting backend notification polling service')
    
    // Poll every 30 seconds
    this.pollingInterval = setInterval(() => {
      this.checkForNewNotifications()
    }, 30000)

    // Also check immediately
    this.checkForNewNotifications()
    this.isPolling = true
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    this.isPolling = false
    console.log('🔔 Stopped backend notification polling service')
  }

  // Check for new notifications from backend
  private async checkForNewNotifications(): Promise<void> {
    try {
      console.log('🔍 Polling backend for new notifications...')
      
      const result = await ApiService.getUnreadNotifications()
      
      if (result.success && result.data) {
        console.log('📦 Raw notification data:', result.data)
        console.log('📦 Data type:', typeof result.data)
        console.log('📦 Is array:', Array.isArray(result.data))
        
        // Ensure we have an array
        let notifications: BackendNotification[]
        if (Array.isArray(result.data)) {
          notifications = result.data as BackendNotification[]
        } else {
          console.log('⚠️ Data is not an array, converting...')
          notifications = []
        }
        
        console.log('📊 Processed notifications:', notifications.length)
        
        // Filter for notifications newer than our last check, but exclude custom reminders
        // Custom reminders are handled by the dedicated customReminderNotificationService
        const newNotifications = notifications.filter(notification => 
          notification.id > this.lastCheckedId && notification.type !== 'CUSTOM_REMINDER'
        )

        if (newNotifications.length > 0) {
          console.log(`🆕 Found ${newNotifications.length} new notifications from backend (excluding custom reminders)`)
          
          // Update last checked ID
          this.lastCheckedId = Math.max(...notifications.map(n => n.id))
          
          // Show browser notifications for new notifications
          for (const notification of newNotifications) {
            this.showBrowserNotification(notification)
          }
        } else {
          console.log('📭 No new notifications from backend (custom reminders handled separately)')
        }
      } else {
        console.log('❌ API call failed or no data:', result)
      }
    } catch (error) {
      console.error('❌ Error polling backend notifications:', error)
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message)
        console.error('❌ Error stack:', error.stack)
      }
    }
  }

  // Show browser notification
  private showBrowserNotification(notification: BackendNotification): void {
    console.log(`🔔 Showing browser notification: ${notification.title}`)
    
    // Check if browser notifications are supported and permitted
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico', // You can customize this
        badge: '/favicon.ico',
        tag: `reminder-${notification.id}`, // Prevents duplicate notifications
        requireInteraction: true, // Keeps notification visible until user interacts
        data: {
          notificationId: notification.id,
          type: notification.type,
          createdAt: notification.createdAt
        }
      })

      // Handle notification click
      browserNotification.onclick = () => {
        console.log(`🖱️ Notification clicked: ${notification.title}`)
        
        // Mark as read in backend
        ApiService.markNotificationAsRead(notification.id)
        
        // Focus the window
        window.focus()
        
        // Navigate to notifications page
        window.location.href = '/notifications'
        
        // Close the notification
        browserNotification.close()
      }

      // Auto-close after 10 seconds for non-critical notifications
      if (notification.type !== 'CUSTOM_REMINDER') {
        setTimeout(() => {
          browserNotification.close()
        }, 10000)
      }

      console.log(`✅ Browser notification shown for: ${notification.title}`)
    } catch (error) {
      console.error('❌ Error showing browser notification:', error)
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      
      console.log(`🔔 Notification permission ${granted ? 'granted' : 'denied'}`)
      return granted
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Get polling status
  getStatus(): { isPolling: boolean; lastCheckedId: number } {
    return {
      isPolling: this.isPolling,
      lastCheckedId: this.lastCheckedId
    }
  }

  // Force check for notifications (for testing)
  async forceCheck(): Promise<void> {
    console.log('🔄 Force checking for new notifications...')
    await this.checkForNewNotifications()
  }
}

export const backendNotificationPoller = new BackendNotificationPoller()