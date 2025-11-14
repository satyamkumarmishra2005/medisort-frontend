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

    // Check every 30 seconds for precise timing
    this.checkInterval = setInterval(() => {
      this.checkForDueReminders()
    }, 30000)

    // Initial check
    this.checkForDueReminders()
  }

  // Stop the notification service
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
    console.log('🔔 Stopped Custom Reminder Notification Service')
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

        // Check if time matches (exact match)
        const timeMatch = reminderTime === currentTime

        // Create unique key for this reminder on this day and time
        const reminderKey = `${reminder.id}_${today}_${currentTime}`
        const alreadyNotified = this.lastNotifiedReminders.has(reminderKey)

        // Also check localStorage for additional duplicate prevention
        const storageKey = `custom_reminder_notified_${reminder.id}_${today}_${currentTime}`
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
          const reminderKey = `${reminder.id}_${today}_${currentTime}`
          this.lastNotifiedReminders.add(reminderKey)

          const storageKey = `custom_reminder_notified_${reminder.id}_${today}_${currentTime}`
          localStorage.setItem(storageKey, 'true')
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

    // Only show in-app notification (browser notifications disabled)
    this.showInAppNotification(notification)

    // Play sound if enabled
    this.playNotificationSound()
  }

  // Show browser notification
  private async showBrowserNotification(notification: CustomReminderNotification): Promise<void> {
    // Check if browser notifications are supported and permitted
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return
      }
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    try {
      const categoryEmojis: { [key: string]: string } = {
        'health': '🏥',
        'medication': '💊',
        'exercise': '🏃‍♂️',
        'nutrition': '🥗',
        'appointment': '📅',
        'personal': '🧘‍♀️',
        'other': '📝'
      }

      const categoryEmoji = categoryEmojis[notification.category] || '📝'
      const title = `${categoryEmoji} ${notification.title}`
      const body = this.getNotificationBody(notification)

      const browserNotification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `custom-reminder-${notification.id}`,
        requireInteraction: true, // Keep visible until user interacts
        silent: false,
        data: {
          reminderId: notification.id,
          type: 'custom_reminder',
          time: notification.time,
          origin: 'MediSort'
        }
      })

      // Handle notification click
      browserNotification.onclick = () => {
        console.log(`🖱️ Custom reminder notification clicked: ${notification.title}`)

        // Focus the window
        window.focus()

        // Navigate to custom reminders page
        if (window.location.pathname !== '/custom-reminders') {
          window.location.href = '/custom-reminders'
        }

        // Close the notification
        browserNotification.close()
      }

      // Auto-close after 30 seconds
      setTimeout(() => {
        browserNotification.close()
      }, 30000)

      console.log(`✅ Browser notification shown for custom reminder: ${notification.title}`)
    } catch (error) {
      console.error('❌ Error showing browser notification:', error)
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

      console.log(`🔔 Custom reminder notification permission ${granted ? 'granted' : 'denied'}`)
      return granted
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
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

  // Clear notification history
  clearNotificationHistory(): void {
    this.lastNotifiedReminders.clear()

    // Also clear localStorage flags
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('custom_reminder_notified_')) {
        localStorage.removeItem(key)
      }
    })

    console.log('🗑️ Cleared custom reminder notification history (memory and storage)')
  }
}

// Export singleton instance
export const customReminderNotificationService = new CustomReminderNotificationService()