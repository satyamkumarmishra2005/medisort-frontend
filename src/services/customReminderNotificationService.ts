/**
 * Custom Reminder Notification Service
 * Handles real-time notifications for custom reminders
 */

import { customReminderService, CustomReminder } from './customReminderService'

interface CustomReminderNotification {
  id: number
  title: string
  time: string
  category: string
  notes?: string
  reminder: CustomReminder
}

class CustomReminderNotificationService {
  private checkInterval: NodeJS.Timeout | null = null
  private isRunning: boolean = false
  private lastNotifiedReminders: Set<string> = new Set()

  // Start the notification checking service
  start(): void {
    if (this.checkInterval) {
      this.stop()
    }

    console.log('🔔 Starting Custom Reminder Notification Service')
    this.isRunning = true

    // Check every 15 seconds for more precise timing
    this.checkInterval = setInterval(() => {
      this.checkForDueReminders()
    }, 15000)

    // Initial check
    this.checkForDueReminders()
    
    // Also check at the start of every minute for exact timing
    const now = new Date()
    const secondsUntilNextMinute = 60 - now.getSeconds()
    
    setTimeout(() => {
      this.checkForDueReminders()
      
      // Then check every minute on the minute
      const minuteInterval = setInterval(() => {
        this.checkForDueReminders()
      }, 60000)
      
      // Store the minute interval for cleanup
      ;(this as any).minuteInterval = minuteInterval
    }, secondsUntilNextMinute * 1000)
  }

  // Stop the notification service
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    
    // Also clear the minute interval if it exists
    if ((this as any).minuteInterval) {
      clearInterval((this as any).minuteInterval)
      ;(this as any).minuteInterval = null
    }
    
    this.isRunning = false
    console.log('🔔 Stopped Custom Reminder Notification Service')
  }

  // Helper function to check if times match (with tolerance)
  private isTimeMatch(reminderTime: string, currentTime: string): boolean {
    // Exact match
    if (reminderTime === currentTime) {
      return true
    }
    
    // Parse times
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
    const [currentHour, currentMinute] = currentTime.split(':').map(Number)
    
    // Convert to minutes since midnight for easier comparison
    const reminderMinutes = reminderHour * 60 + reminderMinute
    const currentMinutes = currentHour * 60 + currentMinute
    
    // Allow 1 minute tolerance (in case we missed the exact minute)
    const timeDifference = Math.abs(currentMinutes - reminderMinutes)
    return timeDifference <= 1
  }

  // Check for reminders that are due now
  private async checkForDueReminders(): Promise<void> {
    try {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const today = now.toDateString()

      console.log(`🕐 [${now.toLocaleTimeString()}] Checking custom reminders for ${currentTime}`)

      // Get today's active reminders
      const todaysReminders = await customReminderService.getTodaysReminders()

      if (todaysReminders.length === 0) {
        console.log('📭 No custom reminders scheduled for today')
        return
      }

      console.log(`📋 Found ${todaysReminders.length} reminders for today`)

      // Find reminders that match current time
      const dueReminders = todaysReminders.filter(reminder => {
        const reminderTime = reminder.time
        const isActive = reminder.isActive

        // Check if time matches (exact match or within 1 minute for reliability)
        const timeMatch = this.isTimeMatch(reminderTime, currentTime)

        // Create unique key for this reminder on this day and time
        const reminderKey = `${reminder.id}_${today}_${reminderTime}` // Use reminder time, not current time
        const alreadyNotified = this.lastNotifiedReminders.has(reminderKey)

        // Also check localStorage for additional duplicate prevention
        const storageKey = `custom_reminder_notified_${reminder.id}_${today}_${reminderTime}`
        const alreadyNotifiedInStorage = localStorage.getItem(storageKey)

        console.log(`⏰ Checking reminder "${reminder.title}":`)
        console.log(`   - Scheduled time: ${reminderTime}`)
        console.log(`   - Current time: ${currentTime}`)
        console.log(`   - Time match: ${timeMatch}`)
        console.log(`   - Is active: ${isActive}`)
        console.log(`   - Already notified (memory): ${alreadyNotified}`)
        console.log(`   - Already notified (storage): ${!!alreadyNotifiedInStorage}`)
        console.log(`   - Will notify: ${timeMatch && isActive && !alreadyNotified && !alreadyNotifiedInStorage}`)

        return timeMatch && isActive && !alreadyNotified && !alreadyNotifiedInStorage
      })

      if (dueReminders.length > 0) {
        console.log(`🔔 Found ${dueReminders.length} due reminders, showing notifications`)

        // Show notifications for due reminders
        for (const reminder of dueReminders) {
          await this.showReminderNotification(reminder)

          // Mark as notified to prevent duplicates (both in memory and storage)
          const reminderKey = `${reminder.id}_${today}_${reminder.time}` // Use reminder time
          this.lastNotifiedReminders.add(reminderKey)

          const storageKey = `custom_reminder_notified_${reminder.id}_${today}_${reminder.time}`
          localStorage.setItem(storageKey, 'true')
          
          console.log(`✅ Marked reminder ${reminder.id} as notified for ${reminder.time}`)
        }

        // Clean up old notification flags
        this.cleanupOldNotificationFlags()
      } else {
        console.log('📭 No due custom reminders at this time')
      }

    } catch (error) {
      console.error('❌ Error checking for due custom reminders:', error)
    }
  }

  // Show notification for a custom reminder
  private async showReminderNotification(reminder: CustomReminder): Promise<void> {
    console.log(`🔔 Showing notification for custom reminder: ${reminder.title}`)

    const notification: CustomReminderNotification = {
      id: reminder.id!,
      title: reminder.title,
      time: reminder.time,
      category: reminder.label || 'other',
      notes: reminder.notes,
      reminder
    }

    // Clear any existing browser notifications first
    this.clearBrowserNotifications()

    // Only show in-app notification (browser notifications disabled)
    this.showInAppNotification(notification)

    // Play sound if enabled
    this.playNotificationSound()
  }

  // Clear any existing browser notifications
  private clearBrowserNotifications(): void {
    try {
      // Clear any existing browser notifications
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.getNotifications().then(notifications => {
            notifications.forEach(notification => {
              notification.close()
            })
          })
        })
      }
    } catch (error) {
      console.log('Could not clear browser notifications:', error)
    }
  }



  // Show in-app notification
  private showInAppNotification(notification: CustomReminderNotification): void {
    // Dispatch custom event for in-app notification display
    const event = new CustomEvent('custom-reminder-notification', {
      detail: notification
    })
    window.dispatchEvent(event)
    console.log(`📱 In-app notification dispatched for: ${notification.title}`)
  }

  // Get notification body text
  private getNotificationBody(notification: CustomReminderNotification): string {
    const categoryMessages: { [key: string]: { emoji: string, message: string } } = {
      'health': { emoji: '🏥', message: 'Time to take care of your health!' },
      'medication': { emoji: '💊', message: 'Don\'t forget your medication!' },
      'exercise': { emoji: '🏃‍♂️', message: 'Let\'s get moving and stay active!' },
      'nutrition': { emoji: '🥗', message: 'Fuel your body with good nutrition!' },
      'appointment': { emoji: '📅', message: 'You have an important appointment!' },
      'personal': { emoji: '🧘‍♀️', message: 'Time for some self-care!' },
      'other': { emoji: '📝', message: 'You have a reminder waiting!' }
    }

    const categoryInfo = categoryMessages[notification.category] || categoryMessages['other']

    let body = `${categoryInfo.emoji} ${categoryInfo.message}`

    if (notification.notes) {
      body += `\n💡 ${notification.notes}`
    }

    return body
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      // Create a pleasant notification chime using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create a pleasant two-tone chime
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        // Smooth envelope
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }

      // Play a pleasant C-E chord progression
      const now = audioContext.currentTime
      playTone(523.25, now, 0.3) // C5
      playTone(659.25, now + 0.15, 0.3) // E5

      console.log('🔊 Pleasant notification chime played')
    } catch (error) {
      console.log('🔇 Could not play notification sound:', error)
    }
  }

  // Clean up old notification flags to prevent memory bloat
  private cleanupOldNotificationFlags(): void {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Clean up in-memory flags
    const flagsToRemove: string[] = []
    this.lastNotifiedReminders.forEach(flag => {
      const parts = flag.split('_')
      if (parts.length >= 3) {
        const flagDate = parts[parts.length - 2] // Second to last part should be the date
        if (new Date(flagDate) < twoDaysAgo) {
          flagsToRemove.push(flag)
        }
      }
    })

    flagsToRemove.forEach(flag => {
      this.lastNotifiedReminders.delete(flag)
    })

    // Clean up localStorage flags
    const storageKeysToRemove: string[] = []
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('custom_reminder_notified_')) {
        const parts = key.split('_')
        if (parts.length >= 5) {
          const flagDate = parts[parts.length - 2] // Date part
          if (new Date(flagDate) < twoDaysAgo) {
            storageKeysToRemove.push(key)
          }
        }
      }
    })

    storageKeysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    const totalCleaned = flagsToRemove.length + storageKeysToRemove.length
    if (totalCleaned > 0) {
      console.log(`🗑️ Cleaned up ${totalCleaned} old notification flags (${flagsToRemove.length} memory, ${storageKeysToRemove.length} storage)`)
    }
  }



  // Get service status
  getStatus(): { isRunning: boolean; activeReminders: number } {
    return {
      isRunning: this.isRunning,
      activeReminders: this.lastNotifiedReminders.size
    }
  }

  // Force check (for testing)
  async forceCheck(): Promise<void> {
    console.log('🔄 Force checking custom reminders...')
    await this.checkForDueReminders()
  }

  // Debug method to check specific reminder
  async debugReminder(reminderId: number): Promise<void> {
    try {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const today = now.toDateString()
      
      console.log(`🔍 Debugging reminder ${reminderId}:`)
      console.log(`   - Current time: ${currentTime}`)
      console.log(`   - Today: ${today}`)
      
      const todaysReminders = await customReminderService.getTodaysReminders()
      const reminder = todaysReminders.find(r => r.id === reminderId)
      
      if (!reminder) {
        console.log(`   - ❌ Reminder ${reminderId} not found in today's reminders`)
        return
      }
      
      console.log(`   - Reminder found: "${reminder.title}"`)
      console.log(`   - Scheduled time: ${reminder.time}`)
      console.log(`   - Is active: ${reminder.isActive}`)
      console.log(`   - Time match: ${this.isTimeMatch(reminder.time, currentTime)}`)
      
      const reminderKey = `${reminder.id}_${today}_${reminder.time}`
      const alreadyNotified = this.lastNotifiedReminders.has(reminderKey)
      const storageKey = `custom_reminder_notified_${reminder.id}_${today}_${reminder.time}`
      const alreadyNotifiedInStorage = localStorage.getItem(storageKey)
      
      console.log(`   - Already notified (memory): ${alreadyNotified}`)
      console.log(`   - Already notified (storage): ${!!alreadyNotifiedInStorage}`)
      
      const shouldNotify = this.isTimeMatch(reminder.time, currentTime) && 
                          reminder.isActive && 
                          !alreadyNotified && 
                          !alreadyNotifiedInStorage
      
      console.log(`   - Should notify: ${shouldNotify}`)
      
      if (shouldNotify) {
        console.log(`   - 🔔 Triggering notification for debugging...`)
        await this.showReminderNotification(reminder)
      }
      
    } catch (error) {
      console.error(`❌ Error debugging reminder ${reminderId}:`, error)
    }
  }

  // Clear notification history
  clearNotificationHistory(): void {
    this.lastNotifiedReminders.clear()

    // Also clear localStorage flags
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('custom_reminder_notified_')) {
        localStorage.removeItem(key)
      }
    })

    // Clear any browser notifications
    this.clearBrowserNotifications()

    console.log('🗑️ Cleared custom reminder notification history (memory and storage)')
  }

  // Force clear all notifications and reset service
  forceReset(): void {
    console.log('🔄 Force resetting custom reminder notification service...')
    
    // Stop the service
    this.stop()
    
    // Clear all notification history
    this.clearNotificationHistory()
    
    // Clear browser notifications
    this.clearBrowserNotifications()
    
    // Clear any cached reminder data
    Object.keys(localStorage).forEach(key => {
      if (key.includes('reminder') || key.includes('notification')) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('✅ Custom reminder notification service reset complete')
  }
}

// Export singleton instance
export const customReminderNotificationService = new CustomReminderNotificationService()