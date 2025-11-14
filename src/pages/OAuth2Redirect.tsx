import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/toast'
import { motion } from 'framer-motion'
import { Heart, CheckCircle, XCircle } from 'lucide-react'
import { decodeJWT } from '../utils/jwt'

const OAuth2Redirect: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { setUser, setToken } = useAuth()

  useEffect(() => {
    // Check if we're already on dashboard (URL changed but component still showing)
    if (window.location.pathname === '/dashboard') {
      console.log('Already on dashboard, forcing reload...')
      window.location.reload()
      return
    }

    const token = searchParams.get('token')
    const error = searchParams.get('error')

    console.log('OAuth2Redirect - URL params:', {
      token: token ? token.substring(0, 20) + '...' : 'None',
      error,
      currentPath: window.location.pathname
    })

    if (error && error.trim() !== '') {
      console.log('OAuth2 Error:', error)
      addToast({
        type: 'error',
        title: 'Google Login Failed',
        description: error || 'Authentication failed. Please try again.',
        duration: 6000
      })

      // Redirect to login after showing error
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } else if (token && token.trim() !== '') {
      console.log('Processing OAuth2 token...')
      try {
        // Store the JWT token
        localStorage.setItem('medisort_token', token)

        // Store token first
        setToken(token)

        // Fetch user data from backend using the token
        const fetchUserData = async () => {
          try {
            // const response = await fetch('https://api.medisort.app/api/user/profile', {
            //   method: 'GET',
            //   headers: {
            //     'Authorization': `Bearer ${token}`,
            //     'Content-Type': 'application/json'
            //   }
            // })

            
// REPLACE WITH this session-based profile fetch:
const response = await fetch('https://api.medisort.app/api/user/profile-session', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})

            if (response.ok) {
              const profileData = await response.json()
              console.log('Profile data from backend:', profileData)
              console.log('Backend response status:', response.status)

              // Check if we got valid data from backend
              if (profileData && profileData.email && !profileData.error) {
                console.log('✅ Successfully got user data from backend database')
                console.log('Backend profile data:', profileData)
                
                const userData = {
                  id: Date.now().toString(),
                  email: profileData.email,
                  name: profileData.name || 'User',
                  phone: profileData.phone || '',
                  role: 'patient' as const,
                  provider: profileData.provider || 'google'
                }

                console.log('User data from backend database:', userData)
                localStorage.setItem('medisort_user', JSON.stringify(userData))

                // Update auth context
                if (setUser) {
                  setUser(userData)
                }
              } else {
                console.log('❌ Backend returned error or empty data:', profileData)
                console.log('Response status was OK but data is invalid')
                
                // Try to decode JWT to get the real data
                const payload = decodeJWT(token)
                console.log('JWT payload for fallback:', payload)

                if (payload && payload.sub) {
                  const userData = {
                    id: payload.sub,
                    email: payload.sub, // The 'sub' field contains the email in your JWT
                    name: payload.name || 'User',
                    role: 'patient' as const,
                    provider: 'google'
                  }

                  console.log('User data from JWT fallback:', userData)
                  localStorage.setItem('medisort_user', JSON.stringify(userData))

                  // Update auth context
                  if (setUser) {
                    setUser(userData)
                  }
                } else {
                  console.log('❌ JWT payload is also invalid')
                  // This should not happen with your working backend
                  const userData = {
                    id: Date.now().toString(),
                    email: 'unknown@example.com',
                    name: 'User',
                    role: 'patient' as const,
                    provider: 'google'
                  }
                  
                  localStorage.setItem('medisort_user', JSON.stringify(userData))
                  if (setUser) {
                    setUser(userData)
                  }
                }
              }
            } else {
              // Fallback to JWT data if backend call fails
              console.log('Backend profile fetch failed with status:', response.status)
              const responseText = await response.text()
              console.log('Response text:', responseText)
              const payload = decodeJWT(token)
              console.log('JWT payload:', payload)

              if (payload && payload.sub) {
                const userData = {
                  id: payload.sub,
                  email: payload.sub, // The 'sub' field contains the email in your JWT
                  name: payload.name || 'User',
                  role: 'patient' as const,
                  provider: 'google'
                }

                console.log('User data from JWT fallback:', userData)
                localStorage.setItem('medisort_user', JSON.stringify(userData))

                // Update auth context
                if (setUser) {
                  setUser(userData)
                }
              } else {
                console.log('❌ JWT payload is invalid, using placeholder')
                const userData = {
                  id: Date.now().toString(),
                  email: 'unknown@example.com',
                  name: 'User',
                  role: 'patient' as const,
                  provider: 'google'
                }
                
                localStorage.setItem('medisort_user', JSON.stringify(userData))
                if (setUser) {
                  setUser(userData)
                }
              }
            }
          } catch (fetchError) {
            console.error('Error fetching user profile:', fetchError)
            // Fallback to JWT data
            const payload = decodeJWT(token)
            console.log('JWT payload after fetch error:', payload)

            if (payload && payload.sub) {
              const userData = {
                id: payload.sub,
                email: payload.sub, // The 'sub' field contains the email in your JWT
                name: payload.name || 'User',
                role: 'patient' as const,
                provider: 'google'
              }

              console.log('User data from JWT fallback after error:', userData)
              localStorage.setItem('medisort_user', JSON.stringify(userData))

              // Update auth context
              if (setUser) {
                setUser(userData)
              }
            } else {
              console.log('❌ JWT payload is invalid after fetch error')
              const userData = {
                id: Date.now().toString(),
                email: 'unknown@example.com',
                name: 'User',
                role: 'patient' as const,
                provider: 'google'
              }
              
              localStorage.setItem('medisort_user', JSON.stringify(userData))
              if (setUser) {
                setUser(userData)
              }
            }
          }
        }

        // Call the async function and wait for it to complete
        fetchUserData().then(async () => {
          console.log('🔍 OAuth2 authentication successful, checking if phone number is needed...')
          console.log('🔍 Current token:', token ? token.substring(0, 20) + '...' : 'No token')
          console.log('🔍 Current user data in localStorage:', localStorage.getItem('medisort_user'))
          console.log('🔍 About to start phone check process...')

          try {
            // Check if user needs to provide phone number
            console.log('🔍 Importing ApiService...')
            const { ApiService } = await import('../services/api')
            console.log('🔍 ApiService imported successfully')
            
            console.log('🔍 Making API call to check phone requirement...')
            console.log('🔍 API Base URL: https://api.medisort.app')
            console.log('🔍 Current token for API call:', token ? 'Token available' : 'No token')
            
            // Check phone requirement
            const phoneResponse = await fetch('https://api.medisort.app/api/user/needs-phone-session', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            const phoneCheckResult = phoneResponse.ok ? 
              { success: true, needsPhone: (await phoneResponse.json()).needsPhone } :
              { success: false, message: 'Failed to check phone status' };
            
            console.log('📱 Phone check result:', phoneCheckResult)
            console.log('📱 Success:', phoneCheckResult.success)
            console.log('📱 Needs phone:', phoneCheckResult.needsPhone)
            console.log('📱 Message:', phoneCheckResult.message)
            
            // Additional debugging
            console.log('📱 Full response object:', JSON.stringify(phoneCheckResult, null, 2))
            console.log('📱 Type of needsPhone:', typeof phoneCheckResult.needsPhone)
            console.log('📱 Strict equality check (needsPhone === true):', phoneCheckResult.needsPhone === true)

            if (phoneCheckResult.success && phoneCheckResult.needsPhone === true) {
              console.log('✅ User needs to provide phone number, redirecting to phone collection...')
              
              // Redirect to phone number collection immediately without success toast
              console.log('🔄 Redirecting to /phone-number-collection')
              navigate('/phone-number-collection', { replace: true })
            } else if (phoneCheckResult.success && phoneCheckResult.needsPhone === false) {
              console.log('✅ Phone number already provided, redirecting to dashboard...')
              
              // Redirect to dashboard immediately without success toast
              console.log('🔄 Redirecting to /dashboard')
              window.location.href = '/dashboard'
            } else {
              console.log('❌ Phone check failed, proceeding to dashboard anyway...')
              console.log('❌ Failure reason:', phoneCheckResult.message)
              
              // Redirect to dashboard immediately without warning toast
              console.log('🔄 Redirecting to /dashboard (fallback)')
              window.location.href = '/dashboard'
            }
          } catch (phoneCheckError) {
            console.error('❌ Error checking phone number requirement:', phoneCheckError)
            console.error('❌ Error details:', {
              name: phoneCheckError instanceof Error ? phoneCheckError.name : 'Unknown',
              message: phoneCheckError instanceof Error ? phoneCheckError.message : 'Unknown error',
              stack: phoneCheckError instanceof Error ? phoneCheckError.stack : 'No stack trace'
            })
            
            // If phone check fails, proceed to dashboard anyway
            console.log('🔄 Redirecting to /dashboard (error fallback)')
            window.location.href = '/dashboard'
          }
        })

      } catch (error) {
        console.error('Error processing OAuth2 token:', error)
        addToast({
          type: 'error',
          title: 'Authentication Error',
          description: 'Failed to process authentication. Please try again.',
          duration: 6000
        })

        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2000)
      }
    } else {
      console.log('No token or error found, redirecting to login')
      // No token or error, redirect to login immediately
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, addToast, setUser, setToken])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-healthcare-gradient rounded-full mb-6">
          <Heart className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-4">Processing Authentication</h1>

        {searchParams.get('error') ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              <p>Authentication failed. Redirecting...</p>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : searchParams.get('token') ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-accent">
              <CheckCircle className="w-5 h-5" />
              <p>Authentication successful. Redirecting...</p>
            </div>
            <button
              onClick={() => {
                console.log('Manual redirect to dashboard...')
                window.location.href = '/dashboard'
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p>Processing...</p>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Debug info */}
        <div className="mt-8 p-4 bg-muted/20 rounded-md text-xs text-muted-foreground">
          <p><strong>Debug Info:</strong></p>
          <p>Token: {searchParams.get('token') ? 'Present' : 'Missing'}</p>
          <p>Error: {searchParams.get('error') || 'None'}</p>
          <p>URL: {window.location.href}</p>
        </div>
      </motion.div>
    </div>
  )
}

export default OAuth2Redirect