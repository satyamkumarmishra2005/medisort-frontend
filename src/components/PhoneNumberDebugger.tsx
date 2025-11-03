import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { useAuth } from '../contexts/AuthContext'
import { ApiService } from '../services/api'
import { useToast } from './ui/toast'
import { Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react'

/**
 * Debug component to test phone number collection flow
 * This component helps test the API endpoints and flow logic
 */
const PhoneNumberDebugger: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const { user, token } = useAuth()
  const { addToast } = useToast()

  const addResult = (title: string, success: boolean, data: any) => {
    const result = {
      id: Date.now(),
      title,
      success,
      data,
      timestamp: new Date().toLocaleTimeString()
    }
    setResults(prev => [result, ...prev])
  }

  const testNeedsPhone = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.checkNeedsPhone()
      addResult('Check Needs Phone', result.success, result)
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Phone Check Success',
          description: `Needs phone: ${result.needsPhone}`,
          duration: 3000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Phone Check Failed',
          description: result.message || 'Unknown error',
          duration: 3000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addResult('Check Needs Phone', false, { error: errorMessage })
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to check phone requirement',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testUpdatePhone = async () => {
    setIsLoading(true)
    try {
      const testPhone = '5551234567'
      const result = await ApiService.updatePhoneNumber(testPhone)
      addResult('Update Phone Number', result.success, result)
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Phone Update Success',
          description: `Phone updated to: ${testPhone}`,
          duration: 3000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Phone Update Failed',
          description: result.message || 'Unknown error',
          duration: 3000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addResult('Update Phone Number', false, { error: errorMessage })
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update phone number',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testUserProfile = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.getCurrentUserProfile()
      addResult('Get User Profile', result.success, result)
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Profile Fetch Success',
          description: 'User profile retrieved successfully',
          duration: 3000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Profile Fetch Failed',
          description: result.message || 'Unknown error',
          duration: 3000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addResult('Get User Profile', false, { error: errorMessage })
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to fetch user profile',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Phone Number Flow Debugger</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Current User Info</h3>
              <div className="text-sm space-y-1">
                <p><strong>Email:</strong> {user?.email || 'Not logged in'}</p>
                <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> {user?.phone || 'Not set'}</p>
                <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">API Endpoints</h3>
              <div className="text-sm space-y-1">
                <p>GET /needs-phone</p>
                <p>POST /update-phone</p>
                <p>GET /api/user/profile</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testNeedsPhone}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Test Needs Phone
            </Button>
            
            <Button
              onClick={testUpdatePhone}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Test Update Phone
            </Button>
            
            <Button
              onClick={testUserProfile}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Test Get Profile
            </Button>
            
            <Button
              onClick={clearResults}
              disabled={isLoading}
              variant="destructive"
            >
              Clear Results
            </Button>
          </div>
        </div>
      </Card>

      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Test Results</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">{result.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {result.timestamp}
                  </span>
                </div>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default PhoneNumberDebugger