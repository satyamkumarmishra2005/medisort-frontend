import axios, { AxiosResponse } from 'axios'

export interface Medicine {
  id?: number
  name: string
  dosage: string
  category: string
  manufacturer?: string
  notes?: string
  startDate: string
  durationDays: number
  totalQuantity: number
  dosesPerDay: number
  longTerm: boolean
  alertBeforeFinish: boolean
  currentStock?: number
  expectedEndDate?: string
  frequency?: string
  user?: {
    id: number
    username: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface MedicineRequest {
  name: string
  dosage: string
  category: string
  manufacturer?: string
  notes?: string
  startDate: string
  durationDays: number
  totalQuantity: number
  dosesPerDay: number
  longTerm: boolean
  alertBeforeFinish: boolean
  currentStock?: number
  frequency?: string
  reminderTimes?: string[]
}

export interface MedicineReminder {
  id?: number
  medicineId: number
  medicineName?: string
  reminderTime: string
  frequency: string
  isActive: boolean
  nextReminder?: string
  createdAt?: string
}

export interface ReminderRequest {
  reminderTime: string
  frequency: string
}

export interface MedicineStats {
  totalMedicines: number
  expiringThisWeek: number
  expiringThisMonth: number
  activeReminders: number
  lowStockMedicines?: number
  overdueReminders?: number
}

// Refill-related interfaces
export interface RefillRequest {
  refillQuantity: number
}

export interface RefillReminder {
  id?: number
  medicineId: number
  reminderDate: string
  reminderTimes: string[]
  daysBeforeEnd: number
  isActive: boolean
  createdAt?: string
}

export interface RefillStatus {
  medicineId: number
  currentStock: number
  daysUntilEmpty: number
  needsRefill: boolean
  refillAlertLevel: 'none' | 'low' | 'critical'
  expectedEndDate: string
}

// OCR-related interfaces
export interface ExtractedMedicineData {
  name: string
  dosage: string
  category: string
  manufacturer: string
  dosesPerDay: number
  durationDays: number
  reminderTimes: string[]
  confidence: number
  rawText: string
  instructions: string
}

export interface OCRApiResponse {
  success: boolean
  extractedInfo: ExtractedMedicineData
  message: string
  error?: string
}

export interface FileUploadData {
  file: File
  preview: string
  metadata: {
    name: string
    size: number
    type: string
    lastModified: number
  }
}

const API_BASE_URL = 'http://54.226.134.50:8080'

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
    console.log('🔑 Medicine API - Token found:', !!token, token ? token.substring(0, 20) + '...' : 'No token')

    // Check if token exists and looks valid (basic check)
    if (token) {
      // Basic JWT structure check
      const tokenParts = token.split('.')
      if (tokenParts.length === 3) {
        try {
          // Decode token payload to check expiration
          const payload = JSON.parse(atob(tokenParts[1]))
          const currentTime = Math.floor(Date.now() / 1000)

          console.log('🔍 Token payload info:', {
            issued: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Unknown',
            expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown',
            currentTime: new Date(currentTime * 1000).toISOString(),
            subject: payload.sub,
            username: payload.username || 'Unknown'
          })

          if (payload.exp && payload.exp < currentTime) {
            console.warn('⚠️ Token appears to be expired')
            console.warn('🕒 Token expired at:', new Date(payload.exp * 1000).toISOString())
            console.warn('🕒 Current time:', new Date(currentTime * 1000).toISOString())
            // Don't clear token here, let the 401 response handler deal with it
          } else {
            console.log('✅ Token appears to be valid and not expired')
          }
        } catch (decodeError) {
          console.warn('⚠️ Could not decode token:', decodeError)
        }
      } else {
        console.warn('⚠️ Token format appears invalid')
      }

      config.headers.Authorization = `Bearer ${token}`
      console.log('📡 Request headers set:', {
        url: config.url,
        method: config.method?.toUpperCase(),
        hasAuth: !!config.headers.Authorization,
        authPreview: config.headers.Authorization ? config.headers.Authorization.substring(0, 20) + '...' : 'None'
      })
    } else {
      console.warn('⚠️ Medicine API - No authentication token found!')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       console.error('🚫 Unauthorized access - token may be expired')

//       // Mark this request as retried to avoid infinite loops
//       originalRequest._retry = true

//       try {
//         // Try to refresh the token - but don't fail if endpoint doesn't exist
//         const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`
//           }
//         })

//         if (refreshResponse.ok) {
//           const data = await refreshResponse.json()
//           if (data.token) {
//             console.log('✅ Token refreshed successfully')
//             localStorage.setItem('medisort_token', data.token)

//             // Update the original request with new token
//             originalRequest.headers.Authorization = `Bearer ${data.token}`

//             // Retry the original request
//             return apiClient(originalRequest)
//           }
//         } else if (refreshResponse.status === 404) {
//           console.warn('⚠️ Token refresh endpoint not available on backend')
//         }
//       } catch (refreshError) {
//         console.error('❌ Token refresh failed:', refreshError)
//         // Don't fail completely if refresh endpoint doesn't exist
//         if (refreshError instanceof TypeError && refreshError.message.includes('fetch')) {
//           console.warn('⚠️ Token refresh endpoint not reachable - backend may not support it')
//         }
//       }

//       // Don't trigger logout for now - let the user handle it manually
//       console.warn('🔄 Authentication failed - but not auto-logging out to prevent disruption')
//       console.warn('🔄 User can use the Quick Login Check to re-authenticate')
//     }

//     return Promise.reject(error)
//   }
// )

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error('🚫 Unauthorized access - token may be expired')

      // Mark this request as retried to avoid infinite loops
      originalRequest._retry = true

      const currentToken = localStorage.getItem('medisort_token')

      // Check if token exists and has valid JWT format before attempting refresh
      if (!currentToken || !isValidJwtFormat(currentToken)) {
        console.error('No valid token found - clearing auth data but not auto-redirecting')
        localStorage.removeItem('medisort_token')
        localStorage.removeItem('medisort_user')

        // Dispatch a custom event to notify components about auth failure
        window.dispatchEvent(new CustomEvent('auth-failure', {
          detail: { reason: 'no-token', message: 'No valid authentication token found' }
        }))

        return Promise.reject(new Error('Authentication required - please log in again'))
      }

      try {
        console.log('🔄 Attempting to refresh token...')
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          }
        })

        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          if (data.token) {
            console.log('✅ Token refreshed successfully')
            localStorage.setItem('medisort_token', data.token)

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${data.token}`

            // Retry the original request
            return apiClient(originalRequest)
          } else {
            throw new Error('No token in refresh response')
          }
        } else {
          const errorText = await refreshResponse.text()
          throw new Error(`Token refresh failed: ${refreshResponse.status} - ${errorText}`)
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        localStorage.removeItem('medisort_token')
        localStorage.removeItem('medisort_user')

        // Dispatch a custom event to notify components about auth failure
        window.dispatchEvent(new CustomEvent('auth-failure', {
          detail: { reason: 'refresh-failed', message: 'Token refresh failed - please log in again' }
        }))

        return Promise.reject(new Error('Authentication failed - please log in again'))
      }
    }

    return Promise.reject(error)
  }
)

// Helper function to validate JWT format
function isValidJwtFormat(token: string | null): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  return token.split('.').length === 3
}



class MedicineApiService {

  private async validateAuth(): Promise<boolean> {
    const token = localStorage.getItem('medisort_token')
    if (!token) {
      console.warn('⚠️ No authentication token found')
      return false
    }

    // Check token structure and expiration
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        console.warn('⚠️ Invalid token format')
        return false
      }

      const payload = JSON.parse(atob(tokenParts[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      if (payload.exp && payload.exp < currentTime) {
        console.warn('⚠️ Token is expired')
        // Clear expired token
        localStorage.removeItem('medisort_token')
        localStorage.removeItem('medisort_user')
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Error validating token:', error)
      return false
    }
  }

  private handleError(error: any): never {
    console.error('🚨 Medicine API Error:', error)

    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      let message = error.response.data?.message || `HTTP error! status: ${status}`

      console.error('📡 Response error details:', {
        status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      })

      if (status === 401) {
        message = 'Authentication required'
        // Clear invalid token and user data
        localStorage.removeItem('medisort_token')
        localStorage.removeItem('medisort_user')

        // Dispatch auth failure event
        window.dispatchEvent(new CustomEvent('auth-failure', {
          detail: { reason: 'unauthorized', message }
        }))
      } else if (status === 403) {
        message = 'Access denied - insufficient permissions'
      } else if (status === 404) {
        message = 'Resource not found'
      } else if (status >= 500) {
        message = 'Server error - please try again later'
      }

      throw new Error(message)
    } else if (error.request) {
      // Request was made but no response received
      console.error('🌐 Network error - no response received:', error.request)
      throw new Error('Network error - please check your connection and ensure the backend server is running')
    } else {
      // Something else happened
      console.error('❓ Unexpected error:', error.message)
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }

  // Medicine CRUD operations
  async getMedicines(): Promise<Medicine[]> {
    try {
      const response: AxiosResponse = await apiClient.get('/api/medicines/user/all')
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getActiveMedicines(): Promise<Medicine[]> {
    try {
      const response: AxiosResponse = await apiClient.get('/api/medicines/user/active')
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getExpiredMedicines(): Promise<Medicine[]> {
    try {
      const response: AxiosResponse = await apiClient.get('/api/medicines/user/expired')
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getMedicinesEndingSoon(days = 7): Promise<Medicine[]> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/ending-soon?days=${days}`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/search?name=${encodeURIComponent(query)}`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getMedicinesByCategory(category: string): Promise<Medicine[]> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/category/${encodeURIComponent(category)}`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getMedicine(id: number): Promise<Medicine> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/${id}`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async createMedicine(medicine: MedicineRequest): Promise<Medicine> {
    try {
      const response: AxiosResponse = await apiClient.post('/api/medicines', medicine)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async updateMedicine(id: number, medicine: MedicineRequest): Promise<Medicine> {
    try {
      const response: AxiosResponse = await apiClient.put(`/api/medicines/${id}`, medicine)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteMedicine(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/medicines/${id}`)
    } catch (error) {
      this.handleError(error)
    }
  }

  // Medicine Reminder operations
  async getMedicineReminders(medicineId: number): Promise<MedicineReminder[]> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/${medicineId}/reminders`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getTodaysReminders(): Promise<MedicineReminder[]> {
    try {
      const response: AxiosResponse = await apiClient.get('/api/medicines/reminders/today')
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getUpcomingReminders(hours = 2): Promise<MedicineReminder[]> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/reminders/upcoming?hours=${hours}`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getOverdueReminders(): Promise<MedicineReminder[]> {
    try {
      const response: AxiosResponse = await apiClient.get('/api/medicines/reminders/overdue')
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async markReminderAsTaken(reminderId: number): Promise<MedicineReminder> {
    try {
      const response: AxiosResponse = await apiClient.put(`/api/medicines/reminders/${reminderId}/taken`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async resetDailyReminderStatus(): Promise<void> {
    try {
      await apiClient.post('/api/medicines/reminders/reset-daily')
    } catch (error) {
      this.handleError(error)
    }
  }

  async addReminderToMedicine(medicineId: number, reminder: ReminderRequest): Promise<MedicineReminder> {
    try {
      const response: AxiosResponse = await apiClient.post(`/api/medicines/${medicineId}/reminders`, reminder)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteReminder(reminderId: number): Promise<void> {
    try {
      console.log(`🗑️ Attempting to delete reminder with ID: ${reminderId}`)

      // Validate authentication first
      const isAuthValid = await this.validateAuth()
      if (!isAuthValid) {
        throw new Error('Authentication required - please log in again')
      }

      console.log('🚀 Making DELETE request to:', `/api/medicines/reminders/${reminderId}`)

      // Make the DELETE request to the correct endpoint
      const response = await apiClient.delete(`/api/medicines/reminders/${reminderId}`)

      console.log('✅ Reminder deleted successfully', response.status)
    } catch (error: any) {
      console.error('❌ Delete reminder failed:', error)

      // Log additional error details
      if (error.response) {
        console.error('❌ Error response details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        })
      }

      this.handleError(error)
    }
  }

  // Stock and Refill operations
  async updateMedicineStock(medicineId: number, stock: number): Promise<void> {
    try {
      await apiClient.put(`/api/medicines/${medicineId}/stock?stock=${stock}`)
    } catch (error) {
      this.handleError(error)
    }
  }

  async refillMedicine(medicineId: number, refillQuantity: number): Promise<Medicine> {
    try {
      const requestPayload = { refillQuantity }
      console.log('🔄 Refilling medicine:', { 
        medicineId, 
        refillQuantity, 
        url: `/api/medicines/${medicineId}/refill`,
        payload: requestPayload 
      })
      
      const response: AxiosResponse = await apiClient.post(`/api/medicines/${medicineId}/refill`, requestPayload)
      console.log('✅ Refill successful:', response.data)
      return response.data.medicine
    } catch (error: any) {
      console.error('❌ Refill failed:', {
        medicineId,
        refillQuantity,
        requestPayload: { refillQuantity },
        error: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers
      })
      this.handleError(error)
    }
  }

  async getRefillStatus(medicineId: number): Promise<RefillStatus> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/${medicineId}/refill-status`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async addRefillReminder(medicineId: number, reminderDate: string, reminderTimes: string[], daysBeforeEnd: number): Promise<RefillReminder> {
    try {
      const response: AxiosResponse = await apiClient.post(`/api/medicines/${medicineId}/refill-reminders`, {
        reminderDate,
        reminderTimes,
        daysBeforeEnd
      })
      return response.data.reminder
    } catch (error) {
      this.handleError(error)
    }
  }

  async getRefillReminders(medicineId: number): Promise<RefillReminder[]> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/${medicineId}/refill-reminders`)
      return response.data.reminders
    } catch (error) {
      this.handleError(error)
    }
  }

  async getTodaysRefillReminders(): Promise<RefillReminder[]> {
    try {
      const response: AxiosResponse = await apiClient.get('/api/medicines/refill-reminders/today')
      return response.data.reminders
    } catch (error) {
      this.handleError(error)
    }
  }

  // New refill-related methods to match backend APIs
  async getMedicinesNeedingRefill(daysAhead: number = 3): Promise<Medicine[]> {
    try {
      const response: AxiosResponse = await apiClient.get(`/api/medicines/refill-needed?daysAhead=${daysAhead}`)
      return response.data.medicines
    } catch (error) {
      this.handleError(error)
    }
  }

  async updateRefillReminderStatus(reminderId: number, status: string): Promise<void> {
    try {
      await apiClient.put(`/api/medicines/refill-reminders/${reminderId}/status`, {
        status
      })
    } catch (error) {
      this.handleError(error)
    }
  }

  async markRefillReminderAsSent(reminderId: number): Promise<RefillReminder> {
    try {
      const response: AxiosResponse = await apiClient.put(`/api/medicines/refill-reminders/${reminderId}/mark-sent`)
      return response.data.reminder
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteRefillReminder(reminderId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/medicines/refill-reminders/${reminderId}`)
    } catch (error) {
      this.handleError(error)
    }
  }

  async scheduleRefillRemindersForAllMedicines(): Promise<void> {
    try {
      await apiClient.post('/api/medicines/schedule-refill-reminders')
    } catch (error) {
      this.handleError(error)
    }
  }

  // OCR operations - Mock implementation since backend doesn't have OCR endpoint yet
  async uploadAndExtractMedicine(file: File): Promise<OCRApiResponse> {
    try {
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock OCR extraction based on file name or content
      const fileName = file.name.toLowerCase()
      let mockData: ExtractedMedicineData

      if (fileName.includes('aspirin') || fileName.includes('pain')) {
        mockData = {
          name: 'Aspirin',
          dosage: '500mg',
          category: 'Pain Relief',
          manufacturer: 'Generic Pharma',
          dosesPerDay: 2,
          durationDays: 14,
          reminderTimes: ['08:00', '20:00'],
          confidence: 0.85,
          rawText: 'Aspirin 500mg tablets, Take 1 tablet twice daily with food',
          instructions: 'Take with food to avoid stomach irritation'
        }
      } else if (fileName.includes('antibiotic') || fileName.includes('amoxicillin')) {
        mockData = {
          name: 'Amoxicillin',
          dosage: '250mg',
          category: 'Antibiotic',
          manufacturer: 'MedCorp',
          dosesPerDay: 3,
          durationDays: 7,
          reminderTimes: ['08:00', '14:00', '20:00'],
          confidence: 0.92,
          rawText: 'Amoxicillin 250mg capsules, Take 1 capsule three times daily',
          instructions: 'Complete the full course even if feeling better'
        }
      } else {
        // Generic extraction for unknown files
        mockData = {
          name: 'Medicine Name',
          dosage: '100mg',
          category: 'Prescription',
          manufacturer: 'Pharma Co.',
          dosesPerDay: 1,
          durationDays: 30,
          reminderTimes: ['09:00'],
          confidence: 0.65,
          rawText: 'Prescription medicine details extracted from image',
          instructions: 'Follow doctor instructions'
        }
      }

      return {
        success: true,
        extractedInfo: mockData,
        message: 'Medicine information extracted successfully'
      }
    } catch (error) {
      return {
        success: false,
        extractedInfo: {
          name: '',
          dosage: '',
          category: '',
          manufacturer: '',
          dosesPerDay: 0,
          durationDays: 0,
          reminderTimes: [],
          confidence: 0,
          rawText: '',
          instructions: ''
        },
        message: 'Failed to extract medicine information',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async createMedicineFromOCR(medicineData: MedicineRequest): Promise<Medicine> {
    try {
      const response: AxiosResponse = await apiClient.post('/api/medicines', medicineData)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  // Custom Reminder operations (if backend supports them)
  async getCustomReminders(): Promise<any[]> {
    try {
      const response: AxiosResponse = await apiClient.get('/api/custom-reminders')
      return response.data
    } catch (error: any) {
      // If endpoint doesn't exist, return empty array
      if (error.response?.status === 404) {
        console.warn('Custom reminders endpoint not available on backend')
        return []
      }
      this.handleError(error)
    }
  }

  async createCustomReminder(reminderData: any): Promise<any> {
    try {
      const response: AxiosResponse = await apiClient.post('/api/custom-reminders', reminderData)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Custom reminders not supported by backend')
      }
      this.handleError(error)
    }
  }

  async updateCustomReminder(id: number, updates: any): Promise<any> {
    try {
      const response: AxiosResponse = await apiClient.put(`/api/custom-reminders/${id}`, updates)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Custom reminder not found or not supported by backend')
      }
      this.handleError(error)
    }
  }

  async deleteCustomReminder(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/custom-reminders/${id}`)
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Custom reminder not found or not supported by backend')
      }
      this.handleError(error)
    }
  }

  // Dashboard stats - Calculate from available endpoints using frontend logic
  async getMedicineStats(): Promise<MedicineStats> {
    try {
      const allMedicines = await this.getMedicines()

      // Calculate expiring medicines using stock-based logic (frontend calculation)
      const expiringThisWeek = allMedicines.filter(medicine => {
        const currentStock = medicine.currentStock || medicine.totalQuantity || 0
        const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
        return stockBasedDays <= 7 && stockBasedDays > 0
      })

      const expiringThisMonth = allMedicines.filter(medicine => {
        const currentStock = medicine.currentStock || medicine.totalQuantity || 0
        const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
        return stockBasedDays <= 30 && stockBasedDays > 0
      })

      // Calculate active custom reminders
      let activeReminders = 0
      try {
        const { customReminderService } = await import('./customReminderService')
        const customReminders = await customReminderService.getAllReminders()
        activeReminders = customReminders.filter(r => r.isActive).length
      } catch (error) {
        console.warn('Could not load custom reminders:', error)
        activeReminders = 0
      }

      return {
        totalMedicines: allMedicines.length,
        expiringThisWeek: expiringThisWeek.length,
        expiringThisMonth: expiringThisMonth.length,
        activeReminders
      }
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const medicineApi = new MedicineApiService()