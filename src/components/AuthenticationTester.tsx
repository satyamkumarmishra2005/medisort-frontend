import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { medicineApi } from '../services/medicineApi'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useToast } from './ui/toast'

export const AuthenticationTester: React.FC = () => {
  const { user, token, isAuthenticated, isTokenExpired } = useAuth()
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const { addToast } = useToast()

  const runAuthTest = async () => {
    setTesting(true)
    const results: any = {
      timestamp: new Date().toISOString(),
      authContext: {
        isAuthenticated,
        isTokenExpired: isTokenExpired(),
        hasToken: !!token,
        hasUser: !!user,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'None'
      },
      apiTests: {}
    }

    // Test 1: Try to get medicines
    try {
      console.log('🧪 Testing getMedicines API call...')
      const medicines = await medicineApi.getMedicines()
      results.apiTests.getMedicines = {
        success: true,
        count: medicines.length,
        data: medicines.slice(0, 2) // Just first 2 for display
      }
      console.log('✅ getMedicines succeeded:', medicines.length, 'medicines')
    } catch (error: any) {
      results.apiTests.getMedicines = {
        success: false,
        error: error.message,
        status: error.response?.status
      }
      console.error('❌ getMedicines failed:', error)
    }

    // Test 2: Try to create a test reminder (if we have medicines)
    if (results.apiTests.getMedicines.success && results.apiTests.getMedicines.count > 0) {
      try {
        const firstMedicine = results.apiTests.getMedicines.data[0]
        console.log('🧪 Testing addReminderToMedicine API call...')
        
        const testReminder = {
          reminderTime: '09:00',
          frequency: 'daily'
        }
        
        const reminder = await medicineApi.addReminderToMedicine(firstMedicine.id, testReminder)
        results.apiTests.addReminder = {
          success: true,
          data: reminder
        }
        console.log('✅ addReminderToMedicine succeeded:', reminder)
        
        // Clean up - delete the test reminder
        if (reminder.id) {
          await medicineApi.deleteReminder(reminder.id)
          console.log('🧹 Test reminder cleaned up')
        }
      } catch (error: any) {
        results.apiTests.addReminder = {
          success: false,
          error: error.message,
          status: error.response?.status
        }
        console.error('❌ addReminderToMedicine failed:', error)
      }
    }

    setTestResults(results)
    setTesting(false)

    // Show summary
    if (results.apiTests.getMedicines.success) {
      addToast({ title: 'Authentication test passed!', type: 'success' })
    } else {
      addToast({ title: 'Authentication test failed - check results below', type: 'error' })
    }
  }

  return (
    <Card className="p-4 mb-4 bg-purple-50 border-purple-200">
      <h4 className="font-semibold text-purple-800 mb-3">🔬 Authentication Tester</h4>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Authenticated:</span>
            <Badge variant={isAuthenticated ? 'default' : 'destructive'} className="ml-2">
              {isAuthenticated ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div>
            <span className="font-medium">Token Expired:</span>
            <Badge variant={isTokenExpired() ? 'destructive' : 'default'} className="ml-2">
              {isTokenExpired() ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div>
            <span className="font-medium">User:</span>
            <span className="ml-2 text-purple-700">
              {user ? user.name : 'None'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Token:</span>
            <span className="ml-2 text-purple-700 font-mono text-xs">
              {token ? token.substring(0, 15) + '...' : 'None'}
            </span>
          </div>
        </div>

        <Button
          onClick={runAuthTest}
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing Authentication...' : 'Run Authentication Test'}
        </Button>

        {testResults && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h5 className="font-semibold mb-2">Test Results:</h5>
            <pre className="text-xs overflow-auto max-h-64 bg-gray-50 p-2 rounded">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  )
}