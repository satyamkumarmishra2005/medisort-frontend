import React, { useState } from 'react'
import { medicineApi } from '../services/medicineApi'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Play, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'running'
  message: string
  timestamp?: string
}

export const AuthTestRunner: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { isAuthenticated, token, user } = useAuth()

  const updateTest = (name: string, status: TestResult['status'], message: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name)
      const newTest: TestResult = {
        name,
        status,
        message,
        timestamp: new Date().toLocaleTimeString()
      }
      
      if (existing) {
        return prev.map(t => t.name === name ? newTest : t)
      } else {
        return [...prev, newTest]
      }
    })
  }

  const runAuthTests = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Check authentication status
    updateTest('Auth Status', 'running', 'Checking authentication status...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isAuthenticated && token && user) {
      updateTest('Auth Status', 'success', `Authenticated as ${user.email}`)
    } else {
      updateTest('Auth Status', 'error', 'Not authenticated - missing token or user data')
    }

    // Test 2: Check token format
    updateTest('Token Format', 'running', 'Validating token format...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (token) {
      const parts = token.split('.')
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]))
          const hasRequiredFields = payload.exp && payload.iat && payload.sub
          if (hasRequiredFields) {
            updateTest('Token Format', 'success', 'Token format is valid')
          } else {
            updateTest('Token Format', 'error', 'Token missing required fields (exp, iat, sub)')
          }
        } catch (error) {
          updateTest('Token Format', 'error', 'Token payload is not valid JSON')
        }
      } else {
        updateTest('Token Format', 'error', 'Token does not have 3 parts (header.payload.signature)')
      }
    } else {
      updateTest('Token Format', 'error', 'No token found')
    }

    // Test 3: Check token expiration
    updateTest('Token Expiration', 'running', 'Checking token expiration...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        const timeRemaining = payload.exp - currentTime
        
        if (timeRemaining > 0) {
          const minutes = Math.floor(timeRemaining / 60)
          updateTest('Token Expiration', 'success', `Token valid for ${minutes} more minutes`)
        } else {
          updateTest('Token Expiration', 'error', `Token expired ${Math.abs(timeRemaining)} seconds ago`)
        }
      } catch (error) {
        updateTest('Token Expiration', 'error', 'Could not parse token expiration')
      }
    } else {
      updateTest('Token Expiration', 'error', 'No token to check')
    }

    // Test 4: Test API call
    updateTest('API Call Test', 'running', 'Testing medicine API call...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const medicines = await medicineApi.getMedicines()
      updateTest('API Call Test', 'success', `Successfully fetched ${medicines.length} medicines`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      updateTest('API Call Test', 'error', `API call failed: ${errorMessage}`)
    }

    // Test 5: Test reminder creation (if authenticated)
    if (isAuthenticated && token) {
      updateTest('Reminder Test', 'running', 'Testing reminder creation...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        // This will likely fail if no medicines exist, but tests the auth flow
        await medicineApi.addReminderToMedicine(1, {
          reminderTime: '09:00',
          frequency: 'daily'
        })
        updateTest('Reminder Test', 'success', 'Reminder creation endpoint accessible')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('Authentication')) {
          updateTest('Reminder Test', 'error', `Auth failed: ${errorMessage}`)
        } else {
          updateTest('Reminder Test', 'success', 'Auth passed (endpoint error is expected without valid medicine)')
        }
      }
    } else {
      updateTest('Reminder Test', 'error', 'Skipped - not authenticated')
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Authentication Test Runner</h3>
          <p className="text-sm text-gray-600">
            Run comprehensive tests to diagnose authentication issues
          </p>
        </div>
        <Button 
          onClick={runAuthTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running Tests...' : 'Run Auth Tests'}
        </Button>
      </div>

      {tests.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Test Results</h4>
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium text-sm">{test.name}</p>
                  <p className="text-xs text-gray-600">{test.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {test.timestamp && (
                  <span className="text-xs text-gray-500">{test.timestamp}</span>
                )}
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tests.length > 0 && !isRunning && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Test Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="font-semibold text-green-600">
                {tests.filter(t => t.status === 'success').length}
              </p>
              <p className="text-gray-600">Passed</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-red-600">
                {tests.filter(t => t.status === 'error').length}
              </p>
              <p className="text-gray-600">Failed</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-600">
                {tests.length}
              </p>
              <p className="text-gray-600">Total</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default AuthTestRunner