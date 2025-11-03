import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isTokenExpired } from '../utils/authUtils'
import { AlertCircle, CheckCircle, RefreshCw, LogIn } from 'lucide-react'

interface AuthStatusBannerProps {
  showWhenAuthenticated?: boolean
  compact?: boolean
  onLoginClick?: () => void
}

export const AuthStatusBanner: React.FC<AuthStatusBannerProps> = ({
  showWhenAuthenticated = false,
  compact = false,
  onLoginClick
}) => {
  const { user, token, isAuthenticated, refreshToken } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [authFailureMessage, setAuthFailureMessage] = useState<string | null>(null)

  // Listen for auth failure events
  useEffect(() => {
    const handleAuthFailure = (event: CustomEvent) => {
      const { reason, message } = event.detail
      setAuthFailureMessage(message)
      console.log('🚨 Auth failure detected in banner:', reason, message)
    }

    window.addEventListener('auth-failure', handleAuthFailure as EventListener)
    
    return () => {
      window.removeEventListener('auth-failure', handleAuthFailure as EventListener)
    }
  }, [])

  // Clear auth failure message when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !isTokenExpired(token)) {
      setAuthFailureMessage(null)
    }
  }, [isAuthenticated, token])

  const handleRefreshToken = async () => {
    setIsRefreshing(true)
    try {
      const result = await refreshToken()
      if (result.success) {
        setAuthFailureMessage(null)
      } else {
        setAuthFailureMessage(result.message || 'Token refresh failed')
      }
    } catch (error) {
      setAuthFailureMessage('Token refresh failed')
    } finally {
      setIsRefreshing(false)
    }
  }

  const isTokenExpiredNow = token ? isTokenExpired(token) : true
  const shouldShow = authFailureMessage || !isAuthenticated || isTokenExpiredNow || showWhenAuthenticated

  if (!shouldShow) {
    return null
  }

  // Success state
  if (isAuthenticated && !isTokenExpiredNow && !authFailureMessage) {
    if (!showWhenAuthenticated) return null
    
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg ${compact ? 'p-2' : 'p-4'}`}>
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className={`text-green-800 ${compact ? 'text-sm' : 'text-sm font-medium'}`}>
              Authenticated as {user?.email}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error/Warning state
  const isError = authFailureMessage || isTokenExpiredNow
  const bgColor = isError ? 'bg-red-50' : 'bg-yellow-50'
  const borderColor = isError ? 'border-red-200' : 'border-yellow-200'
  const iconColor = isError ? 'text-red-400' : 'text-yellow-400'
  const textColor = isError ? 'text-red-800' : 'text-yellow-800'

  let message = 'Authentication required'
  if (authFailureMessage) {
    message = authFailureMessage
  } else if (isTokenExpiredNow) {
    message = 'Your session has expired'
  } else if (!isAuthenticated) {
    message = 'Please log in to access all features'
  }

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg ${compact ? 'p-2' : 'p-4'}`}>
      <div className="flex items-center">
        <AlertCircle className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <p className={`${textColor} ${compact ? 'text-sm' : 'text-sm font-medium'}`}>
            {message}
          </p>
        </div>
        <div className="ml-3 flex items-center space-x-2">
          {token && (
            <button
              onClick={handleRefreshToken}
              disabled={isRefreshing}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                isError 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              } disabled:opacity-50`}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          <button
            onClick={onLoginClick}
            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
              isError 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            <LogIn className="w-3 h-3 mr-1" />
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthStatusBanner