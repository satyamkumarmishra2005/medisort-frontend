import { medicineApi } from './medicineApi'
import { refillNotificationService } from './refillNotificationService'

export interface NotificationReminder {
  id: number
  medicineId: number
  medicineName: string
  dosage: string
  reminderTime: string
  isOverdue: boolean
  scheduledFor: Date
  type: 'upcoming' | 'due' | 'overdue' | 'refill'
  refillData?: {
    daysRemaining: number
    currentStock: number
    alertLevel: 'low' | 'critical' | 'out'
  }
}

export interface NotificationPreferences {
  browserNotifications: boolean
  soundAlerts: boolean
  reminderMinutes: number
  autoMarkTaken: boolean
}

class MedicineNotificationService {
  private checkInterval: NodeJS.Timeout | null = null
  private preferences: NotificationPreferences = {
    browserNotifications: true,
    soundAlerts: false,
    reminderMinutes: 15,
    autoMarkTaken: false
  }
  private notificationQueue: NotificationReminder[] = []
  private activeNotifications: Map<number, Notification> = new Map()
  private lastCheckTimes = {
    morning: null as Date | null,
    evening: null as Date | null,
    night: null as Date | null
  }
  private dailyCheckTimes = {
    morning: { hour: 8, minute: 0 },   // 8:00 AM
    evening: { hour: 18, minute: 0 },  // 6:00 PM  
    night: { hour: 22, minute: 0 }     // 10:00 PM
  }

  constructor() {
    this.loadPreferences()
  }

  // Initialize the notification system
  async initialize(): Promise<boolean> {
    console.log('🔔 Initializing Medicine Notification Service')

    // Request notification permission
    const hasPermission = await this.requestNotificationPermission()
    if (!hasPermission) {
      console.warn('⚠️ Notification permission denied')
      return false
    }

    // Start checking for reminders
    this.startReminderChecking()

    // Initialize refill notification service
    await refillNotificationService.initialize()

    console.log('✅ Medicine Notification Service initialized')
    return true
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // Start periodic reminder checking - every 30 seconds for precise timing
  startReminderChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    console.log('🔔 Starting reminder checking service - will check every 30 seconds')

    // Check every 30 seconds for more accurate reminder timing
    this.checkInterval = setInterval(() => {
      console.log('⏰ Reminder check interval triggered')
      this.checkIfTimeForDailyReminder()
    }, 30 * 1000) // 30 seconds

    // Initial check
    this.checkIfTimeForDailyReminder()
  }

  // Check if it's time for morning, evening, or night reminder check
  checkIfTimeForDailyReminder(): void {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const today = now.toDateString()

    // Morning check (8:00 AM)
    if (currentHour === this.dailyCheckTimes.morning.hour &&
      currentMinute >= this.dailyCheckTimes.morning.minute &&
      currentMinute < this.dailyCheckTimes.morning.minute + 5 &&
      (!this.lastCheckTimes.morning || this.lastCheckTimes.morning.toDateString() !== today)) {

      console.log('🌅 Morning medicine check')
      this.checkForReminders('morning')
      this.lastCheckTimes.morning = now
    }

    // Evening check (6:00 PM)
    if (currentHour === this.dailyCheckTimes.evening.hour &&
      currentMinute >= this.dailyCheckTimes.evening.minute &&
      currentMinute < this.dailyCheckTimes.evening.minute + 5 &&
      (!this.lastCheckTimes.evening || this.lastCheckTimes.evening.toDateString() !== today)) {

      console.log('🌆 Evening medicine check')
      this.checkForReminders('evening')
      this.lastCheckTimes.evening = now
    }

    // Night check (10:00 PM)
    if (currentHour === this.dailyCheckTimes.night.hour &&
      currentMinute >= this.dailyCheckTimes.night.minute &&
      currentMinute < this.dailyCheckTimes.night.minute + 5 &&
      (!this.lastCheckTimes.night || this.lastCheckTimes.night.toDateString() !== today)) {

      console.log('🌙 Night medicine check')
      this.checkForReminders('night')
      this.lastCheckTimes.night = now
    }

    // Also check for specific reminder times every check cycle
    this.checkForSpecificReminderTimes()
    
    // Check for refill alerts
    this.checkForRefillAlerts()
  }

  // Check for refill alerts
  async checkForRefillAlerts(): Promise<void> {
    try {
      const userMedicines = await this.fetchUserMedicines()
      const refillAlerts: NotificationReminder[] = []

      for (const medicine of userMedicines) {
        if (medicine.id) {
          const daysRemaining = this.calculateDaysRemaining(medicine)
          const currentStock = medicine.currentStock || medicine.totalQuantity || 0
          
          // Check if medicine needs refill alert
          let alertLevel: 'low' | 'critical' | 'out' | null = null
          
          if (currentStock <= 0) {
            alertLevel = 'out'
          } else if (daysRemaining <= 1) {
            alertLevel = 'critical'
          } else if (daysRemaining <= 3) {
            alertLevel = 'low'
          }
          
          // Create refill alert if needed
          if (alertLevel) {
            const alertKey = `refill_alert_${medicine.id}_${alertLevel}_${new Date().toDateString()}`
            const alreadyShown = localStorage.getItem(alertKey)
            
            if (!alreadyShown) {
              const refillAlert: NotificationReminder = {
                id: Date.now() + (medicine.id * 1000),
                medicineId: medicine.id,
                medicineName: medicine.name,
                dosage: medicine.dosage,
                reminderTime: 'refill',
                isOverdue: alertLevel === 'out',
                scheduledFor: new Date(),
                type: 'refill',
                refillData: {
                  daysRemaining,
                  currentStock,
                  alertLevel
                }
              }
              
              refillAlerts.push(refillAlert)
              
              // Mark as shown to prevent spam
              localStorage.setItem(alertKey, 'true')
            }
          }
        }
      }
      
      // Process refill alerts
      refillAlerts.forEach(alert => {
        this.showNotification(alert)
      })
      
    } catch (error) {
      console.error('Error checking for refill alerts:', error)
    }
  }

  // Calculate days remaining based on current stock and usage
  calculateDaysRemaining(medicine: any): number {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const dosesPerDay = medicine.dosesPerDay || 1
    
    if (dosesPerDay <= 0) return 0
    
    return Math.floor(currentStock / dosesPerDay)
  }
  async checkForSpecificReminderTimes(): Promise<void> {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    console.log(`🕐 [${new Date().toLocaleTimeString()}] FRONTEND: Checking for MEDICINE reminders at ${currentTime}`)
    console.log(`🔍 FRONTEND: Old notification service - handles MEDICINE reminders only`)
    console.log(`🎯 CUSTOM REMINDERS: Handled by backend scheduler + backendNotificationPoller`)

    try {
      // Get user's medicines and their reminders
      const userMedicines = await this.fetchUserMedicines()
      console.log(`📊 Found ${userMedicines.length} user medicines:`, userMedicines.map(m => ({ id: m.id, name: m.name })))

      const allReminders: NotificationReminder[] = []

      for (const medicine of userMedicines) {
        if (medicine.id) {
          const medicineReminders = await this.fetchMedicineReminders(medicine.id)
          console.log(`💊 Medicine "${medicine.name}" has ${medicineReminders.length} reminders:`,
            medicineReminders.map(r => ({ time: r.reminderTime, active: r.isActive })))

          // Check if any reminder matches current time EXACTLY
          const matchingReminders = medicineReminders.filter(reminder => {
            const reminderTime = reminder.reminderTime
            const isActive = reminder.isActive
            
            // EXACT TIME MATCH ONLY - no tolerance window for precise delivery
            const exactTimeMatch = reminderTime === currentTime

            // Check if we've already shown this reminder within the current minute today
            const reminderKey = `reminder_${medicine.id}_${reminderTime}_${now.toDateString()}_${currentTime}`
            const alreadyShown = localStorage.getItem(reminderKey)

            console.log(`⏰ Checking reminder: ${reminderTime} vs current ${currentTime}`)
            console.log(`   - Exact time match: ${exactTimeMatch}`)
            console.log(`   - Is active: ${isActive}`)
            console.log(`   - Already shown this minute: ${!!alreadyShown}`)
            console.log(`   - Will trigger: ${exactTimeMatch && isActive && !alreadyShown}`)

            return exactTimeMatch && isActive && !alreadyShown
          })

          console.log(`✅ Found ${matchingReminders.length} matching reminders for ${medicine.name}`)

          // Convert matching reminders to notifications
          matchingReminders.forEach(reminder => {
            const scheduledFor = new Date()
            scheduledFor.setHours(
              parseInt(reminder.reminderTime.split(':')[0]),
              parseInt(reminder.reminderTime.split(':')[1]),
              0, 0
            )

            allReminders.push({
              id: reminder.id || Date.now(),
              medicineId: medicine.id!,
              medicineName: medicine.name,
              dosage: medicine.dosage,
              reminderTime: reminder.reminderTime,
              isOverdue: false,
              scheduledFor,
              type: 'due'
            })

            // Mark this reminder as shown for this exact minute to prevent duplicates
            const reminderKey = `reminder_${medicine.id}_${reminder.reminderTime}_${now.toDateString()}_${currentTime}`
            localStorage.setItem(reminderKey, 'true')
          })
        }
      }

      // NOTE: Custom reminders are now handled by the backend scheduler and backendNotificationPoller
      // This old system should NOT check custom reminders to avoid conflicts
      console.log(`🎯 Custom reminders are now handled by backend scheduler - skipping localStorage check`)

      if (allReminders.length > 0) {
        console.log(`🔔 TRIGGERING ${allReminders.length} notifications for ${currentTime}:`)
        allReminders.forEach(r => console.log(`   - ${r.medicineName} at ${r.reminderTime}`))

        // Show notifications for matching reminders
        allReminders.forEach(reminder => {
          console.log(`🚀 Showing notification for: ${reminder.medicineName}`)
          this.showNotification(reminder)
        })
      }

      // Clean up old reminder flags (older than 2 days)
      this.cleanupOldReminderFlags()

    } catch (error) {
      console.error('Error checking specific reminder times:', error)
    }
  }

  // Stop reminder checking
  stopReminderChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // Check for reminders based on user's actual medicines
  async checkForReminders(timeOfDay?: 'morning' | 'evening' | 'night'): Promise<void> {
    try {
      const userId = this.getCurrentUserId()
      if (!userId) return

      console.log(`🔍 Checking ${timeOfDay || 'general'} reminders for user medicines`)

      // Get user's actual medicines from the API
      const userMedicines = await this.fetchUserMedicines()

      if (userMedicines.length === 0) {
        console.log('📭 No medicines found for user')
        return
      }

      // Get reminders for each medicine
      const allReminders: NotificationReminder[] = []

      for (const medicine of userMedicines) {
        if (medicine.id) {
          const medicineReminders = await this.fetchMedicineReminders(medicine.id)

          // Convert medicine reminders to notification reminders
          const notificationReminders = this.convertToNotificationReminders(medicine, medicineReminders, timeOfDay)
          allReminders.push(...notificationReminders)
        }
      }

      console.log(`📋 Found ${allReminders.length} reminders to process`)

      // Process reminders
      this.processReminders(allReminders)

    } catch (error) {
      console.error('Error checking for reminders:', error)
    }
  }

  // Fetch user's actual medicines
  async fetchUserMedicines(): Promise<any[]> {
    try {
      console.log('📡 Fetching user medicines from API')
      const medicines = await medicineApi.getActiveMedicines()
      console.log(`✅ Found ${medicines.length} active medicines`)
      return medicines
    } catch (error) {
      console.error('Error fetching user medicines:', error)
      return []
    }
  }

  // Fetch reminders for a specific medicine
  async fetchMedicineReminders(medicineId: number): Promise<any[]> {
    try {
      const reminders = await medicineApi.getMedicineReminders(medicineId)
      return reminders.filter(reminder => reminder.isActive)
    } catch (error) {
      console.error(`Error fetching reminders for medicine ${medicineId}:`, error)
      return []
    }
  }

  // Convert medicine data to notification reminders
  convertToNotificationReminders(
    medicine: any,
    medicineReminders: any[],
    timeOfDay?: 'morning' | 'evening' | 'night'
  ): NotificationReminder[] {
    const now = new Date()
    const notifications: NotificationReminder[] = []

    // ONLY use explicitly set reminders - no automatic defaults
    // This keeps medicine reminders separate from refill notifications
    medicineReminders.forEach((reminder, index) => {
      const [hours, minutes] = reminder.reminderTime.split(':').map(Number)
      const scheduledFor = new Date()
      scheduledFor.setHours(hours, minutes, 0, 0)

      // If time has passed today, schedule for tomorrow
      if (scheduledFor <= now) {
        scheduledFor.setDate(scheduledFor.getDate() + 1)
      }

      // Only include if it matches the current time of day check
      if (this.shouldIncludeForTimeOfDay(hours, timeOfDay)) {
        notifications.push({
          id: reminder.id || Date.now() + index,
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          reminderTime: reminder.reminderTime,
          isOverdue: false,
          scheduledFor,
          type: 'upcoming'
        })
      }
    })

    return notifications
  }

  // Get default reminder times based on doses per day
  getDefaultReminderTimes(dosesPerDay: number, timeOfDay?: string): Array<{ hour: number, minute: number }> {
    const times: Array<{ hour: number, minute: number }> = []

    switch (dosesPerDay) {
      case 1:
        times.push({ hour: 8, minute: 0 }) // Morning only
        break
      case 2:
        times.push({ hour: 8, minute: 0 }, { hour: 20, minute: 0 }) // Morning and night
        break
      case 3:
        times.push({ hour: 8, minute: 0 }, { hour: 14, minute: 0 }, { hour: 20, minute: 0 }) // Morning, afternoon, night
        break
      default:
        // For more than 3 doses, distribute evenly throughout the day
        const interval = Math.floor(24 / dosesPerDay)
        for (let i = 0; i < dosesPerDay; i++) {
          times.push({ hour: 8 + (i * interval), minute: 0 })
        }
    }

    // Filter by time of day if specified
    if (timeOfDay) {
      return times.filter(time => this.shouldIncludeForTimeOfDay(time.hour, timeOfDay))
    }

    return times
  }

  // Check if a time should be included for the current time of day check
  shouldIncludeForTimeOfDay(hour: number, timeOfDay?: string): boolean {
    if (!timeOfDay) return true

    switch (timeOfDay) {
      case 'morning':
        return hour >= 6 && hour < 12  // 6 AM to 12 PM
      case 'evening':
        return hour >= 12 && hour < 20 // 12 PM to 8 PM
      case 'night':
        return hour >= 20 || hour < 6  // 8 PM to 6 AM
      default:
        return true
    }
  }

  // Process and show notifications for reminders
  processReminders(reminders: NotificationReminder[]): void {
    const now = new Date()

    reminders.forEach(reminder => {
      const reminderTime = new Date(reminder.scheduledFor)
      const timeDiff = reminderTime.getTime() - now.getTime()
      const minutesDiff = Math.floor(timeDiff / (1000 * 60))
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60))

      // For daily checks, show reminders that are due within the next few hours
      if (hoursDiff <= 6 && hoursDiff >= -1) { // Within 6 hours ahead or 1 hour past
        // Determine reminder type
        if (minutesDiff < -60) {
          reminder.type = 'overdue'
          reminder.isOverdue = true
        } else if (minutesDiff <= 30 && minutesDiff >= -30) {
          reminder.type = 'due'
        } else if (hoursDiff <= 2) {
          reminder.type = 'upcoming'
        } else {
          return // Skip reminders too far in the future
        }

        // Check if we've already shown this notification today
        const notificationKey = `${reminder.medicineId}-${reminder.reminderTime}-${now.toDateString()}`
        const alreadyShown = localStorage.getItem(`notification_shown_${notificationKey}`)

        if (!alreadyShown && !this.activeNotifications.has(reminder.id)) {
          console.log(`💊 Showing notification for ${reminder.medicineName} at ${reminder.reminderTime}`)
          this.showNotification(reminder)

          // Mark as shown for today
          localStorage.setItem(`notification_shown_${notificationKey}`, 'true')

          // Clean up old notification flags (older than 2 days)
          this.cleanupOldNotificationFlags()
        }
      }
    })
  }

  // Clean up old notification flags to prevent localStorage bloat
  cleanupOldNotificationFlags(): void {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('notification_shown_')) {
        // Remove flags older than 2 days
        const flagDate = key.split('-').pop()
        if (flagDate && new Date(flagDate) < twoDaysAgo) {
          localStorage.removeItem(key)
        }
      }
    })
  }

  // Clean up old reminder flags to prevent localStorage bloat
  cleanupOldReminderFlags(): void {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('reminder_') || key.startsWith('custom_reminder_')) {
        // Remove flags older than 2 days
        const parts = key.split('_')
        const dateStr = parts[parts.length - 1]
        if (dateStr && new Date(dateStr) < twoDaysAgo) {
          localStorage.removeItem(key)
        }
      }
    })
  }

  // Show browser and in-app notification
  showNotification(reminder: NotificationReminder): void {
    console.log(`🔔 showNotification called for: ${reminder.medicineName} at ${reminder.reminderTime}`)
    console.log(`   - Browser notifications enabled: ${this.preferences.browserNotifications}`)
    console.log(`   - Browser permission: ${Notification.permission}`)
    console.log(`   - Sound alerts enabled: ${this.preferences.soundAlerts}`)

    // Show browser notification if enabled and permission granted
    if (this.preferences.browserNotifications && Notification.permission === 'granted') {
      console.log(`🌐 Showing browser notification`)
      this.showBrowserNotification(reminder)
    } else {
      console.log(`❌ Browser notification skipped - enabled: ${this.preferences.browserNotifications}, permission: ${Notification.permission}`)
    }

    // Always show in-app notification
    console.log(`📱 Showing in-app notification`)
    this.showInAppNotification(reminder)

    // Play sound if enabled
    if (this.preferences.soundAlerts) {
      this.playNotificationSound()
    }
  }

  // Show browser notification
  showBrowserNotification(reminder: NotificationReminder): void {
    const title = this.getNotificationTitle(reminder)
    const body = this.getNotificationBody(reminder)
    const icon = '/favicon.ico'

    const notification = new Notification(title, {
      body,
      icon,
      tag: `medicine-${reminder.id}`, // Prevents duplicate notifications
      requireInteraction: reminder.type === 'overdue' // Keep overdue notifications visible
    })

    // Handle notification clicks
    notification.onclick = () => {
      window.focus()
      this.handleNotificationClick(reminder.id)
      notification.close()
    }

    // Store active notification
    this.activeNotifications.set(reminder.id, notification)

    // Auto-close after 10 seconds for non-overdue reminders
    if (reminder.type !== 'overdue') {
      setTimeout(() => {
        notification.close()
        this.activeNotifications.delete(reminder.id)
      }, 10000)
    }
  }

  // Show in-app notification
  showInAppNotification(reminder: NotificationReminder): void {
    // Dispatch custom event for in-app notification display
    const event = new CustomEvent('medicine-notification', {
      detail: reminder
    })
    window.dispatchEvent(event)
  }

  // Mark reminder as taken
  async markReminderAsTaken(reminderId: number): Promise<boolean> {
    try {
      // This would be the actual API call when backend is ready
      // const response = await fetch(`/api/notifications/reminders/${reminderId}/taken`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // })

      console.log(`✅ Marked reminder ${reminderId} as taken`)

      // Remove from active notifications
      const notification = this.activeNotifications.get(reminderId)
      if (notification) {
        notification.close()
        this.activeNotifications.delete(reminderId)
      }

      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('reminder-taken', {
        detail: { reminderId }
      }))

      return true
    } catch (error: any) {
      console.error('Error marking reminder as taken:', error)
      return false
    }
  }

  // Dismiss notification
  dismissNotification(reminderId: number): void {
    const notification = this.activeNotifications.get(reminderId)
    if (notification) {
      notification.close()
      this.activeNotifications.delete(reminderId)
    }

    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent('notification-dismissed', {
      detail: { reminderId }
    }))
  }

  // Handle notification click
  handleNotificationClick(reminderId: number): void {
    // Focus the app and show medicine details
    window.dispatchEvent(new CustomEvent('notification-clicked', {
      detail: { reminderId }
    }))
  }

  // Play notification sound
  playNotificationSound(): void {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.5
      audio.play().catch((e: any) => console.log('Could not play notification sound:', e))
    } catch (error) {
      console.log('Notification sound not available')
    }
  }

  // Get notification title based on reminder type
  getNotificationTitle(reminder: NotificationReminder): string {
    switch (reminder.type) {
      case 'overdue':
        return '🚨 Overdue Medicine Reminder'
      case 'due':
        return '💊 Medicine Time!'
      case 'upcoming':
        return '⏰ Upcoming Medicine Reminder'
      default:
        return '💊 Medicine Reminder'
    }
  }

  // Get notification body text
  getNotificationBody(reminder: NotificationReminder): string {
    const timeStr = new Date(reminder.scheduledFor).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    switch (reminder.type) {
      case 'overdue':
        return `${reminder.medicineName} (${reminder.dosage}) was due at ${timeStr}. Please take it now.`
      case 'due':
        return `Time to take ${reminder.medicineName} (${reminder.dosage})`
      case 'upcoming':
        return `${reminder.medicineName} (${reminder.dosage}) is due at ${timeStr}`
      default:
        return `${reminder.medicineName} (${reminder.dosage})`
    }
  }

  // Get current user ID from auth context
  getCurrentUserId(): string | null {
    const userData = localStorage.getItem('medisort_user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        return user.id
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    return null
  }

  // Load user preferences
  loadPreferences(): void {
    const saved = localStorage.getItem('notification_preferences')
    if (saved) {
      try {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) }
      } catch (error) {
        console.error('Error loading notification preferences:', error)
      }
    }
  }

  // Save user preferences
  savePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences }
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences))
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  // Manual trigger for testing (can be called from NotificationTester)
  async triggerTestReminder(): Promise<void> {
    console.log('🧪 Triggering test reminder check')
    await this.checkForSpecificReminderTimes()
  }

  // Debug method to check notification system status
  getDebugInfo(): any {
    const now = new Date()
    return {
      isInitialized: !!this.checkInterval,
      currentTime: now.toLocaleTimeString(),
      notificationPermission: Notification.permission,
      preferences: this.preferences,
      activeNotifications: this.activeNotifications.size,
      lastChecks: this.lastCheckTimes,
      checkIntervalActive: !!this.checkInterval
    }
  }

  // Cleanup method
  destroy(): void {
    this.stopReminderChecking()

    // Close all active notifications
    this.activeNotifications.forEach((notification: Notification) => {
      notification.close()
    })
    this.activeNotifications.clear()
  }
}

// Export singleton instance
export const notificationService = new MedicineNotificationService()