import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import ApiService from '../services/api'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'patient' | 'doctor' | 'admin'
  provider?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, email: string, password: string, phone: string, emergencyContact?: string, dateOfBirth?: string, bloodType?: string, gender?: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  forgotPassword: (email: string) => Promise<boolean>
  validateResetToken: (token: string) => Promise<{ success: boolean; message?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>
  getAuthHeaders: () => { [key: string]: string }
  testProtectedEndpoint: () => Promise<{ success: boolean; data?: any; message?: string }>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  fetchUserProfile: () => Promise<{ success: boolean; data?: any; message?: string }>
  checkNeedsPhone: () => Promise<{ success: boolean; needsPhone?: boolean; message?: string }>
  updatePhoneNumber: (phoneNumber: string) => Promise<{ success: boolean; message?: string }>
  uploadReport: (file: File) => Promise<{ success: boolean; data?: any; message?: string }>
  getUserReports: () => Promise<{ success: boolean; data?: any[]; message?: string }>
  refreshToken: () => Promise<{ success: boolean; message?: string }>
  isTokenExpired: () => boolean
}

// API Configuration
const API_BASE_URL = 'http://localhost:8081'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing user data and token on mount
  useEffect(() => {
    const userData = localStorage.getItem('medisort_user')
    const authToken = localStorage.getItem('medisort_token')

    if (userData && authToken) {
      try {
        const user = JSON.parse(userData)

        // Check if token is expired before setting it
        const tokenParts = authToken.split('.')
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]))
            const currentTime = Math.floor(Date.now() / 1000)

            if (payload.exp && payload.exp < currentTime) {
              console.warn('🕒 Stored token is expired, clearing auth data')
              localStorage.removeItem('medisort_user')
              localStorage.removeItem('medisort_token')
              setIsLoading(false)
              return
            }
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError)
            localStorage.removeItem('medisort_user')
            localStorage.removeItem('medisort_token')
            setIsLoading(false)
            return
          }
        }

        setUser(user)
        setToken(authToken)
        
        // Clear any stale reminder cache on app initialization with existing auth
        localStorage.removeItem('custom_reminders_cache')
        console.log('🗑️ Cleared stale reminder cache on app initialization')
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('medisort_user')
        localStorage.removeItem('medisort_token')
        localStorage.removeItem('custom_reminders_cache')
      }
    } else {
      // If no stored auth, also clear any stale reminder cache
      localStorage.removeItem('custom_reminders_cache')
      console.log('🗑️ Cleared reminder cache - no stored authentication')
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    console.log('🚀 Login function called with:', { email, password: '***' })

    try {
      setIsLoading(true)
      console.log('📡 Making login request to:', `${API_BASE_URL}/api/auth/login`)

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        console.log('✅ Response is OK, processing...')

        const responseData = await response.json()
        console.log('📦 Login response:', responseData)

        if (responseData.token) {
          console.log('✅ Login successful with JWT token')

          const jwtToken = responseData.token

          // Clear any stale reminder cache before storing new token
          localStorage.removeItem('custom_reminders_cache')
          console.log('🗑️ Cleared stale reminder cache on fresh login')
          
          // Store the token first
          localStorage.setItem('medisort_token', jwtToken)
          setToken(jwtToken)

          // Then fetch the full user profile
          const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${jwtToken}`
            }
          })

          if (profileResponse.ok) {
            const userProfile = await profileResponse.json()

            const user: User = {
              id: userProfile.id || Date.now().toString(),
              email: userProfile.email || email,
              name: userProfile.name || email.split('@')[0],
              phone: userProfile.phone || '',
              role: 'patient',
              provider: userProfile.provider || 'local'
            }

            localStorage.setItem('medisort_user', JSON.stringify(user))
            setUser(user)

            return { success: true, message: 'Login successful' }
          } else {
            return { success: false, message: 'Failed to fetch user profile' }
          }
        } else {
          return {
            success: false,
            message: responseData.message || 'Login failed'
          }
        }
      } else {
        console.log('❌ Response not OK, status:', response.status)

        // Handle different error status codes
        let errorMessage = 'Login failed'

        try {
          const errorText = await response.text()
          console.log('❌ Error response text:', errorText)
          errorMessage = errorText || 'Login failed'
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }

        // Specific error messages based on status code
        if (response.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (response.status === 404) {
          errorMessage = 'User not found. Please check your email address.'
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        }

        return { success: false, message: errorMessage }
      }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Network error. Please check your connection and ensure the backend server is running on port 8081.'

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure your Spring Boot backend is running on http://localhost:8081'
      }

      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, phone: string, emergencyContact?: string, dateOfBirth?: string, bloodType?: string, gender?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true)

      const requestBody: any = { name, email, password, phone }
      
      // Add optional fields if provided
      if (emergencyContact) requestBody.emergencyContact = emergencyContact
      if (dateOfBirth) requestBody.dateOfBirth = dateOfBirth
      if (bloodType) requestBody.bloodType = bloodType
      if (gender) requestBody.gender = gender

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const message = await response.text()
        return { success: true, message: message || 'User registered successfully' }
      } else {
        // Handle different error status codes
        let errorMessage = 'Registration failed'

        try {
          const errorText = await response.text()
          errorMessage = errorText || 'Registration failed'
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }

        // Specific error messages based on status code
        if (response.status === 400) {
          // Keep the original error message from backend (like "Email already exists")
          // errorMessage is already set from response.text()
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        }

        console.error('Registration failed:', response.status, errorMessage)
        return { success: false, message: errorMessage }
      }
    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = 'Network error. Please check your connection and ensure the backend server is running on port 8081.'

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure your Spring Boot backend is running on http://localhost:8081'
      }

      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('medisort_user')
    localStorage.removeItem('medisort_token')
    
    // Clear all reminder caches to prevent deleted reminders from reappearing
    localStorage.removeItem('custom_reminders_cache')
    localStorage.removeItem('medicine_reminder_statuses')
    
    // Clear all completed reminder caches (they have date-based keys)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('completed_reminders_')) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('🗑️ Cleared all authentication and reminder caches on logout')
    
    setUser(null)
    setToken(null)
  }

  const getAuthHeaders = () => {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  const testProtectedEndpoint = async (): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      if (!token) {
        return { success: false, message: 'No authentication token available' }
      }

      const response = await fetch(`${API_BASE_URL}/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data, message: 'Protected endpoint accessed successfully' }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          message: response.status === 401 ? 'Unauthorized - Invalid or expired token' : errorText
        }
      }
    } catch (error) {
      console.error('Protected endpoint test error:', error)
      return { success: false, message: 'Network error while testing protected endpoint' }
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      console.log('🔄 Sending forgot password request for:', email)

      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      console.log('📡 Forgot password response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      // Log response body for debugging (but don't expose to user)
      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Forgot password error response:', errorText)

        // Check for specific rate limiting errors
        if (response.status === 429) {
          console.log('⏰ Rate limited - too many requests')
        } else if (response.status === 400) {
          console.log('🚫 Bad request - possible validation error')
        }
      } else {
        console.log('✅ Forgot password request successful')
      }

      // Always return true for security - don't reveal if email exists or if rate limited
      return true
    } catch (error) {
      console.error('Forgot password network error:', error)
      // Still return true for security
      return true
    } finally {
      setIsLoading(false)
    }
  }

  const validateResetToken = async (token: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        return { success: true, message: 'Token is valid' }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          message: response.status === 400 ? 'Invalid or expired reset token' : errorText
        }
      }
    } catch (error) {
      console.error('Validate reset token error:', error)
      return { success: false, message: 'Network error. Please check your connection.' }
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      })

      if (response.ok) {
        return { success: true, message: 'Password reset successfully' }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          message: response.status === 400 ? 'Invalid or expired reset token' : errorText
        }
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return { success: false, message: 'Network error. Please check your connection.' }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async (): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      if (!token) {
        return { success: false, message: 'No authentication token available' }
      }

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const profileData = await response.json()

        // Update user data with fresh profile information
        if (user) {
          const updatedUser: User = {
            ...user,
            name: profileData.name || user.name,
            phone: profileData.phone || user.phone,
            email: profileData.email || user.email
          }

          setUser(updatedUser)
          localStorage.setItem('medisort_user', JSON.stringify(updatedUser))
        }

        return { success: true, data: profileData, message: 'Profile fetched successfully' }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          message: response.status === 401 ? 'Unauthorized - Invalid or expired token' : errorText
        }
      }
    } catch (error) {
      console.error('Fetch user profile error:', error)
      return { success: false, message: 'Network error while fetching user profile' }
    }
  }

  const checkNeedsPhone = async (): Promise<{ success: boolean; needsPhone?: boolean; message?: string }> => {
    // Always return that phone is not needed - no onboarding process
    return {
      success: true,
      needsPhone: false,
      message: 'Phone requirement disabled - no onboarding process'
    }
  }

  const updatePhoneNumber = async (phoneNumber: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/update-phone-session`, {
        method: 'POST',
        credentials: 'include', // ✅ Use session cookies instead of JWT
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber }),
      })

      if (response.ok) {
        // Update user data with new phone number
        if (user) {
          const updatedUser: User = {
            ...user,
            phone: phoneNumber
          }

          setUser(updatedUser)
          localStorage.setItem('medisort_user', JSON.stringify(updatedUser))
        }

        return { success: true, message: 'Phone number updated successfully' }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          message: response.status === 401 ? 'Unauthorized - Session expired' : errorText
        }
      }
    } catch (error) {
      console.error('Update phone number error:', error)
      return { success: false, message: 'Network error while updating phone number' }
    }
  }

  // Report Methods
  const uploadReport = async (file: File): Promise<{ success: boolean; data?: any; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' }
    }

    try {
      // Try to parse user ID as fallback
      let fallbackUserId: number | undefined
      const parsedUserId = parseInt(user.id)
      if (!isNaN(parsedUserId)) {
        fallbackUserId = parsedUserId
      }

      return await ApiService.uploadReport(file, fallbackUserId)
    } catch (error) {
      console.error('Upload report error:', error)
      return { success: false, message: 'Network error while uploading report' }
    }
  }

  const getUserReports = async (): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' }
    }

    try {
      // First try to get the database user ID
      const userIdResult = await ApiService.getCurrentUserDatabaseId()
      let userId: number

      if (userIdResult.success && userIdResult.userId) {
        userId = userIdResult.userId
      } else {
        // Fallback to parsing the user.id
        const parsedUserId = parseInt(user.id)
        if (!isNaN(parsedUserId)) {
          userId = parsedUserId
        } else {
          return { success: false, message: 'Could not determine user ID' }
        }
      }

      return await ApiService.getUserReports(userId)
    } catch (error) {
      console.error('Get user reports error:', error)
      return { success: false, message: 'Network error while fetching reports' }
    }
  }

  const isTokenExpired = (): boolean => {
    if (!token) return true

    try {
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) return true

      const payload = JSON.parse(atob(tokenParts[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      return payload.exp && payload.exp < currentTime
    } catch (error) {
      console.error('Error checking token expiration:', error)
      return true
    }
  }

  const refreshToken = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!token) {
        return { success: false, message: 'No token to refresh' }
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          localStorage.setItem('medisort_token', data.token)
          setToken(data.token)
          return { success: true, message: 'Token refreshed successfully' }
        }
      }

      // If refresh fails, don't automatically logout - let the caller decide
      return { success: false, message: 'Token refresh failed' }
    } catch (error) {
      console.error('Token refresh error:', error)
      return { success: false, message: 'Network error during token refresh' }
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token && !isTokenExpired(),
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAuthHeaders,
    testProtectedEndpoint,
    setUser,
    setToken,
    fetchUserProfile,
    checkNeedsPhone,
    updatePhoneNumber,
    uploadReport,
    getUserReports,
    refreshToken,
    isTokenExpired
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}