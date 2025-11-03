import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export const LoginStatusChecker: React.FC = () => {
  const { user, token, isAuthenticated, isTokenExpired } = useAuth()
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const checkToken = () => {
      if (!token) {
        setTokenInfo(null)
        setTimeLeft('')
        return
      }

      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          const now = Math.floor(Date.now() / 1000)
          const timeRemaining = payload.exp ? payload.exp - now : 0
          
          setTokenInfo({
            issued: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'Unknown',
            expires: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Unknown',
            username: payload.username || payload.sub || 'Unknown',
            timeRemaining: timeRemaining,
            isExpired: timeRemaining <= 0
          })

          if (timeRemaining > 0) {
            const hours = Math.floor(timeRemaining / 3600)
            const minutes = Math.floor((timeRemaining % 3600) / 60)
            const seconds = timeRemaining % 60
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
          } else {
            setTimeLeft('EXPIRED')
          }
        }
      } catch (error) {
        console.error('Error parsing token:', error)
        setTokenInfo({ error: 'Invalid token format' })
      }
    }

    checkToken()
    const interval = setInterval(checkToken, 1000) // Update every second

    return () => clearInterval(interval)
  }, [token])

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/medicines/user/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('🧪 Backend test response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Backend connection successful:', data.length, 'medicines')
        alert(`✅ Backend connection successful! Found ${data.length} medicines.`)
      } else {
        console.error('❌ Backend connection failed:', response.status, response.statusText)
        alert(`❌ Backend connection failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Backend connection error:', error)
      alert(`❌ Backend connection error: ${error}`)
    }
  }

  return (
    <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
      <h4 className="font-semibold text-blue-800 mb-3">🔍 Login Status Checker</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Authenticated:</span>
          <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </Badge>
        </div>

        <div className="flex justify-between">
          <span>User:</span>
          <span className="font-mono">{user?.name || 'None'}</span>
        </div>

        <div className="flex justify-between">
          <span>Has Token:</span>
          <Badge variant={token ? 'default' : 'secondary'}>
            {token ? 'Yes' : 'No'}
          </Badge>
        </div>

        {tokenInfo && (
          <>
            <div className="flex justify-between">
              <span>Token Issued:</span>
              <span className="font-mono text-xs">{tokenInfo.issued}</span>
            </div>

            <div className="flex justify-between">
              <span>Token Expires:</span>
              <span className="font-mono text-xs">{tokenInfo.expires}</span>
            </div>

            <div className="flex justify-between">
              <span>Time Left:</span>
              <Badge variant={tokenInfo.isExpired ? 'destructive' : 'default'}>
                {timeLeft}
              </Badge>
            </div>

            <div className="flex justify-between">
              <span>Username in Token:</span>
              <span className="font-mono text-xs">{tokenInfo.username}</span>
            </div>
          </>
        )}

        {token && (
          <Button
            onClick={testBackendConnection}
            size="sm"
            className="w-full mt-3"
          >
            Test Backend Connection
          </Button>
        )}
      </div>
    </Card>
  )
}