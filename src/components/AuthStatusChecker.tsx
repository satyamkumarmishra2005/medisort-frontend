import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export const AuthStatusChecker: React.FC = () => {
  const { user, token, isAuthenticated, isTokenExpired, isLoading } = useAuth()

  const checkTokenDetails = () => {
    if (!token) return null

    try {
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) return { error: 'Invalid token format' }

      const payload = JSON.parse(atob(tokenParts[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      return {
        issued: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Unknown',
        expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown',
        currentTime: new Date(currentTime * 1000).toISOString(),
        subject: payload.sub,
        username: payload.username || 'Unknown',
        isExpired: payload.exp && payload.exp < currentTime
      }
    } catch (error) {
      return { error: 'Could not decode token' }
    }
  }

  const tokenDetails = checkTokenDetails()

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">Auth Status</h3>
      <div className="text-xs space-y-1">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>Token Expired: {isTokenExpired() ? 'Yes' : 'No'}</div>
        <div>Has Token: {token ? 'Yes' : 'No'}</div>
        <div>Has User: {user ? 'Yes' : 'No'}</div>
        
        {user && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div>User: {user.email}</div>
            <div>Name: {user.name}</div>
            <div>ID: {user.id}</div>
          </div>
        )}

        {tokenDetails && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            {tokenDetails.error ? (
              <div className="text-red-500">{tokenDetails.error}</div>
            ) : (
              <>
                <div>Subject: {tokenDetails.subject}</div>
                <div>Username: {tokenDetails.username}</div>
                <div>Issued: {tokenDetails.issued}</div>
                <div>Expires: {tokenDetails.expires}</div>
                <div>Current: {tokenDetails.currentTime}</div>
                <div className={tokenDetails.isExpired ? 'text-red-500' : 'text-green-500'}>
                  Status: {tokenDetails.isExpired ? 'EXPIRED' : 'VALID'}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}