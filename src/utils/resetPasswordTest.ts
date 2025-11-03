// Test utility for debugging reset password API calls
const API_BASE_URL = 'http://localhost:8081'

export const testResetPasswordEndpoints = async (token: string) => {
  console.log('🧪 Testing Reset Password Endpoints')
  console.log('Token:', token)
  
  // Test 1: Validate Reset Token
  console.log('\n1️⃣ Testing validate-reset-token endpoint...')
  try {
    const validateResponse = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Validate Response Status:', validateResponse.status)
    console.log('Validate Response Headers:', Object.fromEntries(validateResponse.headers.entries()))
    
    const validateText = await validateResponse.text()
    console.log('Validate Response Body:', validateText)
    
    if (validateResponse.ok) {
      console.log('✅ Token validation successful')
    } else {
      console.log('❌ Token validation failed')
    }
  } catch (error) {
    console.error('❌ Validate token error:', error)
  }
  
  // Test 2: Reset Password (with dummy password)
  console.log('\n2️⃣ Testing reset-password endpoint...')
  try {
    const resetResponse = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token: token, 
        newPassword: 'TestPassword123!' 
      }),
    })
    
    console.log('Reset Response Status:', resetResponse.status)
    console.log('Reset Response Headers:', Object.fromEntries(resetResponse.headers.entries()))
    
    const resetText = await resetResponse.text()
    console.log('Reset Response Body:', resetText)
    
    if (resetResponse.ok) {
      console.log('✅ Password reset successful')
    } else {
      console.log('❌ Password reset failed')
    }
  } catch (error) {
    console.error('❌ Reset password error:', error)
  }
  
  // Test 3: Check if endpoints require authentication
  console.log('\n3️⃣ Testing with Authorization header (should not be needed)...')
  try {
    const authTestResponse = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      },
    })
    
    console.log('Auth Test Response Status:', authTestResponse.status)
    const authTestText = await authTestResponse.text()
    console.log('Auth Test Response Body:', authTestText)
  } catch (error) {
    console.error('❌ Auth test error:', error)
  }
}

// Helper to test from browser console
(window as any).testResetPassword = testResetPasswordEndpoints