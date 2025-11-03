import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { useAuth } from '../contexts/AuthContext'
import { ApiService } from '../services/api'
import { useToast } from './ui/toast'
import PhoneNumberModal from './PhoneNumberModal'
import { usePhoneNumberCollection } from '../hooks/usePhoneNumberCollection'
import { Phone, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react'

/**
 * Integration test component for phone number collection flow
 * This tests the complete flow with your backend endpoints
 */
const PhoneNumberIntegrationTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, token } = useAuth()
  const { addToast } = useToast()
  const { submitPhoneNumber } = usePhoneNumberCollection()

  const addTestResult = (message: string, success: boolean = true) => {
    const timestamp = new Date().toLocaleTimeString()
    const icon = success ? '✅' : '❌'
    setTestResults(prev => [`${icon} [${timestamp}] ${message}`, ...prev])
  }

  const runFullIntegrationTest = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      addTestResult('🚀 Starting integration test...')
      
      // Test 1: Check authentication
      if (!token) {
        addTestResult('Authentication token missing', false)
        return
      }
      addTestResult('Authentication token present')
      
      // Test 2: Check needs phone endpoint
      addTestResult('Testing GET /needs-phone...')
      const needsPhoneResult = await ApiService.checkNeedsPhone()
      
      if (needsPhoneResult.success) {
        addTestResult(`Needs phone check successful: needsPhone = ${needsPhoneResult.needsPhone}`)
      } else {
        addTestResult(`Needs phone check failed: ${needsPhoneResult.message}`, false)
        return
      }
      
      // Test 3: Update phone number
      addTestResult('Testing POST /update-phone...')
      const testPhone = '5551234567'
      const updateResult = await ApiService.updatePhoneNumber(testPhone)
      
      if (updateResult.success) {
        addTestResult(`Phone update successful: ${testPhone}`)
      } else {
        addTestResult(`Phone update failed: ${updateResult.message}`, false)
        return
      }
      
      // Test 4: Verify phone was updated by checking needs phone again
      addTestResult('Verifying phone was updated...')
      const verifyResult = await ApiService.checkNeedsPhone()
      
      if (verifyResult.success) {
        if (verifyResult.needsPhone === false) {
          addTestResult('✨ Integration test completed successfully! Phone number flow is working.')
        } else {
          addTestResult('Phone was not properly saved (still needs phone)', false)
        }
      } else {
        addTestResult(`Verification failed: ${verifyResult.message}`, false)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult(`Integration test failed with error: ${errorMessage}`, false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalSubmit = async (phoneNumber: string) => {
    const success = await submitPhoneNumber(phoneNumber)
    if (success) {
      setIsModalOpen(false)
      addTestResult(`Modal submission successful: ${phoneNumber}`)
    } else {
      addTestResult('Modal submission failed', false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TestTube className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Phone Number Integration Test</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Current Status</h3>
              <div className="text-sm space-y-1">
                <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
                <p><strong>Phone:</strong> {user?.phone || 'Not set'}</p>
                <p><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</p>
                <p><strong>Backend:</strong> http://localhost:8081</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Test Endpoints</h3>
              <div className="text-sm space-y-1">
                <p>GET /needs-phone</p>
                <p>POST /update-phone</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={runFullIntegrationTest}
              disabled={isLoading || !token}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Run Full Integration Test
            </Button>
            
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading}
              variant="outline"
            >
              Test Phone Modal
            </Button>
            
            <Button
              onClick={clearResults}
              disabled={isLoading}
              variant="destructive"
            >
              Clear Results
            </Button>
          </div>

          {!token && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ You need to be logged in to test the phone number endpoints. 
                Please complete OAuth login first.
              </p>
            </div>
          )}
        </div>
      </Card>

      {testResults.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Test Results</h3>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))}
          </div>
        </Card>
      )}

      <PhoneNumberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}

export default PhoneNumberIntegrationTest