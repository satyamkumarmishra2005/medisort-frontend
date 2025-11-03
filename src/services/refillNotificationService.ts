import { medicineApi, Medicine } from './medicineApi'

export interface RefillNotificationData {
  medicineId: number
  medicineName: string
  dosage: string
  daysRemaining: number
  expectedEndDate: Date
  currentStock: number
  alertLevel: 'warning' | 'urgent' | 'critical'
  notificationsSentToday: number
  lastNotificationSent: Date | null
  dismissedDate?: string // Date string when alert was dismissed
}

export interface RefillConfirmation {
  medicineId: number
  refillQuantity: number
  refillDate: Date
  newExpectedEndDate: Date
}

class RefillNotificationService {
  private checkInterval: NodeJS.Timeout | null = null
  private refillAlerts: Map<number, RefillNotificationData> = new Map()

  constructor() {
    this.loadRefillAlerts()
  }

  // Initialize the refill notification system
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Refill Notification Service')
    
    try {
      // Start checking for refill alerts every hour
      this.startRefillChecking()
      
      // Initial check
      await this.checkAllMedicinesForRefill()
      
      console.log('✅ Refill Notification Service initialized successfully')
      console.log(`📊 Current status: ${this.refillAlerts.size} active alerts, checking every hour`)
      
    } catch (error) {
      console.error('❌ Failed to initialize Refill Notification Service:', error)
      
      // Still start the checking interval even if initial check fails
      this.startRefillChecking()
      
      // Load any cached alerts
      this.loadRefillAlerts()
      
      console.log('⚠️ Refill Notification Service initialized with errors, will retry periodically')
    }
  }



  // Start periodic refill checking
  startRefillChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Check every hour for refill alerts
    this.checkInterval = setInterval(() => {
      this.checkAllMedicinesForRefill()
    }, 60 * 60 * 1000) // 1 hour

    // Also check every 30 seconds for sending scheduled notifications
    setInterval(() => {
      this.checkAndSendScheduledNotifications()
    }, 30 * 1000) // 30 seconds
  }

  // Check all user medicines for refill needs
  async checkAllMedicinesForRefill(): Promise<void> {
    try {
      console.log('🔍 Checking all medicines for refill needs')
      
      // Clean up any invalid data first
      this.cleanupInvalidAlerts()
      
      let medicines: any[] = []
      
      // Use frontend-based filtering to avoid backend date calculation issues
      console.log('📊 Getting all medicines and filtering locally for accurate stock-based calculations...')
      
      const allMedicines = await medicineApi.getMedicines()
      console.log(`📊 Got ${allMedicines.length} total medicines, filtering for refill needs...`)
      
      medicines = allMedicines.filter(medicine => {
        const refillData = this.calculateRefillData(medicine)
        const needsRefill = refillData.daysRemaining <= 3
        if (needsRefill) {
          console.log(`🔍 ${medicine.name}: ${refillData.daysRemaining} days remaining (stock: ${medicine.currentStock || medicine.totalQuantity}, doses/day: ${medicine.dosesPerDay}) - needs refill`)
        }
        return needsRefill
      })
      
      console.log(`✅ Found ${medicines.length} medicines needing refill after stock-based filtering`)
      
      // Clear existing alerts
      this.refillAlerts.clear()
      
      // Create alerts for medicines needing refill
      for (const medicine of medicines) {
        if (medicine.id) {
          await this.checkMedicineForRefill(medicine)
        }
      }
      
      this.saveRefillAlerts()
      console.log(`💾 Saved ${this.refillAlerts.size} refill alerts`)
      
      // Dispatch event to update UI components
      window.dispatchEvent(new CustomEvent('refill-alerts-updated', {
        detail: { alertCount: this.refillAlerts.size }
      }))
      
    } catch (error) {
      console.error('❌ Error checking medicines for refill:', error)
      
      // If everything fails, try to work with cached data
      console.log('🔄 Attempting to work with cached refill alerts...')
      this.loadRefillAlerts()
      
      // Clean up any invalid cached data
      this.cleanupInvalidAlerts()
      
      if (this.refillAlerts.size > 0) {
        console.log(`📋 Using ${this.refillAlerts.size} cached refill alerts`)
      } else {
        console.warn('⚠️ No cached refill alerts available')
      }
    }
  }

  // Check individual medicine for refill needs
  async checkMedicineForRefill(medicine: Medicine): Promise<void> {
    if (!medicine.id) return

    const refillData = this.calculateRefillData(medicine)
    
    // Only create alerts for medicines that need refill within 3 days
    if (refillData.daysRemaining <= 3) {
      console.log(`⚠️ Medicine ${medicine.name} needs refill in ${refillData.daysRemaining} days`)
      
      // Update or create refill alert
      const existingAlert = this.refillAlerts.get(medicine.id)
      
      if (existingAlert) {
        // Update existing alert
        existingAlert.daysRemaining = refillData.daysRemaining
        existingAlert.expectedEndDate = refillData.expectedEndDate
        existingAlert.currentStock = refillData.currentStock
        existingAlert.alertLevel = refillData.alertLevel
      } else {
        // Create new alert
        this.refillAlerts.set(medicine.id, {
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          daysRemaining: refillData.daysRemaining,
          expectedEndDate: refillData.expectedEndDate,
          currentStock: refillData.currentStock,
          alertLevel: refillData.alertLevel,
          notificationsSentToday: 0,
          lastNotificationSent: null
        })
      }
    } else {
      // Remove alert if medicine no longer needs refill
      this.refillAlerts.delete(medicine.id)
    }
  }

  // Calculate refill data for a medicine
  calculateRefillData(medicine: Medicine): {
    daysRemaining: number
    expectedEndDate: Date
    currentStock: number
    alertLevel: 'warning' | 'urgent' | 'critical'
  } {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const dosesPerDay = medicine.dosesPerDay || 1
    
    // Calculate days remaining
    const daysRemaining = Math.floor(currentStock / dosesPerDay)
    
    // Calculate expected end date
    const expectedEndDate = new Date()
    expectedEndDate.setDate(expectedEndDate.getDate() + daysRemaining)
    
    // Determine alert level based on 3-2-1 day system
    let alertLevel: 'warning' | 'urgent' | 'critical'
    if (daysRemaining <= 0) {
      alertLevel = 'critical'  // Medicine finished
    } else if (daysRemaining === 1) {
      alertLevel = 'critical'  // Day 1: Critical - 3 notifications
    } else if (daysRemaining === 2) {
      alertLevel = 'urgent'    // Day 2: Urgent - 2 notifications  
    } else if (daysRemaining === 3) {
      alertLevel = 'warning'   // Day 3: Warning - 1 notification
    } else {
      alertLevel = 'warning'   // Default for other cases
    }
    
    return {
      daysRemaining,
      expectedEndDate,
      currentStock,
      alertLevel
    }
  }

  // Check and send scheduled notifications based on your requirements
  checkAndSendScheduledNotifications(): void {
    const now = new Date()
    const today = now.toDateString()
    
    this.refillAlerts.forEach((alert) => {
      // Reset daily notification count if it's a new day
      if (alert.lastNotificationSent && 
          alert.lastNotificationSent.toDateString() !== today) {
        alert.notificationsSentToday = 0
      }
      
      // Reset dismissed status if it's a new day
      if (alert.dismissedDate && alert.dismissedDate !== today) {
        delete alert.dismissedDate
      }
      
      // Determine how many notifications to send based on 3-2-1 day system
      let maxNotificationsToday = 1
      
      if (alert.daysRemaining === 3) {
        maxNotificationsToday = 1 // Day 3: Warning - 1 notification at 9 AM
        console.log(`📅 Day 3 (Warning): ${alert.medicineName} - 1 notification scheduled`)
      } else if (alert.daysRemaining === 2) {
        maxNotificationsToday = 2 // Day 2: Urgent - 2 notifications (9 AM, 6 PM)
        console.log(`📅 Day 2 (Urgent): ${alert.medicineName} - 2 notifications scheduled`)
      } else if (alert.daysRemaining === 1) {
        maxNotificationsToday = 3 // Day 1: Critical - 3 notifications (9 AM, 2 PM, 8 PM)
        console.log(`📅 Day 1 (Critical): ${alert.medicineName} - 3 notifications scheduled`)
      } else if (alert.daysRemaining <= 0) {
        maxNotificationsToday = 3 // Day 0+: Finished - 3 notifications (continues until refilled)
        console.log(`📅 Day 0+ (Finished): ${alert.medicineName} - 3 notifications scheduled`)
      } else {
        maxNotificationsToday = 0 // No notifications for medicines with >3 days remaining
        console.log(`📅 Day ${alert.daysRemaining}: ${alert.medicineName} - No notifications (>3 days remaining)`)
      }
      
      // Check if we should send a notification now
      if (alert.notificationsSentToday < maxNotificationsToday) {
        const shouldSend = this.shouldSendNotificationNow(alert, maxNotificationsToday)
        
        if (shouldSend) {
          this.sendRefillNotification(alert)
          alert.notificationsSentToday++
          alert.lastNotificationSent = now
        }
      }
    })
    
    this.saveRefillAlerts()
  }

  // Determine if we should send a notification now based on timing
  shouldSendNotificationNow(alert: RefillNotificationData, maxNotificationsToday: number): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    
    // Define notification times based on how many we need to send
    let notificationHours: number[] = []
    
    if (maxNotificationsToday === 1) {
      notificationHours = [9] // 9 AM
    } else if (maxNotificationsToday === 2) {
      notificationHours = [9, 18] // 9 AM, 6 PM
    } else if (maxNotificationsToday === 3) {
      notificationHours = [9, 14, 20] // 9 AM, 2 PM, 8 PM
    }
    
    // Check if current hour matches any notification hour
    const shouldSendAtThisHour = notificationHours.includes(currentHour)
    
    if (!shouldSendAtThisHour) return false
    
    // Check if we already sent a notification in this hour today
    if (alert.lastNotificationSent) {
      const lastSentHour = alert.lastNotificationSent.getHours()
      const lastSentDate = alert.lastNotificationSent.toDateString()
      
      if (lastSentDate === now.toDateString() && lastSentHour === currentHour) {
        return false // Already sent in this hour today
      }
    }
    
    return true
  }

  // Send refill notification
  sendRefillNotification(alert: RefillNotificationData): void {
    console.log(`🔔 Sending refill notification for ${alert.medicineName}`)
    
    const message = this.getRefillNotificationMessage(alert)
    
    // Send in-app notification only (no browser notifications)
    window.dispatchEvent(new CustomEvent('refill-notification', {
      detail: {
        type: 'refill',
        medicineId: alert.medicineId,
        medicineName: alert.medicineName,
        message,
        alertLevel: alert.alertLevel,
        daysRemaining: alert.daysRemaining,
        actions: ['refill', 'dismiss']
      }
    }))
  }

  // Get refill notification message based on 3-2-1 day system
  getRefillNotificationMessage(alert: RefillNotificationData): string {
    if (alert.daysRemaining <= 0) {
      return `Your medicine "${alert.medicineName}" has finished. Please refill it immediately.`
    } else if (alert.daysRemaining === 1) {
      return `Your medicine "${alert.medicineName}" will finish tomorrow. Please refill it today.`
    } else if (alert.daysRemaining === 2) {
      return `Your medicine "${alert.medicineName}" will finish in 2 days. Please refill it soon.`
    } else if (alert.daysRemaining === 3) {
      return `Your medicine "${alert.medicineName}" will finish in 3 days. Please refill it soon.`
    } else {
      return `Your medicine "${alert.medicineName}" will finish in ${alert.daysRemaining} days. Please refill it soon.`
    }
  }

  // Handle refill notification click
  handleRefillNotificationClick(medicineId: number): void {
    // Navigate to medicine details or refill page
    window.dispatchEvent(new CustomEvent('navigate-to-refill', {
      detail: { medicineId }
    }))
  }

  // Confirm medicine refill
  async confirmRefill(medicineId: number, refillQuantity: number): Promise<boolean> {
    try {
      console.log(`✅ Confirming refill for medicine ${medicineId} with quantity ${refillQuantity}`)
      
      // Call backend API to refill medicine
      const updatedMedicine = await medicineApi.refillMedicine(medicineId, refillQuantity)
      
      // Remove from refill alerts
      this.refillAlerts.delete(medicineId)
      this.saveRefillAlerts()
      
      // Show success notification
      window.dispatchEvent(new CustomEvent('refill-confirmed', {
        detail: {
          medicineId,
          refillQuantity,
          medicine: updatedMedicine,
          message: 'Medicine refilled successfully!'
        }
      }))
      
      // Schedule new refill reminders for this medicine if needed
      try {
        await medicineApi.scheduleRefillRemindersForAllMedicines()
      } catch (scheduleError) {
        console.warn('Failed to schedule new refill reminders:', scheduleError)
      }
      
      // Recheck this medicine for future refill needs
      await this.checkMedicineForRefill(updatedMedicine)
      
      return true
    } catch (error) {
      console.error('Error confirming refill:', error)
      
      // Show error notification
      window.dispatchEvent(new CustomEvent('refill-error', {
        detail: {
          medicineId,
          message: 'Failed to confirm refill. Please try again.'
        }
      }))
      
      return false
    }
  }

  // Dismiss refill alert (snooze for 1 day)
  dismissRefillAlert(medicineId: number): void {
    const alert = this.refillAlerts.get(medicineId)
    if (alert) {
      const today = new Date().toDateString()
      
      console.log(`😴 Dismissing refill alert for ${alert.medicineName}`)
      console.log('   - Before dismiss:', { 
        dismissedDate: alert.dismissedDate, 
        notificationsSentToday: alert.notificationsSentToday 
      })
      
      // Mark as dismissed for today
      alert.notificationsSentToday = 999 // High number to prevent more notifications
      alert.lastNotificationSent = new Date()
      alert.dismissedDate = today
      
      console.log('   - After dismiss:', { 
        dismissedDate: alert.dismissedDate, 
        notificationsSentToday: alert.notificationsSentToday,
        today: today
      })
      
      this.saveRefillAlerts()
      
      console.log(`✅ Dismissed refill alert for ${alert.medicineName} for today (${today})`)
    } else {
      console.error(`❌ Could not find alert for medicine ID: ${medicineId}`)
    }
  }

  // Get all active refill alerts (excluding dismissed ones for today)
  getActiveRefillAlerts(): RefillNotificationData[] {
    const today = new Date().toDateString()
    const allAlerts = Array.from(this.refillAlerts.values())
    
    console.log('🔍 Getting active refill alerts:')
    console.log('   - Today:', today)
    console.log('   - Total alerts:', allAlerts.length)
    
    const activeAlerts = allAlerts.filter(alert => {
      const isDismissedToday = alert.dismissedDate === today
      
      // Additional validation: ensure this is actually a medicine refill alert
      const isValidRefillAlert = (
        alert.medicineId && 
        alert.medicineName && 
        typeof alert.daysRemaining === 'number' &&
        alert.currentStock !== undefined &&
        alert.alertLevel &&
        !alert.medicineName.toLowerCase().includes('custom reminder')
      )
      
      console.log(`   - ${alert.medicineName}: dismissed=${alert.dismissedDate}, isDismissedToday=${isDismissedToday}, isValid=${isValidRefillAlert}`)
      
      // Show alert if it's not dismissed today AND it's a valid refill alert
      return !isDismissedToday && isValidRefillAlert
    })
    
    console.log('   - Active alerts after filtering:', activeAlerts.length)
    return activeAlerts
  }

  // Get refill alert for specific medicine
  getRefillAlert(medicineId: number): RefillNotificationData | null {
    return this.refillAlerts.get(medicineId) || null
  }

  // Mark medicine as finished (when stock reaches 0)
  async markMedicineAsFinished(medicineId: number): Promise<void> {
    try {
      // Update medicine stock to 0
      await medicineApi.updateMedicineStock(medicineId, 0)
      
      // Keep the refill alert but mark as critical
      const alert = this.refillAlerts.get(medicineId)
      if (alert) {
        alert.daysRemaining = 0
        alert.currentStock = 0
        alert.alertLevel = 'critical'
        alert.notificationsSentToday = 0 // Reset to allow notifications
      }
      
      this.saveRefillAlerts()
      
      console.log(`🚨 Medicine ${medicineId} marked as finished`)
    } catch (error) {
      console.error('Error marking medicine as finished:', error)
    }
  }

  // Save refill alerts to localStorage
  saveRefillAlerts(): void {
    const alertsData = Array.from(this.refillAlerts.entries()).map(([id, alert]) => [
      id,
      {
        ...alert,
        expectedEndDate: alert.expectedEndDate.toISOString(),
        lastNotificationSent: alert.lastNotificationSent?.toISOString() || null,
        dismissedDate: alert.dismissedDate || null
      }
    ])
    
    localStorage.setItem('refill_alerts', JSON.stringify(alertsData))
  }

  // Load refill alerts from localStorage
  loadRefillAlerts(): void {
    try {
      const saved = localStorage.getItem('refill_alerts')
      if (saved) {
        const alertsData = JSON.parse(saved)
        
        alertsData.forEach(([id, alert]: [number, any]) => {
          // Validate that this is actually a refill alert before loading
          const isValidRefillAlert = (
            alert.medicineId && 
            alert.medicineName && 
            typeof alert.daysRemaining === 'number' &&
            alert.currentStock !== undefined &&
            alert.alertLevel &&
            !alert.medicineName.toLowerCase().includes('custom reminder') &&
            !alert.medicineName.toLowerCase().includes('do exercise') &&
            !alert.medicineName.toLowerCase().includes('reminder:')
          )
          
          if (isValidRefillAlert) {
            this.refillAlerts.set(id, {
              ...alert,
              expectedEndDate: new Date(alert.expectedEndDate),
              lastNotificationSent: alert.lastNotificationSent ? new Date(alert.lastNotificationSent) : null,
              dismissedDate: alert.dismissedDate || undefined
            })
          } else {
            console.log(`🗑️ Skipping invalid refill alert during load: ${alert.medicineName}`)
          }
        })
      }
    } catch (error) {
      console.error('Error loading refill alerts:', error)
      // Clear corrupted data
      localStorage.removeItem('refill_alerts')
    }
  }

  // Clean up invalid alerts (e.g., custom reminders that got mixed in)
  cleanupInvalidAlerts(): void {
    const invalidKeys: number[] = []
    
    this.refillAlerts.forEach((alert, key) => {
      // Check if this looks like a custom reminder or invalid data
      const isInvalid = (
        !alert.medicineId ||
        !alert.medicineName ||
        typeof alert.daysRemaining !== 'number' ||
        alert.currentStock === undefined ||
        !alert.alertLevel ||
        alert.medicineName.toLowerCase().includes('custom reminder') ||
        alert.medicineName.toLowerCase().includes('do exercise') ||
        alert.medicineName.toLowerCase().includes('reminder:')
      )
      
      if (isInvalid) {
        console.log(`🗑️ Removing invalid refill alert: ${alert.medicineName}`)
        invalidKeys.push(key)
      }
    })
    
    // Remove invalid alerts
    invalidKeys.forEach(key => {
      this.refillAlerts.delete(key)
    })
    
    if (invalidKeys.length > 0) {
      console.log(`✅ Cleaned up ${invalidKeys.length} invalid refill alerts`)
      this.saveRefillAlerts()
      
      // Dispatch event to update UI components
      window.dispatchEvent(new CustomEvent('refill-alerts-updated', {
        detail: { alertCount: this.refillAlerts.size }
      }))
    }
  }

  // Clear all refill alert data (for debugging/reset purposes)
  clearAllRefillData(): void {
    console.log('🗑️ Clearing all refill alert data')
    this.refillAlerts.clear()
    localStorage.removeItem('refill_alerts')
    console.log('✅ All refill alert data cleared')
    
    // Dispatch event to update UI components
    window.dispatchEvent(new CustomEvent('refill-alerts-updated', {
      detail: { alertCount: 0 }
    }))
  }

  // Cleanup method
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    
    this.refillAlerts.clear()
  }
}

export const refillNotificationService = new RefillNotificationService()