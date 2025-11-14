// Simple login test utility
export const testLogin = async (email: string, password: string) => {
  try {
    console.log('🔍 Testing login with:', { email, password: '***' })
    
    const response = await fetch('https://api.medisort.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log('📦 Content type:', contentType)
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        console.log('📦 JSON response:', data)
        return { success: true, data, type: 'json' }
      } else {
        const text = await response.text()
        console.log('📦 Text response:', text)
        return { success: true, data: text, type: 'text' }
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Error response:', errorText)
      return { success: false, error: errorText, status: response.status }
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test function you can call from browser console
// @ts-ignore
window.testLogin = testLogin