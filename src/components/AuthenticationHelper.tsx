import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isTokenExpired, getTokenTimeRemaining } from '../utils/authUtils'

interface AuthenticationHelperProps {
  onAuthSuccess?: () => void
  showTokenInfo?: boolean
}

export const AuthenticationHelper: React.FC<AuthenticationHelperProps> = ({ 
  onAuthSuccess, 
  showTokenInfo = false 
}) => {
  const { user, token, isAuthenticated, login, refreshToken, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tokenInfo, setTokenInfo] = useState<{
    isExpired: boolean
    timeRemaining: number
    expiresAt: string
  } | null>(null)

  // Update token info when token changes
  useEffect(() => {
    if (token) {
      const expired = isTokenExpired(token)
      const remaining = getTokenTimeRemaining(token)
      
      let expiresAt = 'Unknown'
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp) {
          expiresAt = new Date(payload.exp * 1000).toLocaleString()
        }
      } catch (error) {
        console.error('Error parsing token:', error)
      }

      setTokenInfo({
        isExpired: expired,
        timeRemaining: remaining,
        expiresAt
      })
    } else {
      setTokenInfo(null)
    }
  }, [token])

  // Listen for auth failure events
  useEffect(() => {
    const handleAuthFailure = (event: CustomEvent) => {
      const { reason, message } = event.detail
      setMessage(`Authentication failed: ${message}`)
      console.log('🚨 Auth failure detected:', reason, message)
    }

    window.addEventListener('auth-failure', handleAuthFailure as EventListener)
    
    return () => {
      window.removeEventListener('auth-failure', handleAuthFailure as EventListener)
    }
  }, [])

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const result = await login(email, password)
      
      if (result.success) {
        setMessage('✅ Login successful!')
        setEmail('')
        setPassword('')
        onAuthSuccess?.()
      } else {
        setMessage(`❌ Login failed: ${result.message}`)
      }
    } catch (error) {
      setMessage(`❌ Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshToken = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const result = await refreshToken()
      
      if (result.success) {
        setMessage('✅ Token refreshed successfully!')
        onAuthSuccess?.()
      } else {
        setMessage(`❌ Token refresh failed: ${result.message}`)
      }
    } catch (error) {
      setMessage(`❌ Refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Expired'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  if (isAuthenticated && !tokenInfo?.isExpired) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Authentication Status: Active
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Logged in as: {user?.email}</p>
              {showTokenInfo && tokenInfo && (
                <p>Token expires in: {formatTimeRemaining(tokenInfo.timeRemaining)}</p>
              )}
            </div>
          </div>
        </div>
        
        {showTokenInfo && tokenInfo && tokenInfo.timeRemaining < 300 && (
          <div className="mt-3">
            <button
              onClick={handleRefreshToken}
              disabled={isLoading}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Token'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Authentication Required
          </h3>
          <div className="mt-1 text-sm text-red-700">
            {tokenInfo?.isExpired ? 'Your session has expired.' : 'Please log in to continue.'}
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-3 text-sm text-gray-700 bg-gray-100 p-2 rounded">
          {message}
        </div>
      )}

      <form onSubmit={handleQuickLogin} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Quick Login'}
          </button>
          
          {token && (
            <button
              type="button"
              onClick={handleRefreshToken}
              disabled={isLoading}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </form>

      {showTokenInfo && tokenInfo && (
        <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <p><strong>Token Status:</strong> {tokenInfo.isExpired ? 'Expired' : 'Valid'}</p>
          <p><strong>Time Remaining:</strong> {formatTimeRemaining(tokenInfo.timeRemaining)}</p>
          <p><strong>Expires At:</strong> {tokenInfo.expiresAt}</p>
        </div>
      )}
    </div>
  )
}

export default AuthenticationHelper