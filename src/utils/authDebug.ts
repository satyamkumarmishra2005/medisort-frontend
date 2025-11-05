// Authentication debugging utility
export const AuthDebugger = {
  
  checkToken(): boolean {
    const token = localStorage.getItem('medisort_token')
    console.log('🔍 Token Debug:')
    console.log('- Token exists:', !!token)
    
    if (!token) {
      console.log('❌ No token found in localStorage')
      return false
    }
    
    console.log('- Token length:', token.length)
    console.log('- Token preview:', token.substring(0, 20) + '...')
    
    // Check JWT structure
    const parts = token.split('.')
    console.log('- JWT parts:', parts.length)
    
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT structure')
      return false
    }
    
    try {
      // Decode header
      const header = JSON.parse(atob(parts[0]))
      console.log('- JWT Header:', header)
      
      // Decode payload
      const payload = JSON.parse(atob(parts[1]))
      console.log('- JWT Payload:', payload)
      
      // Check expiration
      if (payload.exp) {
        const expirationDate = new Date(payload.exp * 1000)
        const currentDate = new Date()
        const isExpired = currentDate > expirationDate
        
        console.log('- Expires at:', expirationDate.toLocaleString())
        console.log('- Current time:', currentDate.toLocaleString())
        console.log('- Is expired:', isExpired)
        
        if (isExpired) {
          console.log('❌ Token is expired')
          return false
        }
      }
      
      console.log('✅ Token appears valid')
      return true
      
    } catch (error) {
      console.log('❌ Error decoding token:', error)
      return false
    }
  },
  
  async testApiEndpoint(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<void> {
    const token = localStorage.getItem('medisort_token')
    const baseUrl = 'http://54.226.134.50:8080'
    
    console.log(`🧪 Testing ${method} ${endpoint}`)
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      }
      
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body)
      }
      
      const response = await fetch(`${baseUrl}${endpoint}`, options)
      
      console.log('📡 Response:')
      console.log('- Status:', response.status, response.statusText)
      console.log('- Headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        try {
          const data = await response.json()
          console.log('- Data:', data)
        } catch {
          const text = await response.text()
          console.log('- Text:', text)
        }
      } else {
        const errorText = await response.text()
        console.log('- Error:', errorText)
      }
      
    } catch (error) {
      console.log('❌ Network error:', error)
    }
  },
  
  async testDeleteReminder(reminderId: number): Promise<void> {
    console.log('🔥 Testing DELETE reminder functionality:')
    
    // First check token
    const isTokenValid = this.checkToken()
    if (!isTokenValid) {
      console.log('❌ Cannot proceed - invalid token')
      return
    }
    
    // Test the specific delete endpoint
    await this.testApiEndpoint(`/api/medicines/reminders/${reminderId}`, 'DELETE')
  },
  
  async diagnoseReminderIssue(): Promise<void> {
    console.log('🔍 Diagnosing reminder deletion issue...')
    
    // Step 1: Check authentication
    console.log('\n1. Checking authentication...')
    const isTokenValid = this.checkToken()
    
    if (!isTokenValid) {
      console.log('❌ Authentication issue detected')
      return
    }
    
    // Step 2: Test basic API connectivity
    console.log('\n2. Testing basic API connectivity...')
    await this.testApiEndpoint('/api/medicines/user/all', 'GET')
    
    // Step 3: Check if any reminders exist
    console.log('\n3. Checking reminders...')
    // This would need a specific reminder to test with
    console.log('To test deletion, use: AuthDebugger.testDeleteReminder(<reminder_id>)')
  },
  
  clearAuth(): void {
    localStorage.removeItem('medisort_token')
    localStorage.removeItem('medisort_user')
    console.log('🧹 Authentication cleared')
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).AuthDebugger = AuthDebugger
}