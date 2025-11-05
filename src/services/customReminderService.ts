import axios, { AxiosResponse } from 'axios'

/**
 * Service for managing custom reminders (backend integrated)
 * These reminders are stored in the backend and sync across devices
 */

export interface CustomReminder {
  id?: number
  title: string
  time: string
  frequency: string
  isActive: boolean
  type: 'custom'
  daysOfWeek?: number[] // 0-6, Sunday to Saturday
  isRecurring?: boolean
  label?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomReminderRequest {
  title: string
  time: string
  frequency: string
  isActive?: boolean
  daysOfWeek?: number[]
  isRecurring?: boolean
  label?: string
  notes?: string
}

export interface CustomReminderStats {
  totalReminders: number
  activeReminders: number
  todaysReminders: number
  upcomingReminders: number
}

const API_BASE_URL = 'http://54.226.134.50:8080'
const STORAGE_KEY = 'custom_reminders_cache' // For offline caching

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medisort_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

class CustomReminderService {
  
  private handleError(error: any): never {
    console.error('🚨 Custom Reminder API Error:', error)

    if (error.response) {
      const status = error.response.status
      let message = error.response.data?.message || `HTTP error! status: ${status}`

      if (status === 401) {
        message = 'Authentication required'
        localStorage.removeItem('medisort_token')
        localStorage.removeItem('medisort_user')
      } else if (status === 403) {
        message = 'Access denied - insufficient permissions'
      } else if (status === 404) {
        message = 'Custom reminder not found'
      } else if (status >= 500) {
        message = 'Server error - please try again later'
      }

      throw new Error(message)
    } else if (error.request) {
      console.error('🌐 Network error - falling back to local storage')
      throw new Error('Network error - please check your connection')
    } else {
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }

  // Local storage fallback methods
  private getLocalReminders(): CustomReminder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading cached custom reminders:', error)
      return []
    }
  }

  private saveLocalReminders(reminders: CustomReminder[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
    } catch (error) {
      console.error('Error caching custom reminders:', error)
    }
  }

  // Backend API methods
  async getAllReminders(): Promise<CustomReminder[]> {
    // DEBUG: Log who is calling this function
    console.trace('🔍 getAllReminders() called from:')
    
    try {
      // Use the ApiService instead of direct axios call
      const result = await (await import('./api')).default.getAllCustomReminders()
      
      if (result.success && result.data) {
        const reminders = result.data as CustomReminder[]
        
        // DEBUG: Log all reminders to see if Vitamin A is coming from backend
        console.log('🔍 Reminders from backend:', reminders.map(r => ({ id: r.id, title: r.title })))
        
        // Check for vitamin reminders specifically
        const vitaminReminders = reminders.filter(r => r.title?.toLowerCase().includes('vitamin'))
        if (vitaminReminders.length > 0) {
          console.warn('⚠️ FOUND VITAMIN REMINDERS FROM BACKEND:', vitaminReminders)
        }
        
        // Cache for offline use, but clear old cache first
        localStorage.removeItem(STORAGE_KEY)
        this.saveLocalReminders(reminders)
        
        console.log(`✅ Loaded ${reminders.length} reminders from backend`)
        return reminders
      } else {
        throw new Error(result.message || 'Failed to fetch reminders')
      }
    } catch (error) {
      console.warn('❌ Failed to fetch reminders from backend, using cached data')
      const cachedReminders = this.getLocalReminders()
      
      // DEBUG: Log cached reminders to see if Vitamin A is in cache
      console.log('🔍 Cached reminders:', cachedReminders.map(r => ({ id: r.id, title: r.title })))
      
      const vitaminCached = cachedReminders.filter(r => r.title?.toLowerCase().includes('vitamin'))
      if (vitaminCached.length > 0) {
        console.warn('⚠️ FOUND VITAMIN REMINDERS IN CACHE:', vitaminCached)
      }
      
      console.warn(`📦 Using ${cachedReminders.length} cached reminders (may be stale)`)
      return cachedReminders
    }
  }

  async getActiveReminders(): Promise<CustomReminder[]> {
    try {
      const result = await (await import('./api')).default.getActiveCustomReminders()
      
      if (result.success && result.data) {
        return result.data as CustomReminder[]
      } else {
        throw new Error(result.message || 'Failed to fetch active reminders')
      }
    } catch (error) {
      console.error('❌ Failed to fetch active reminders from backend, not using cache to prevent stale data')
      throw error // Don't use cache fallback
    }
  }

  async createReminder(reminderData: CustomReminderRequest): Promise<CustomReminder> {
    try {
      const requestData = {
        title: reminderData.title.trim(),
        time: reminderData.time,
        frequency: reminderData.frequency,
        isActive: reminderData.isActive ?? true,
        daysOfWeek: reminderData.daysOfWeek || [],
        isRecurring: reminderData.isRecurring ?? true,
        label: reminderData.label?.trim() || null,
        notes: reminderData.notes?.trim() || null
      }
      
      const result = await (await import('./api')).default.createCustomReminder(requestData)
      
      if (result.success && result.data) {
        const newReminder = result.data as CustomReminder
        
        // Update local cache
        const cachedReminders = this.getLocalReminders()
        cachedReminders.push(newReminder)
        this.saveLocalReminders(cachedReminders)
        
        return newReminder
      } else {
        throw new Error(result.message || 'Failed to create reminder')
      }
    } catch (error) {
      // Fallback to local storage if backend fails
      console.warn('Backend unavailable, creating reminder locally')
      const localReminders = this.getLocalReminders()
      
      const newReminder: CustomReminder = {
        id: Date.now(), // Temporary ID
        title: reminderData.title.trim(),
        time: reminderData.time,
        frequency: reminderData.frequency,
        isActive: reminderData.isActive ?? true,
        type: 'custom',
        daysOfWeek: reminderData.daysOfWeek || [],
        isRecurring: reminderData.isRecurring ?? true,
        label: reminderData.label?.trim() || undefined,
        notes: reminderData.notes?.trim() || undefined,
        createdAt: new Date().toISOString()
      }

      localReminders.push(newReminder)
      this.saveLocalReminders(localReminders)
      
      return newReminder
    }
  }

  async updateReminder(id: number, updates: Partial<CustomReminderRequest>): Promise<CustomReminder> {
    try {
      const result = await (await import('./api')).default.updateCustomReminder(id, updates)
      
      if (result.success && result.data) {
        const updatedReminder = result.data as CustomReminder
        
        // Update local cache
        const cachedReminders = this.getLocalReminders()
        const index = cachedReminders.findIndex(r => r.id === id)
        if (index !== -1) {
          cachedReminders[index] = updatedReminder
          this.saveLocalReminders(cachedReminders)
        }
        
        return updatedReminder
      } else {
        throw new Error(result.message || 'Failed to update reminder')
      }
    } catch (error) {
      // Fallback to local storage
      console.warn('Backend unavailable, updating reminder locally')
      const localReminders = this.getLocalReminders()
      const index = localReminders.findIndex(r => r.id === id)
      
      if (index === -1) {
        throw new Error('Reminder not found')
      }

      const updatedReminder = {
        ...localReminders[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      localReminders[index] = updatedReminder
      this.saveLocalReminders(localReminders)
      
      return updatedReminder
    }
  }

  async deleteReminder(id: number): Promise<boolean> {
    try {
      const result = await (await import('./api')).default.deleteCustomReminder(id)
      
      if (result.success) {
        // Force clear cache to prevent deleted items from reappearing
        localStorage.removeItem(STORAGE_KEY)
        console.log(`✅ Reminder ${id} deleted successfully and cache cleared`)
        
        return true
      } else {
        throw new Error(result.message || 'Failed to delete reminder')
      }
    } catch (error) {
      console.error('❌ Failed to delete reminder from backend:', error)
      // Don't use local fallback for delete operations to prevent inconsistency
      throw error
    }
  }

  async toggleReminderStatus(id: number): Promise<CustomReminder> {
    try {
      const result = await (await import('./api')).default.toggleCustomReminderStatus(id)
      
      if (result.success && result.data) {
        const updatedReminder = result.data as CustomReminder
        
        // Update local cache
        const cachedReminders = this.getLocalReminders()
        const index = cachedReminders.findIndex(r => r.id === id)
        if (index !== -1) {
          cachedReminders[index] = updatedReminder
          this.saveLocalReminders(cachedReminders)
        }
        
        return updatedReminder
      } else {
        throw new Error(result.message || 'Failed to toggle reminder status')
      }
    } catch (error) {
      // Fallback to local storage
      const localReminders = this.getLocalReminders()
      const reminder = localReminders.find(r => r.id === id)
      
      if (!reminder) {
        throw new Error('Reminder not found')
      }

      return this.updateReminder(id, { isActive: !reminder.isActive })
    }
  }

  async getReminderById(id: number): Promise<CustomReminder | null> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/custom-reminders/${id}`)
      return response.data
    } catch (error) {
      // Fallback to local storage
      const localReminders = this.getLocalReminders()
      return localReminders.find(r => r.id === id) || null
    }
  }

  // Utility methods
  async getTodaysReminders(): Promise<CustomReminder[]> {
    // DEBUG: Log who is calling this function
    console.trace('🔍 getTodaysReminders() called from:')
    
    try {
      const result = await (await import('./api')).default.getTodaysCustomReminders()
      
      if (result.success && result.data) {
        const todaysReminders = result.data as CustomReminder[]
        
        // DEBUG: Check for vitamin reminders
        const vitaminToday = todaysReminders.filter(r => r.title?.toLowerCase().includes('vitamin'))
        if (vitaminToday.length > 0) {
          console.warn('⚠️ FOUND VITAMIN IN TODAY\'S REMINDERS FROM BACKEND:', vitaminToday)
        }
        
        return todaysReminders
      } else {
        throw new Error(result.message || 'Failed to fetch today\'s reminders')
      }
    } catch (error) {
      console.warn('Backend unavailable, calculating today\'s reminders locally')
      const activeReminders = await this.getActiveReminders()
      const now = new Date()
      const currentDayOfWeek = now.getDay()

      const filteredReminders = activeReminders.filter(reminder => {
        // Check if reminder should trigger today based on frequency and days of week
        if (reminder.frequency === 'daily') {
          return true
        }
        
        if (reminder.frequency === 'weekly' && reminder.daysOfWeek) {
          return reminder.daysOfWeek.includes(currentDayOfWeek)
        }
        
        if (reminder.frequency === 'monthly') {
          // For monthly reminders, check if it's the right day of month
          return true
        }
        
        if (reminder.isRecurring && reminder.daysOfWeek) {
          return reminder.daysOfWeek.includes(currentDayOfWeek)
        }
        
        return reminder.frequency === 'as-needed'
      }).sort((a, b) => {
        // Sort by time
        const timeA = a.time.split(':').map(Number)
        const timeB = b.time.split(':').map(Number)
        const minutesA = timeA[0] * 60 + timeA[1]
        const minutesB = timeB[0] * 60 + timeB[1]
        return minutesA - minutesB
      })
      
      // DEBUG: Check for vitamin reminders in filtered results
      const vitaminFiltered = filteredReminders.filter(r => r.title?.toLowerCase().includes('vitamin'))
      if (vitaminFiltered.length > 0) {
        console.warn('⚠️ FOUND VITAMIN IN FILTERED TODAY\'S REMINDERS:', vitaminFiltered)
      }
      
      return filteredReminders
    }
  }

  async getUpcomingReminders(hoursAhead: number = 2): Promise<CustomReminder[]> {
    try {
      const result = await (await import('./api')).default.getUpcomingCustomReminders(hoursAhead)
      
      if (result.success && result.data) {
        return result.data as CustomReminder[]
      } else {
        throw new Error(result.message || 'Failed to fetch upcoming reminders')
      }
    } catch (error) {
      console.warn('Backend unavailable, calculating upcoming reminders locally')
      const activeReminders = await this.getActiveReminders()
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const futureTime = currentTime + (hoursAhead * 60)

      return activeReminders.filter(reminder => {
        const [hours, minutes] = reminder.time.split(':').map(Number)
        const reminderTime = hours * 60 + minutes
        
        return reminderTime >= currentTime && reminderTime <= futureTime
      })
    }
  }

  async getOverdueReminders(): Promise<CustomReminder[]> {
    try {
      const result = await (await import('./api')).default.getOverdueCustomReminders()
      
      if (result.success && result.data) {
        return result.data as CustomReminder[]
      } else {
        throw new Error(result.message || 'Failed to fetch overdue reminders')
      }
    } catch (error) {
      console.warn('Backend unavailable, calculating overdue reminders locally')
      const todaysReminders = await this.getTodaysReminders()
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()

      return todaysReminders.filter(reminder => {
        const [hours, minutes] = reminder.time.split(':').map(Number)
        const reminderTime = hours * 60 + minutes
        
        return reminderTime < currentTime
      })
    }
  }

  async getCustomReminderStats(): Promise<CustomReminderStats> {
    try {
      const result = await (await import('./api')).default.getCustomReminderStats()
      
      if (result.success && result.data) {
        return result.data as CustomReminderStats
      } else {
        throw new Error(result.message || 'Failed to fetch reminder stats')
      }
    } catch (error) {
      console.warn('Backend unavailable, calculating stats locally')
      const [allReminders, activeReminders, todaysReminders, upcomingReminders] = await Promise.all([
        this.getAllReminders(),
        this.getActiveReminders(),
        this.getTodaysReminders(),
        this.getUpcomingReminders()
      ])

      return {
        totalReminders: allReminders.length,
        activeReminders: activeReminders.length,
        todaysReminders: todaysReminders.length,
        upcomingReminders: upcomingReminders.length
      }
    }
  }

  // Bulk operations
  async createMultipleReminders(reminders: CustomReminderRequest[]): Promise<CustomReminder[]> {
    try {
      const response: AxiosResponse = await apiClient.post('/api/custom-reminders/bulk', {
        reminders
      })
      
      const createdReminders = response.data
      
      // Update local cache
      const cachedReminders = this.getLocalReminders()
      cachedReminders.push(...createdReminders)
      this.saveLocalReminders(cachedReminders)
      
      return createdReminders
    } catch (error) {
      console.warn('Backend unavailable, creating reminders locally')
      const localReminders = this.getLocalReminders()
      const createdReminders: CustomReminder[] = []
      
      for (let i = 0; i < reminders.length; i++) {
        const reminderData = reminders[i]
        const newReminder: CustomReminder = {
          id: Date.now() + i, // Temporary ID
          title: reminderData.title.trim(),
          time: reminderData.time,
          frequency: reminderData.frequency,
          isActive: reminderData.isActive ?? true,
          type: 'custom',
          daysOfWeek: reminderData.daysOfWeek || [],
          isRecurring: reminderData.isRecurring ?? true,
          label: reminderData.label?.trim() || undefined,
          notes: reminderData.notes?.trim() || undefined,
          createdAt: new Date().toISOString()
        }
        
        localReminders.push(newReminder)
        createdReminders.push(newReminder)
      }
      
      this.saveLocalReminders(localReminders)
      return createdReminders
    }
  }

  // Export/Import functionality
  async exportReminders(): Promise<string> {
    const reminders = await this.getAllReminders()
    return JSON.stringify(reminders, null, 2)
  }

  async importReminders(jsonData: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const importedReminders = JSON.parse(jsonData)
      
      if (!Array.isArray(importedReminders)) {
        throw new Error('Invalid data format - expected array')
      }

      const errors: string[] = []
      const validReminders: CustomReminderRequest[] = []

      for (const reminder of importedReminders) {
        try {
          // Validate required fields
          if (!reminder.title || !reminder.time || !reminder.frequency) {
            errors.push(`Skipped reminder: missing required fields`)
            continue
          }

          validReminders.push({
            title: reminder.title,
            time: reminder.time,
            frequency: reminder.frequency,
            isActive: reminder.isActive ?? true,
            daysOfWeek: reminder.daysOfWeek || [],
            isRecurring: reminder.isRecurring ?? true,
            label: reminder.label || undefined,
            notes: reminder.notes || undefined
          })
        } catch (error) {
          errors.push(`Error validating reminder "${reminder.title}": ${error}`)
        }
      }

      const createdReminders = await this.createMultipleReminders(validReminders)
      
      return {
        success: true,
        imported: createdReminders.length,
        errors
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Failed to parse import data: ${error}`]
      }
    }
  }

  // Sync methods
  async syncWithBackend(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      // Get local reminders that might not be synced
      const localReminders = this.getLocalReminders()
      const backendReminders = await this.getAllReminders()
      
      const errors: string[] = []
      let synced = 0
      
      // Find local reminders that don't exist on backend (have temporary IDs)
      const unsyncedReminders = localReminders.filter(local => 
        !local.id || local.id > 1000000000000 // Temporary IDs are timestamps
      )
      
      if (unsyncedReminders.length > 0) {
        const reminderRequests: CustomReminderRequest[] = unsyncedReminders.map(reminder => ({
          title: reminder.title,
          time: reminder.time,
          frequency: reminder.frequency,
          isActive: reminder.isActive,
          daysOfWeek: reminder.daysOfWeek,
          isRecurring: reminder.isRecurring,
          label: reminder.label,
          notes: reminder.notes
        }))
        
        const createdReminders = await this.createMultipleReminders(reminderRequests)
        synced = createdReminders.length
      }
      
      // Update local cache with backend data
      this.saveLocalReminders(backendReminders)
      
      return {
        success: true,
        synced,
        errors
      }
    } catch (error) {
      return {
        success: false,
        synced: 0,
        errors: [`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  // Test reminder delivery (for development/testing)
  async testReminderDelivery(reminderId: number): Promise<{ success: boolean; message: string }> {
    try {
      // This would be a special endpoint to manually trigger a reminder
      const response = await apiClient.post(`/api/custom-reminders/${reminderId}/test-delivery`)
      return {
        success: true,
        message: 'Test notification sent successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send test notification'
      }
    }
  }

  // Get current time in HH:mm format
  getCurrentTime(): string {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  // Check if a reminder should trigger at current time
  shouldTriggerNow(reminder: CustomReminder): boolean {
    const now = new Date()
    const currentTime = this.getCurrentTime()
    const currentDayOfWeek = now.getDay()

    // Check time match (within 1 minute)
    const [currentHour, currentMinute] = currentTime.split(':').map(Number)
    const [reminderHour, reminderMinute] = reminder.time.split(':').map(Number)
    
    const currentMinutes = currentHour * 60 + currentMinute
    const reminderMinutes = reminderHour * 60 + reminderMinute
    
    const timeDifference = Math.abs(currentMinutes - reminderMinutes)
    if (timeDifference > 1) return false

    // Check day of week
    if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
      return reminder.daysOfWeek.includes(currentDayOfWeek)
    }

    // If no specific days, it's daily
    return true
  }

  // Force refresh from backend (clears cache)
  async forceRefreshFromBackend(): Promise<CustomReminder[]> {
    console.log('🔄 Force refreshing reminders from backend...')
    
    // Clear cache first
    localStorage.removeItem(STORAGE_KEY)
    
    try {
      const result = await (await import('./api')).default.getAllCustomReminders()
      
      if (result.success && result.data) {
        const reminders = result.data as CustomReminder[]
        this.saveLocalReminders(reminders)
        console.log(`✅ Force refresh successful: ${reminders.length} reminders loaded`)
        return reminders
      } else {
        throw new Error(result.message || 'Failed to fetch reminders')
      }
    } catch (error) {
      console.error('❌ Force refresh failed:', error)
      throw error
    }
  }

  // Clear all cache (useful for debugging)
  clearCache(): void {
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ Custom reminders cache cleared')
  }

  // Clear all reminders (useful for testing)
  async clearAllReminders(): Promise<void> {
    try {
      await apiClient.delete('/api/custom-reminders/all')
      localStorage.removeItem(STORAGE_KEY)
      console.log('🗑️ All reminders cleared from backend and cache')
    } catch (error) {
      console.warn('Backend unavailable, clearing local reminders only')
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

export const customReminderService = new CustomReminderService()