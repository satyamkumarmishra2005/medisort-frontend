import React, { useState } from 'react'
import { Globe, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.medisort.app'

export const CORSTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const testCORS = async () => {
    setIsRunning(true)
    clearResults()
    
    addResult(`🔍 Testing CORS with API Base URL: ${API_BASE_URL}`)
    addResult(`🌐 Current Origin: ${window.location.origin}`)
    
    // Test 1: Simple GET request
    try {
      addResult('📡 Testing simple GET request...')
      const response = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      addResult(`✅ GET request status: ${response.status}`)
    } catch (error) {
      addResult(`❌ GET request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test 2: OPTIONS preflight request
    try {
      addResult('📡 Testing OPTIONS preflight request...')
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })
      addResult(`✅ OPTIONS request status: ${response.status}`)
      
      // Log CORS headers
      const corsHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods', 
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Credentials'
      ]
      
      corsHeaders.forEach(header => {
        const value = response.headers.get(header)
        if (value) {
          addResult(`🔧 ${header}: ${value}`)
        } else {
          addResult(`⚠️ Missing header: ${header}`)
        }
      })
      
    } catch (error) {
      addResult(`❌ OPTIONS request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test 3: Actual registration request (like frontend does)
    try {
      addResult('📡 Testing actual registration request...')
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'CORS Test User',
          email: 'corstest@example.com',
          password: 'testpassword123',
          phone: '+1234567890'
        }),
      })
      
      addResult(`📊 Registration response status: ${response.status}`)
      
      if (response.ok) {
        const text = await response.text()
        addResult(`✅ Registration success: ${text}`)
      } else {
        const errorText = await response.text()
        addResult(`❌ Registration failed: ${errorText}`)
      }
      
    } catch (error) {
      addResult(`❌ Registration request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addResult(`🚨 This looks like a CORS error! The browser blocked the request.`)
      }
    }

    setIsRunning(false)
  }

  const testEnvironmentVariables = () => {
    clearResults()
    addResult(`🔍 Environment Variable Test:`)
    addResult(`📝 REACT_APP_API_URL: ${process.env.REACT_APP_API_URL || 'NOT SET'}`)
    addResult(`📝 REACT_APP_ENV: ${process.env.REACT_APP_ENV || 'NOT SET'}`)
    addResult(`📝 NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`)
    addResult(`📝 Resolved API_BASE_URL: ${API_BASE_URL}`)
    addResult(`🌐 Current window.location.origin: ${window.location.origin}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          CORS & Environment Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            onClick={testCORS} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Test CORS
          </Button>
          
          <Button 
            onClick={testEnvironmentVariables} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Test Environment
          </Button>
          
          <Button 
            onClick={clearResults} 
            variant="ghost"
            className="flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results</h3>
            <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {testResults.join('\n')}
              </pre>
            </div>
          </div>
        )}

        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
          <p className="font-medium mb-2">CORS Testing Notes:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>CORS Error:</strong> Browser blocks requests due to missing CORS headers</li>
            <li>• <strong>Environment Test:</strong> Checks if .env variables are loaded correctly</li>
            <li>• <strong>Expected Headers:</strong> Access-Control-Allow-Origin, Access-Control-Allow-Methods</li>
            <li>• <strong>Common Issue:</strong> Backend not configured to allow frontend origin</li>
          </ul>
        </div>

        {isRunning && (
          <div className="text-center text-sm text-gray-600">
            Running CORS tests...
          </div>
        )}
      </CardContent>
    </Card>
  )
}