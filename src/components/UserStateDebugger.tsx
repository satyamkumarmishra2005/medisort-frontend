import React from 'react'
import { Card } from './ui/card'
import { useAuth } from '../contexts/AuthContext'
import { User, Database, Key } from 'lucide-react'

/**
 * Debug component to show current user state and localStorage data
 */
const UserStateDebugger: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth()
  
  const localStorageUser = localStorage.getItem('medisort_user')
  const localStorageToken = localStorage.getItem('medisort_token')
  
  let parsedLocalUser = null
  try {
    parsedLocalUser = localStorageUser ? JSON.parse(localStorageUser) : null
  } catch (e) {
    parsedLocalUser = { error: 'Failed to parse user data' }
  }

  return (
    <Card className="p-4 m-4 bg-blue-50 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-800">User State Debugger</h3>
      </div>
      
      <div className="space-y-4 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium">Auth Context</h4>
          </div>
          <div className="bg-white p-3 rounded border">
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User Object:</strong></p>
            <pre className="text-xs mt-1 overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
            <p className="mt-2"><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium">localStorage</h4>
          </div>
          <div className="bg-white p-3 rounded border">
            <p><strong>User Data:</strong></p>
            <pre className="text-xs mt-1 overflow-x-auto">
              {JSON.stringify(parsedLocalUser, null, 2)}
            </pre>
            <p className="mt-2"><strong>Token:</strong> {localStorageToken ? `${localStorageToken.substring(0, 20)}...` : 'None'}</p>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium mb-2">Phone Number Analysis</h4>
          <p><strong>Context User Phone:</strong> {user?.phone || 'Not set'}</p>
          <p><strong>LocalStorage User Phone:</strong> {parsedLocalUser?.phone || 'Not set'}</p>
          <p><strong>Should Need Phone:</strong> {(!user?.phone || user.phone.trim() === '') ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>
    </Card>
  )
}

export default UserStateDebugger