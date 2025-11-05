// API service for making authenticated requests
const API_BASE_URL = 'http://54.226.134.50:8080'

// Interface for user profile data
interface UserProfileData {
  id?: string | number
  name?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  role?: string
  emergencyContact?: string
  bloodType?: string
  gender?: string
}

// Custom Reminder Types
interface CustomReminderResponse {
  id: number
  title: string
  time: string
  frequency: string
  isActive: boolean
  type: 'custom'
  daysOfWeek?: number[]
  isRecurring?: boolean
  label?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface CustomReminderStats {
  totalReminders: number
  activeReminders: number
  todaysReminders: number
  upcomingReminders: number
}

// Notification Types
interface NotificationResponse {
  id: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

interface NotificationStats {
  totalNotifications: number
  unreadNotifications: number
  recentNotifications: number
  todaysReminders: number
  upcomingReminders: number
  overdueReminders: number
  customReminderNotifications: number
  medicineReminderNotifications: number
  refillReminderNotifications: number
}

export class ApiService {
  private static getAuthToken(): string | null {
    return localStorage.getItem('medisort_token')
  }

  private static getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  // Generic method for making authenticated API calls
  static async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message?: string; status?: number }> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
      console.log('🌐 Making API request to:', url)
      console.log('🔑 Auth headers:', this.getAuthHeaders())

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      console.log('📦 Response data:', data)
      console.log('📦 Is JSON:', isJson)

      if (response.ok) {
        console.log('✅ Request successful')
        return {
          success: true,
          data,
          status: response.status,
          message: 'Request successful'
        }
      } else {
        console.log('❌ Request failed with status:', response.status)
        // Handle your backend's error format: {"error": "message"}
        const errorMessage = (data && typeof data === 'object' && data.error)
          ? data.error
          : (typeof data === 'string' ? data : 'Request failed')

        return {
          success: false,
          message: errorMessage,
          status: response.status
        }
      }
    } catch (error) {
      console.error('❌ API request error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // Specific methods for common endpoints
  static async getAllUsers() {
    return this.makeAuthenticatedRequest('/all', { method: 'GET' })
  }

  static async getUserProfile() {
    return this.makeAuthenticatedRequest('/api/user/profile', { method: 'GET' })
  }

  // Method to test if token is still valid
  static async validateToken(): Promise<boolean> {
    const result = await this.makeAuthenticatedRequest('/all', { method: 'GET' })
    return result.success && result.status !== 401
  }

  // Get current user profile data
  static async getCurrentUserProfile() {
    console.log('🔍 ApiService.getCurrentUserProfile() called')
    const result = await this.makeAuthenticatedRequest<UserProfileData>('/api/user/profile', { method: 'GET' })
    console.log('🔍 Profile API result:', result)
    return result
  }

  // Update user profile
  static async updateUserProfile(profileData: UserProfileData) {
    return this.makeAuthenticatedRequest<UserProfileData>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }

  // Update user profile using the new endpoint
  static async updateUserProfileNew(profileData: Partial<UserProfileData>) {
    return this.makeAuthenticatedRequest<UserProfileData>('/api/user/profile/update', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }

  // Get complete user profile including gender field
  static async getCompleteUserProfile() {
    console.log('🔍 ApiService.getCompleteUserProfile() called')
    
    // Try multiple endpoints to get complete profile data
    const endpoints = ['/api/user/profile/update', '/api/user/profile']
    
    for (const endpoint of endpoints) {
      console.log(`🔍 Trying endpoint: ${endpoint}`)
      const result = await this.makeAuthenticatedRequest<UserProfileData>(endpoint, { method: 'GET' })
      
      if (result.success && result.data) {
        console.log(`📡 Success with ${endpoint}:`, result)
        console.log('📡 Gender field:', result.data.gender)
        
        // If we got gender data, return this result
        if (result.data.gender !== undefined && result.data.gender !== null) {
          console.log('✅ Found gender data, using this endpoint')
          return result
        }
      }
    }
    
    // If no endpoint returned gender, return the last result anyway
    console.log('⚠️ No endpoint returned gender data')
    return this.makeAuthenticatedRequest<UserProfileData>('/api/user/profile', { method: 'GET' })
  }

  // Check if user needs to provide phone number - disabled for no onboarding process
  static async checkNeedsPhone(): Promise<{ success: boolean; needsPhone?: boolean; message?: string }> {
    console.log('🔍 ApiService.checkNeedsPhone() called - returning false (no onboarding)')
    
    // Always return that phone is not needed - no onboarding process
    return {
      success: true,
      needsPhone: false,
      message: 'Phone requirement disabled - no onboarding process'
    }
  }

  // Update user phone number (uses session auth, not JWT)
  static async updatePhoneNumber(phoneNumber: string): Promise<{ success: boolean; message?: string }> {
    console.log('📱 ApiService.updatePhoneNumber() called with:', phoneNumber)

    try {
      const url = `${API_BASE_URL}/api/user/update-phone-session`
      console.log('🌐 Making session-based API request to:', url)

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // ✅ Use session cookies instead of JWT
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      console.log('📦 Response data:', data)
      console.log('📦 Is JSON:', isJson)

      if (response.ok) {
        console.log('✅ Phone number updated successfully')
        return {
          success: true,
          message: 'Phone number updated successfully'
        }
      } else {
        console.log('❌ Request failed with status:', response.status)
        const errorMessage = (data && typeof data === 'object' && data.error)
          ? data.error
          : (typeof data === 'string' ? data : 'Request failed')

        return {
          success: false,
          message: errorMessage
        }
      }
    } catch (error) {
      console.error('❌ API request error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // Custom Reminder API Methods

  // Get all custom reminders
  static async getAllCustomReminders() {
    console.log('🔍 ApiService.getAllCustomReminders() called')
    return this.makeAuthenticatedRequest<CustomReminderResponse[]>('/api/custom-reminders', { method: 'GET' })
  }

  // Get active custom reminders
  static async getActiveCustomReminders() {
    console.log('🔍 ApiService.getActiveCustomReminders() called')
    return this.makeAuthenticatedRequest<CustomReminderResponse[]>('/api/custom-reminders/active', { method: 'GET' })
  }

  // Create a custom reminder
  static async createCustomReminder(reminderData: any) {
    console.log('📝 ApiService.createCustomReminder() called with:', reminderData)
    return this.makeAuthenticatedRequest<CustomReminderResponse>('/api/custom-reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData)
    })
  }

  // Update a custom reminder
  static async updateCustomReminder(id: number, reminderData: any) {
    console.log('📝 ApiService.updateCustomReminder() called with:', { id, reminderData })
    return this.makeAuthenticatedRequest<CustomReminderResponse>(`/api/custom-reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminderData)
    })
  }

  // Delete a custom reminder
  static async deleteCustomReminder(id: number) {
    console.log('🗑️ ApiService.deleteCustomReminder() called with id:', id)
    return this.makeAuthenticatedRequest<{ message: string }>(`/api/custom-reminders/${id}`, { method: 'DELETE' })
  }

  // Toggle reminder status
  static async toggleCustomReminderStatus(id: number) {
    console.log('🔄 ApiService.toggleCustomReminderStatus() called with id:', id)
    return this.makeAuthenticatedRequest<CustomReminderResponse>(`/api/custom-reminders/${id}/toggle`, { method: 'PUT' })
  }

  // Test reminder delivery
  static async testCustomReminderDelivery(id: number) {
    console.log('🧪 ApiService.testCustomReminderDelivery() called with id:', id)
    return this.makeAuthenticatedRequest<{ message: string; reminder: CustomReminderResponse }>(`/api/custom-reminders/${id}/test-delivery`, { method: 'POST' })
  }

  // Get reminder by ID
  static async getCustomReminderById(id: number) {
    console.log('🔍 ApiService.getCustomReminderById() called with id:', id)
    return this.makeAuthenticatedRequest<CustomReminderResponse>(`/api/custom-reminders/${id}`, { method: 'GET' })
  }

  // Get today's reminders
  static async getTodaysCustomReminders() {
    console.log('📅 ApiService.getTodaysCustomReminders() called')
    return this.makeAuthenticatedRequest<CustomReminderResponse[]>('/api/custom-reminders/today', { method: 'GET' })
  }

  // Get upcoming reminders
  static async getUpcomingCustomReminders(hours: number = 2) {
    console.log('⏰ ApiService.getUpcomingCustomReminders() called with hours:', hours)
    return this.makeAuthenticatedRequest<CustomReminderResponse[]>(`/api/custom-reminders/upcoming?hours=${hours}`, { method: 'GET' })
  }

  // Get overdue reminders
  static async getOverdueCustomReminders() {
    console.log('⚠️ ApiService.getOverdueCustomReminders() called')
    return this.makeAuthenticatedRequest<CustomReminderResponse[]>('/api/custom-reminders/overdue', { method: 'GET' })
  }

  // Get reminder statistics
  static async getCustomReminderStats() {
    console.log('📊 ApiService.getCustomReminderStats() called')
    return this.makeAuthenticatedRequest<CustomReminderStats>('/api/custom-reminders/stats', { method: 'GET' })
  }

  // Create multiple reminders
  static async createMultipleCustomReminders(reminders: any[]) {
    console.log('📝 ApiService.createMultipleCustomReminders() called with:', reminders)
    return this.makeAuthenticatedRequest<CustomReminderResponse[]>('/api/custom-reminders/bulk', {
      method: 'POST',
      body: JSON.stringify({ reminders })
    })
  }

  // Clear all reminders
  static async clearAllCustomReminders() {
    console.log('🗑️ ApiService.clearAllCustomReminders() called')
    return this.makeAuthenticatedRequest<{ message: string }>('/api/custom-reminders/all', { method: 'DELETE' })
  }

  // Notification API Methods

  // Get all notifications
  static async getAllNotifications() {
    console.log('🔔 ApiService.getAllNotifications() called')
    return this.makeAuthenticatedRequest<NotificationResponse[]>('/api/notifications', { method: 'GET' })
  }

  // Get unread notifications
  static async getUnreadNotifications() {
    console.log('🔔 ApiService.getUnreadNotifications() called')
    return this.makeAuthenticatedRequest<NotificationResponse[]>('/api/notifications/unread', { method: 'GET' })
  }

  // Get notifications by type
  static async getNotificationsByType(type: string) {
    console.log('🔔 ApiService.getNotificationsByType() called with type:', type)
    return this.makeAuthenticatedRequest<NotificationResponse[]>(`/api/notifications/type/${type}`, { method: 'GET' })
  }

  // Get recent notifications
  static async getRecentNotifications() {
    console.log('🔔 ApiService.getRecentNotifications() called')
    return this.makeAuthenticatedRequest<NotificationResponse[]>('/api/notifications/recent', { method: 'GET' })
  }

  // Get unread count
  static async getUnreadNotificationCount() {
    console.log('🔔 ApiService.getUnreadNotificationCount() called')
    return this.makeAuthenticatedRequest<{ count: number }>('/api/notifications/unread/count', { method: 'GET' })
  }

  // Mark notification as read
  static async markNotificationAsRead(id: number) {
    console.log('🔔 ApiService.markNotificationAsRead() called with id:', id)
    return this.makeAuthenticatedRequest<{ message: string }>(`/api/notifications/${id}/read`, { method: 'PUT' })
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead() {
    console.log('🔔 ApiService.markAllNotificationsAsRead() called')
    return this.makeAuthenticatedRequest<{ message: string; count: number }>('/api/notifications/read-all', { method: 'PUT' })
  }

  // Delete notification
  static async deleteNotification(id: number) {
    console.log('🔔 ApiService.deleteNotification() called with id:', id)
    return this.makeAuthenticatedRequest<{ message: string }>(`/api/notifications/${id}`, { method: 'DELETE' })
  }

  // Create notification
  static async createNotification(title: string, message: string, type?: string) {
    console.log('🔔 ApiService.createNotification() called with:', { title, message, type })
    return this.makeAuthenticatedRequest<NotificationResponse>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, message, type: type || 'CUSTOM' })
    })
  }

  // Get notification statistics
  static async getNotificationStats() {
    console.log('🔔 ApiService.getNotificationStats() called')
    return this.makeAuthenticatedRequest<NotificationStats>('/api/notifications/stats', { method: 'GET' })
  }

  // Medicine Reminder Notification Methods

  // Get today's medicine reminders
  static async getTodaysMedicineReminders() {
    console.log('💊 ApiService.getTodaysMedicineReminders() called')
    return this.makeAuthenticatedRequest('/api/notifications/reminders/today', { method: 'GET' })
  }

  // Get upcoming medicine reminders
  static async getUpcomingMedicineReminders(hours: number = 2) {
    console.log('💊 ApiService.getUpcomingMedicineReminders() called with hours:', hours)
    return this.makeAuthenticatedRequest(`/api/notifications/reminders/upcoming?hours=${hours}`, { method: 'GET' })
  }

  // Get all medicine reminders
  static async getAllMedicineReminders() {
    console.log('💊 ApiService.getAllMedicineReminders() called')
    return this.makeAuthenticatedRequest('/api/notifications/reminders/all', { method: 'GET' })
  }

  // Get overdue medicine reminders
  static async getOverdueMedicineReminders() {
    console.log('💊 ApiService.getOverdueMedicineReminders() called')
    return this.makeAuthenticatedRequest('/api/notifications/reminders/overdue', { method: 'GET' })
  }

  // Mark medicine reminder as taken
  static async markMedicineReminderAsTaken(id: number) {
    console.log('💊 ApiService.markMedicineReminderAsTaken() called with id:', id)
    return this.makeAuthenticatedRequest<{ message: string }>(`/api/notifications/reminders/${id}/taken`, { method: 'POST' })
  }

  // Report API Methods

  // Get the current user's database ID
  static async getCurrentUserDatabaseId(): Promise<{ success: boolean; userId?: number; message?: string }> {
    console.log('🔍 ApiService.getCurrentUserDatabaseId() called')

    try {
      // Try to get user profile which should contain the database ID
      const profileResult = await this.getCurrentUserProfile()
      
      if (profileResult.success && profileResult.data && profileResult.data.id) {
        const userId = typeof profileResult.data.id === 'number' 
          ? profileResult.data.id 
          : parseInt(profileResult.data.id.toString())
        if (!isNaN(userId)) {
          console.log('✅ Found database user ID:', userId)
          return { success: true, userId }
        }
      }

      console.log('⚠️ Profile result:', profileResult)
      console.log('⚠️ Could not get database user ID from profile')
      
      // If we can't get the user ID from profile, this is an error
      return { success: false, message: 'Could not determine user database ID' }
      
    } catch (error) {
      console.error('❌ Get database user ID error:', error)
      return { success: false, message: 'Failed to get user database ID' }
    }
  }

  // Upload a report file
  static async uploadReport(file: File, fallbackUserId?: number): Promise<{ success: boolean; data?: any; message?: string }> {
    console.log('📄 ApiService.uploadReport() called with:', { fileName: file.name, fileSize: file.size, fallbackUserId })

    try {
      // First, try to get the current user's database ID
      let userId = fallbackUserId
      
      // Always try to get the database ID from profile first
      const userIdResult = await this.getCurrentUserDatabaseId()
      if (userIdResult.success && userIdResult.userId) {
        userId = userIdResult.userId
        console.log('🔢 Got user ID from profile:', userId)
      } else if (fallbackUserId && !isNaN(fallbackUserId) && fallbackUserId < 1000000000) {
        // If fallback is provided and looks like a reasonable database ID (not a timestamp)
        userId = fallbackUserId
        console.log('🔢 Using fallback user ID:', userId)
      } else {
        console.log('❌ Could not determine user ID:', { userIdResult, fallbackUserId })
        return { success: false, message: 'Could not determine user ID for upload. Please try logging in again.' }
      }

      console.log('🔢 Final user ID for upload:', userId)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId.toString())

      const url = `${API_BASE_URL}/api/v1/reports/upload`
      console.log('🌐 Making report upload request to:', url)

      const token = this.getAuthToken()
      console.log('🔑 Using token:', token ? token.substring(0, 20) + '...' : 'No token')

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      console.log('📋 Request headers:', headers)
      console.log('📋 FormData contents:')
      console.log('  - file:', file.name, file.size, 'bytes')
      console.log('  - userId:', userId)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response statusText:', response.statusText)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      console.log('📦 Response data:', data)
      console.log('📦 Is JSON response:', isJson)

      if (response.ok) {
        console.log('✅ Report upload successful')
        return {
          success: true,
          data,
          message: 'Report uploaded successfully'
        }
      } else {
        console.log('❌ Report upload failed with status:', response.status)
        
        // Handle different error scenarios
        let errorMessage = 'Upload failed'
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.'
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to upload reports.'
        } else if (response.status === 400) {
          errorMessage = (data && typeof data === 'object' && data.error)
            ? data.error
            : 'Invalid request. Please check your file and try again.'
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = (data && typeof data === 'object' && data.error)
            ? data.error
            : (typeof data === 'string' ? data : `Upload failed with status ${response.status}`)
        }

        return {
          success: false,
          message: errorMessage
        }
      }
    } catch (error) {
      console.error('❌ Report upload error:', error)
      
      let errorMessage = 'Network error'
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://54.226.134.50:8080'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        message: errorMessage
      }
    }
  }

  // Get user reports
  static async getUserReports(userId: number): Promise<{ success: boolean; data?: any[]; message?: string }> {
    console.log('📄 ApiService.getUserReports() called with userId:', userId)

    try {
      const url = `${API_BASE_URL}/api/v1/reports/user/${userId}`
      console.log('🌐 Making get reports request to:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders()
        }
      })

      console.log('📡 Response status:', response.status)

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      console.log('📦 Response data:', data)

      if (response.ok) {
        console.log('✅ Get reports successful')
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Reports retrieved successfully'
        }
      } else {
        console.log('❌ Get reports failed with status:', response.status)
        const errorMessage = (data && typeof data === 'object' && data.error)
          ? data.error
          : (typeof data === 'string' ? data : 'Failed to retrieve reports')

        return {
          success: false,
          message: errorMessage
        }
      }
    } catch (error) {
      console.error('❌ Get reports error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // Get user reports by type
  static async getUserReportsByType(userId: number, fileType: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    console.log('📄 ApiService.getUserReportsByType() called with:', { userId, fileType })

    try {
      const url = `${API_BASE_URL}/api/v1/reports/user/${userId}/type/${fileType}`
      console.log('🌐 Making get reports by type request to:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders()
        }
      })

      console.log('📡 Response status:', response.status)

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      console.log('📦 Response data:', data)

      if (response.ok) {
        console.log('✅ Get reports by type successful')
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Reports retrieved successfully'
        }
      } else {
        console.log('❌ Get reports by type failed with status:', response.status)
        const errorMessage = (data && typeof data === 'object' && data.error)
          ? data.error
          : (typeof data === 'string' ? data : 'Failed to retrieve reports')

        return {
          success: false,
          message: errorMessage
        }
      }
    } 
    catch (error) {
      console.error('❌ Get reports by type error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      }
    }
  }
}

export default ApiService