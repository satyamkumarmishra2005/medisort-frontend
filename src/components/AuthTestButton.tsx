import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const AuthTestButton: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { testProtectedEndpoint, refreshToken, token } = useAuth()

  const runAuthTest = async () => {
    setIsLoading(true)
    setTestResult('Testing...')

    try {
      // Test 1: Check if backend is reachable
      setTestResult('Step 1: Testing backend connection...')
      try {
        const backendResponse = await fetch('http://localhost:8081/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test', password: 'test' })
        })
        
        // We expect this to fail with 401 or 400, but if we get a response, backend is running
        setTestResult(`✅ Backend is reachable (status: ${backendResponse.status})`)
      } catch (error) {
        setTestResult(`❌ Backend not reachable: ${error instanceof Error ? error.message : 'Connection failed'}`)
        return
      }

      // Test 2: Check token validity
      setTestResult('Step 2: Testing token validity...')
      if (!token) {
        setTestResult('❌ No token found - please login')
        return
      }

      // Test 3: Test protected endpoint
      setTestResult('Step 3: Testing protected endpoint...')
      const protectedResult = await testProtectedEndpoint()
      
      if (protectedResult.success) {
        setTestResult('✅ All tests passed! Authentication is working.')
      } else {
        setTestResult(`❌ Protected endpoint failed: ${protectedResult.message}`)
        
        // Test 4: Try token refresh (optional)
        setTestResult('Step 4: Attempting token refresh...')
        const refreshResult = await refreshToken()
        
        if (refreshResult.success) {
          setTestResult('✅ Token refreshed successfully!')
        } else if (refreshResult.message?.includes('not supported')) {
          setTestResult('⚠️ Token refresh not supported by backend (this is OK)')
        } else {
          setTestResult(`❌ Token refresh failed: ${refreshResult.message}`)
        }
      }
    } catch (error) {
      setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">Auth Test</h3>
      <button
        onClick={runAuthTest}
        disabled={isLoading}
        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Run Auth Test'}
      </button>
      {testResult && (
        <div className="mt-2 text-xs whitespace-pre-wrap">
          {testResult}
        </div>
      )}
    </div>
  )
}