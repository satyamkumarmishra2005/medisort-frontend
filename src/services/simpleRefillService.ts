export interface SimpleRefillAlert {
  id: number
  medicineId: number
  medicineName: string
  dosage: string
  daysRemaining: number
  currentStock: number
  alertLevel: 'warning' | 'urgent' | 'critical'
  expectedEndDate: Date
}

class SimpleRefillNotificationService {
  private alerts: SimpleRefillAlert[] = []
  private isScheduleStarted: boolean = false

  // Get active refill alerts
  getActiveRefillAlerts(): SimpleRefillAlert[] {
    return this.alerts.filter(alert => !this.isAlertDismissed(alert.id))
  }

  // Check if alert is dismissed for today
  private isAlertDismissed(alertId: number): boolean {
    const today = new Date().toDateString()
    const dismissedKey = `refill_dismissed_${alertId}_${today}`
    return localStorage.getItem(dismissedKey) === 'true'
  }

  // Dismiss alert for today
  dismissAlert(alertId: number): void {
    const today = new Date().toDateString()
    const dismissedKey = `refill_dismissed_${alertId}_${today}`
    localStorage.setItem(dismissedKey, 'true')
    
    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent('refill-alert-dismissed', {
      detail: { alertId }
    }))
  }

  // Confirm refill (removes alert completely)
  confirmRefill(alertId: number): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId)
    
    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent('refill-confirmed', {
      detail: { alertId }
    }))
  }

  // Check medicines for refill needs (mock implementation)
  async checkAllMedicinesForRefill(): Promise<void> {
    // Start notification schedule if not already started
    if (!this.isScheduleStarted) {
      this.startRefillNotificationSchedule()
      this.isScheduleStarted = true
    }

    // Mock data - in real app this would fetch from API
    const mockMedicines = [
      {
        id: 1,
        name: "qazxc",
        dosage: "500mg",
        currentStock: 4,
        dosesPerDay: 2
        // Will calculate: 4 doses ÷ 2 per day = 2 days remaining
      },
      {
        id: 2,
        name: "lpop", 
        dosage: "250mg",
        currentStock: 10,
        dosesPerDay: 2
        // Will calculate: 10 doses ÷ 2 per day = 5 days remaining
      },
      {
        id: 3,
        name: "kpop",
        dosage: "500mg", 
        currentStock: 11,  // ✅ Updated to match your image (11 units)
        dosesPerDay: 1     // ✅ Updated to match your image (1/day frequency)
        // Will calculate: 11 doses ÷ 1 per day = 11 days remaining
      }
    ]

    this.alerts = []

    for (const medicine of mockMedicines) {
      // Calculate days remaining based on current stock and daily usage
      const daysRemaining = this.calculateDaysRemaining(medicine.currentStock, medicine.dosesPerDay)
      
      if (daysRemaining <= 14) { // Show medicines expiring within 2 weeks
        let alertLevel: 'warning' | 'urgent' | 'critical' = 'warning'
        
        if (daysRemaining <= 0) {
          alertLevel = 'critical'
        } else if (daysRemaining <= 3) {
          alertLevel = 'critical'
        } else if (daysRemaining <= 7) {
          alertLevel = 'urgent'
        } else {
          alertLevel = 'warning' // 8-14 days remaining
        }

        // Calculate expected end date based on days remaining
        const expectedEndDate = new Date()
        expectedEndDate.setDate(expectedEndDate.getDate() + daysRemaining)

        this.alerts.push({
          id: medicine.id,
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          daysRemaining,
          currentStock: medicine.currentStock,
          alertLevel,
          expectedEndDate
        })
      }
    }

    // Dispatch event to notify UI
    window.dispatchEvent(new CustomEvent('refill-alerts-updated', {
      detail: { alertCount: this.alerts.length }
    }))
  }

  // Calculate days remaining based on current stock and usage
  private calculateDaysRemaining(currentStock: number, dosesPerDay: number): number {
    if (dosesPerDay <= 0) return 0
    return Math.floor(currentStock / dosesPerDay)
  }

  // Show in-app notification for refill alert
  showRefillNotification(alert: SimpleRefillAlert): void {
    console.log(`🔔 Showing in-app notification for refill alert: ${alert.medicineName}`)

    // Dispatch custom event for in-app notification display
    const event = new CustomEvent('refill-alert-notification', {
      detail: alert
    })
    window.dispatchEvent(event)

    // Play notification sound
    this.playNotificationSound()
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      // Create a pleasant notification chime using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create a pleasant two-tone chime for refill alerts
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        // Smooth envelope
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }

      // Play a gentle A-C# chord for refill alerts
      const now = audioContext.currentTime
      playTone(440, now, 0.4) // A4
      playTone(554.37, now + 0.2, 0.4) // C#5

      console.log('🔊 Refill alert notification sound played')
    } catch (error) {
      console.log('🔇 Could not play notification sound:', error)
    }
  }

  // Auto-trigger refill notifications based on schedule
  async startRefillNotificationSchedule(): Promise<void> {
    console.log('🔔 Starting refill notification schedule')
    
    // Check every 30 seconds for refill alerts
    setInterval(async () => {
      await this.checkForScheduledRefillNotifications()
    }, 30000)

    // Initial check
    await this.checkForScheduledRefillNotifications()
  }

  // Check for scheduled refill notifications
  private async checkForScheduledRefillNotifications(): Promise<void> {
    try {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const today = now.toDateString()

      // Check at specific times: 9:00 AM, 2:00 PM, 6:00 PM, 8:00 PM
      const notificationTimes = [
        { hour: 9, minute: 0 },   // 9:00 AM
        { hour: 14, minute: 0 },  // 2:00 PM  
        { hour: 18, minute: 0 },  // 6:00 PM
        { hour: 20, minute: 0 }   // 8:00 PM
      ]

      const isNotificationTime = notificationTimes.some(time => 
        currentHour === time.hour && 
        currentMinute >= time.minute && 
        currentMinute < time.minute + 2 // 2-minute window
      )

      if (!isNotificationTime) {
        return
      }

      console.log(`🕐 Checking for refill notifications at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`)

      // Get current alerts
      await this.checkAllMedicinesForRefill()
      const alerts = this.getActiveRefillAlerts()

      for (const alert of alerts) {
        // Check if we should notify based on days remaining and notification frequency
        const shouldNotify = this.shouldSendRefillNotification(alert, currentHour, today)
        
        if (shouldNotify) {
          console.log(`📦 Sending refill notification for ${alert.medicineName}`)
          this.showRefillNotification(alert)
          
          // Mark as notified
          const notificationKey = `refill_notified_${alert.id}_${today}_${currentHour}`
          localStorage.setItem(notificationKey, 'true')
        }
      }

    } catch (error) {
      console.error('Error checking scheduled refill notifications:', error)
    }
  }

  // Determine if we should send a refill notification
  private shouldSendRefillNotification(alert: SimpleRefillAlert, currentHour: number, today: string): boolean {
    const notificationKey = `refill_notified_${alert.id}_${today}_${currentHour}`
    const alreadyNotified = localStorage.getItem(notificationKey)
    
    if (alreadyNotified) {
      return false
    }

    // Progressive notification schedule based on days remaining
    if (alert.daysRemaining <= 0) {
      // Medicine finished - notify 3 times daily (9 AM, 2 PM, 8 PM)
      return [9, 14, 20].includes(currentHour)
    } else if (alert.daysRemaining <= 3) {
      // 1-3 days remaining - notify 3 times daily (9 AM, 2 PM, 8 PM)
      return [9, 14, 20].includes(currentHour)
    } else if (alert.daysRemaining <= 7) {
      // 4-7 days remaining - notify 2 times daily (9 AM, 6 PM)
      return [9, 18].includes(currentHour)
    } else if (alert.daysRemaining <= 14) {
      // 8-14 days remaining - notify 1 time daily (9 AM)
      return currentHour === 9
    }

    return false
  }

  // Get current alerts data for debugging
  getCurrentAlertsData(): SimpleRefillAlert[] {
    return this.alerts
  }

  // Display current data structure
  logCurrentData(): void {
    console.log('📊 Current Refill Alerts Data:')
    console.table(this.alerts.map(alert => ({
      ID: alert.id,
      Medicine: alert.medicineName,
      Dosage: alert.dosage,
      'Days Left': alert.daysRemaining,
      'Current Stock': alert.currentStock,
      'Alert Level': alert.alertLevel,
      'Expected End': alert.expectedEndDate.toLocaleDateString()
    })))
  }
}

// Export singleton instance
export const simpleRefillService = new SimpleRefillNotificationService()