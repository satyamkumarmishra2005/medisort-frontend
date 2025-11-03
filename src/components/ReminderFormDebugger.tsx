import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

export const ReminderFormDebugger: React.FC = () => {
  const { isAuthenticated, isTokenExpired, user, token } = useAuth()

  return (
    <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
      <h4 className="font-semibold text-blue-800 mb-2">🔍 Authentication Debug Info</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Authenticated:</span>
          <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Token Expired:</span>
          <Badge variant={isTokenExpired() ? 'destructive' : 'default'}>
            {isTokenExpired() ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Has Token:</span>
          <Badge variant={token ? 'default' : 'secondary'}>
            {token ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">User:</span>
          <span className="text-blue-700">
            {user ? `${user.name} (${user.email})` : 'None'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Should Default To:</span>
          <Badge variant={(isAuthenticated && !isTokenExpired()) ? 'default' : 'secondary'}>
            {(isAuthenticated && !isTokenExpired()) ? 'Medicine Reminder' : 'Custom Reminder'}
          </Badge>
        </div>
      </div>
    </Card>
  )
}