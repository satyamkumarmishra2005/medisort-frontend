import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useToast } from './ui/toast'
import { useAuth } from '../contexts/AuthContext'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, Key, Users, Shield } from 'lucide-react'

const JWTTest: React.FC = () => {
  const [isTestingProtected, setIsTestingProtected] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const { token, testProtectedEndpoint, getAuthHeaders } = useAuth()
  const { addToast } = useToast()

  const testProtectedRoute = async () => {
    setIsTestingProtected(true)
    setTestResults(null)
    
    try {
      const result = await testProtectedEndpoint()
      setTestResults(result)
      
      addToast({
        type: result.success ? 'success' : 'error',
        title: result.success ? 'Protected Route Test Passed' : 'Protected Route Test Failed',
        description: result.message || 'Test completed',
        duration: 6000
      })
    } catch (error) {
      const errorMessage = 'Test failed with exception'
      setTestResults({ success: false, message: errorMessage })
      
      addToast({
        type: 'error',
        title: 'Test Error',
        description: errorMessage,
        duration: 6000
      })
    } finally {
      setIsTestingProtected(false)
    }
  }

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      addToast({
        type: 'success',
        title: 'Token Copied',
        description: 'JWT token copied to clipboard',
        duration: 3000
      })
    }
  }

  const copyAuthHeader = () => {
    if (token) {
      const authHeader = `Bearer ${token}`
      navigator.clipboard.writeText(authHeader)
      addToast({
        type: 'success',
        title: 'Authorization Header Copied',
        description: 'Bearer token copied to clipboard',
        duration: 3000
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          JWT Authentication Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            Token Status
          </h3>
          <div className="flex items-center gap-2">
            {token ? (
              <>
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Token Available
                </Badge>
                <Button
                  onClick={copyToken}
                  variant="outline"
                  size="sm"
                >
                  Copy Token
                </Button>
                <Button
                  onClick={copyAuthHeader}
                  variant="outline"
                  size="sm"
                >
                  Copy Auth Header
                </Button>
              </>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                No Token
              </Badge>
            )}
          </div>
          
          {token && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">JWT Token (first 50 chars):</p>
              <code className="text-xs font-mono break-all">
                {token.substring(0, 50)}...
              </code>
            </div>
          )}
        </div>

        {/* Protected Endpoint Test */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Protected Endpoint Test
          </h3>
          
          <div className="space-y-2">
            <Button
              onClick={testProtectedRoute}
              disabled={isTestingProtected || !token}
              variant="outline"
              className="w-full"
            >
              {isTestingProtected ? 'Testing /all endpoint...' : 'Test Protected Route (/all)'}
            </Button>
            
            {!token && (
              <p className="text-xs text-muted-foreground">
                Please login first to get a JWT token
              </p>
            )}
          </div>

          {testResults && (
            <div className={`p-4 rounded-md border ${
              testResults.success 
                ? 'bg-accent/10 border-accent/20' 
                : 'bg-destructive/10 border-destructive/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testResults.success ? (
                  <CheckCircle className="w-4 h-4 text-accent" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm font-medium">
                  {testResults.success ? 'Success' : 'Failed'}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {testResults.message}
              </p>
              
              {testResults.data && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Response Data:</p>
                  <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(testResults.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Testing Instructions:</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>1. Login to get a JWT token</p>
            <p>2. Click "Test Protected Route" to test /all endpoint</p>
            <p>3. Use "Copy Auth Header" for manual API testing</p>
            <p>4. Expected: 200 OK with user list if token is valid</p>
            <p>5. Expected: 401 Unauthorized if token is invalid/expired</p>
          </div>
        </div>

        {/* Manual Testing Info */}
        <div className="p-3 bg-muted/30 rounded-md">
          <h4 className="text-xs font-medium mb-2">Manual Testing with curl/Postman:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Endpoint:</strong> GET http://localhost:8081/all</p>
            <p><strong>Header:</strong> Authorization: Bearer {token ? '[copied token]' : '[login first]'}</p>
            <p><strong>Expected:</strong> JSON array of users</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default JWTTest