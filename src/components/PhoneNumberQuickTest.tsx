import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { useAuth } from '../contexts/AuthContext'
import { ApiService } from '../services/api'
import { useToast } from './ui/toast'
import { Phone, TestTube, Loader2 } from 'lucide-react'

/**
 * Quick test component to debug phone number API calls
 * Add this temporarily to your dashboard to test the API
 */
const PhoneNumberQuickTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const { user, token } = useAuth()
  const { addToast } = useToast()

  const testPhoneCheck = async () => {
    setIsLoading(true)
    console.log('🧪 Testing phone check API...')
    console.log('🧪 User:', user)
    console.log('🧪 Token:', token ? 'Present' : 'Missing')
    
    try {
      const result = await ApiService.checkNeedsPhone()
      console.log('🧪 API Result:', result)
      setLastResult(result)
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'API Test Success',
          description: `needsPhone: ${result.needsPhone}`,
          duration: 5000
        })
      } else {
        addToast({
          type: 'error',
          title: 'API Test Failed',
          description: result.message || 'Unknown error',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('🧪 API Test Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastResult({ error: errorMessage })
      addToast({
        type: 'error',
        title: 'API Test Error',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectAPI = async () => {
    setIsLoading(true)
    console.log('🧪 Testing direct API call...')
    
    try {
      const response = await fetch('http://54.226.134.50:8080/needs-phone', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('🧪 Response status:', response.status)
      console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('🧪 Response data:', data)
      
      setLastResult({ 
        status: response.status, 
        ok: response.ok, 
        data 
      })
      
      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Direct API Success',
          description: `needsPhone: ${data.needsPhone}`,
          duration: 5000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Direct API Failed',
          description: `Status: ${response.status}`,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('🧪 Direct API Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastResult({ error: errorMessage })
      addToast({
        type: 'error',
        title: 'Direct API Error',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4 m-4 bg-yellow-50 border-yellow-200">
      <div className="flex items-center gap-2 mb-3">
        <TestTube className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Phone Number API Quick Test</h3>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm">
          <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
          <p><strong>Phone:</strong> {user?.phone || 'Not set'}</p>
          <p><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={testPhoneCheck}
            disabled={isLoading || !token}
            size="sm"
            variant="outline"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Test via ApiService
          </Button>
          
          <Button
            onClick={testDirectAPI}
            disabled={isLoading || !token}
            size="sm"
            variant="outline"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Test Direct API
          </Button>
        </div>
        
        {lastResult && (
          <div className="mt-3">
            <p className="text-sm font-medium mb-1">Last Result:</p>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  )
}

export default PhoneNumberQuickTest