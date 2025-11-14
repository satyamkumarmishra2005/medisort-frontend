import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export const QuickLoginCheck: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<string>('')
  const { user, token, isAuthenticated, isTokenExpired, login, logout } = useAuth()
  const navigate = useNavigate()

  const checkAuthStatus = async () => {
    setIsChecking(true)
    setResult('Checking authentication...')

    try {
      // Check basic auth status
      if (!user || !token) {
        setResult('❌ No user or token found - please login')
        return
      }

      if (isTokenExpired()) {
        setResult('❌ Token is expired - please login again')
        return
      }

      // Test a simple API call
      const response = await fetch('https://api.medisort.app/api/medicines/user/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setResult('✅ Authentication is working!')
      } else if (response.status === 401) {
        setResult('❌ Token is invalid - please login again')
      } else {
        setResult(`⚠️ API returned ${response.status} - check backend`)
      }
    } catch (error) {
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsChecking(false)
    }
  }

  const handleReLogin = () => {
    logout()
    navigate('/login')
  }

  const quickLogin = async () => {
    setIsChecking(true)
    setResult('Attempting quick login...')

    try {
      // Try to login with stored credentials (if any)
      const email = localStorage.getItem('last_login_email')
      if (!email) {
        setResult('❌ No stored email - please login manually')
        return
      }

      setResult('Please enter your password to re-authenticate')
      // For now, just redirect to login
      handleReLogin()
    } catch (error) {
      setResult(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">Quick Auth Check</h3>
      
      <div className="space-y-2">
        <button
          onClick={checkAuthStatus}
          disabled={isChecking}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check Auth Status'}
        </button>

        <button
          onClick={handleReLogin}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          Go to Login
        </button>
      </div>

      {result && (
        <div className="mt-2 text-xs whitespace-pre-wrap p-2 bg-gray-100 dark:bg-gray-700 rounded">
          {result}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        <div>User: {user?.email || 'None'}</div>
        <div>Token: {token ? 'Present' : 'Missing'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>Expired: {isTokenExpired() ? 'Yes' : 'No'}</div>
      </div>
    </div>
  )
}