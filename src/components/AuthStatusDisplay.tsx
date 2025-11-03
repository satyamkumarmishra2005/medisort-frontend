import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

export const AuthStatusDisplay: React.FC = () => {
  const { user, token, isAuthenticated, isTokenExpired, refreshToken } = useAuth()
  const [tokenInfo, setTokenInfo] = useState<{
    isValid: boolean
    expiresAt: string | null
    timeRemaining: string | null
  }>({
    isValid: false,
    expiresAt: null,
    timeRemaining: null
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const checkToken = () => {
      if (!token) {
        setTokenInfo({
          isValid: false,
          expiresAt: null,
          timeRemaining: null
        })
        return
      }

      try {
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          const currentTime = Math.floor(Date.now() / 1000)
          const isExpired = payload.exp && payload.exp < currentTime

          setTokenInfo({
            isValid: !isExpired,
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null,
            timeRemaining: payload.exp ? 
              Math.max(0, payload.exp - currentTime) > 0 ? 
                `${Math.floor((payload.exp - currentTime) / 60)} minutes` : 
                'Expired' : 
              null
          })
        }
      } catch (error) {
        console.error('Error parsing token:', error)
        setTokenInfo({
          isValid: false,
          expiresAt: null,
          timeRemaining: null
        })
      }
    }

    checkToken()
    const interval = setInterval(checkToken, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [token])

  const handleRefreshToken = async () => {
    setRefreshing(true)
    try {
      const result = await refreshToken()
      if (result.success) {
        console.log('Token refreshed successfully')
      } else {
        console.error('Token refresh failed:', result.message)
      }
    } catch (error) {
      console.error('Token refresh error:', error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        Authentication Status
        {isAuthenticated ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
        </div>

        {user && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">User:</span>
            <span className="text-sm">{user.name} ({user.email})</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Token:</span>
          <Badge variant={token ? 'default' : 'secondary'}>
            {token ? 'Present' : 'Missing'}
          </Badge>
        </div>

        {token && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Valid:</span>
              <Badge variant={tokenInfo.isValid ? 'default' : 'destructive'}>
                {tokenInfo.isValid ? 'Yes' : 'No'}
              </Badge>
            </div>

            {tokenInfo.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expires:</span>
                <span className="text-sm">{tokenInfo.expiresAt}</span>
              </div>
            )}

            {tokenInfo.timeRemaining && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Time Remaining:</span>
                <span className="text-sm">{tokenInfo.timeRemaining}</span>
              </div>
            )}
          </>
        )}

        {token && !tokenInfo.isValid && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Your session has expired. Please refresh your token or log in again.
            </span>
          </div>
        )}

        {token && (
          <Button
            onClick={handleRefreshToken}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Token'}
          </Button>
        )}
      </div>
    </Card>
  )
}