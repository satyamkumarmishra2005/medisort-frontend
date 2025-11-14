import React, { useState } from 'react'
import { Globe, CheckCircle, XCircle, AlertTriangle, Wifi } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.medisort.app'

interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'error' | 'warning'
  statusCode?: number
  message: string
  responseTime?: number
}

export const BackendConnectivityTester: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
      const responseTime = Date.now() - startTime

      let responseText = ''
      try {
        responseText = await response.text()
      } catch (e) {
        responseText = 'Could not read response'
      }

      if (response.ok) {
        return {
          endpoint,
          method,
          status: 'success',
          statusCode: response.status,
          message: `✅ Success: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`,
          responseTime
        }
      } else {
        return {
          endpoint,
          method,
          status: 'error',
          statusCode: response.status,
          message: `❌ Error ${response.status}: ${responseText}`,
          responseTime
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        endpoint,
        method,
        status: 'error',
        message: `❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime
      }
    }
  }

  const runBasicConnectivityTest = async () => {
    setIsRunning(true)
    clearResults()

    console.log('🧪 Starting backend connectivity test...')

    // Test 1: Basic health check (if available)
    addResult(await testEndpoint('/health', 'GET'))

    // Test 2: API root
    addResult(await testEndpoint('/api', 'GET'))

    // Test 3: Auth endpoints (these should be publicly accessible)
    addResult(await testEndpoint('/api/auth', 'GET'))

    // Test 4: Registration endpoint (should not require auth)
    addResult(await testEndpoint('/api/auth/register', 'POST', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword',
      phone: '+1234567890'
    }))

    // Test 5: Login endpoint (should not require auth)
    addResult(await testEndpoint('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'testpassword'
    }))

    setIsRunning(false)
  }

  const runProtectedEndpointTest = async () => {
    setIsRunning(true)
    
    console.log('🔐 Testing protected endpoints (should return 401)...')

    // These should return 401 without authentication
    addResult(await testEndpoint('/api/medicines/user/active', 'GET'))
    addResult(await testEndpoint('/api/custom-reminders', 'GET'))
    addResult(await testEndpoint('/api/notifications/unread', 'GET'))

    setIsRunning(false)
  }

  const testCORS = async () => {
    setIsRunning(true)
    
    console.log('🌐 Testing CORS configuration...')

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })

      addResult({
        endpoint: '/api/auth',
        method: 'OPTIONS',
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        message: response.ok ? '✅ CORS preflight successful' : `❌ CORS preflight failed: ${response.status}`
      })
    } catch (error) {
      addResult({
        endpoint: '/api/auth',
        method: 'OPTIONS',
        status: 'error',
        message: `❌ CORS Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Backend Connectivity Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            onClick={runBasicConnectivityTest} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Wifi className="w-4 h-4" />
            Test Basic Connectivity
          </Button>
          
          <Button 
            onClick={runProtectedEndpointTest} 
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Test Protected Endpoints
          </Button>
          
          <Button 
            onClick={testCORS} 
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Test CORS
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Test Results</h3>
              <Button onClick={clearResults} variant="ghost" size="sm">
                Clear
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded border text-sm ${
                    result.status === 'success' ? 'bg-green-50 border-green-200' :
                    result.status === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium">
                        {result.method} {result.endpoint}
                        {result.statusCode && (
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                            {result.statusCode}
                          </span>
                        )}
                        {result.responseTime && (
                          <span className="ml-2 text-xs text-gray-500">
                            {result.responseTime}ms
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-1 break-all">
                        {result.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
          <p className="font-medium mb-2">Backend Testing Notes:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Basic Connectivity:</strong> Tests if the backend is reachable and auth endpoints exist</li>
            <li>• <strong>Protected Endpoints:</strong> Should return 401 without authentication (this is correct)</li>
            <li>• <strong>CORS Test:</strong> Checks if cross-origin requests are properly configured</li>
            <li>• <strong>Registration Issue:</strong> If registration returns 401, the backend has incorrect security config</li>
            <li>• <strong>Current API Base:</strong> {API_BASE_URL}</li>
            <li>• <strong>Environment:</strong> {process.env.REACT_APP_ENV || 'production'}</li>
          </ul>
        </div>

        {isRunning && (
          <div className="text-center text-sm text-gray-600">
            Running tests...
          </div>
        )}
      </CardContent>
    </Card>
  )
}