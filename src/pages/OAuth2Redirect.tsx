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
            // const response = await fetch('http://localhost:8081/api/user/profile', {
            //   method: 'GET',
            //   headers: {
            //     'Authorization': `Bearer ${token}`,
            //     'Content-Type': 'application/json'
            //   }
            // })


            // REPLACE WITH this session-based profile fetch:
            const response = await fetch('http://54.226.134.50:8080/api/user/profile-session', {
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
        fetchUserData().then(() => {
          console.log('✅ OAuth2 authentication successful, redirecting to dashboard...')

          // Redirect directly to dashboard - no onboarding process
          console.log('� Rbedirecting to /dashboard')
          window.location.href = '/dashboard'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 text-center max-w-md w-full"
      >
        {/* Logo with enhanced styling */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full mb-8 shadow-2xl shadow-teal-500/25"
        >
          <Heart className="w-10 h-10 text-white" />
        </motion.div>

        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to MediSort</h1>
          <p className="text-white/70 mb-8">Completing your authentication...</p>

          {searchParams.get('error') ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-3 text-red-400 bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <XCircle className="w-6 h-6" />
                <p className="font-medium">Authentication failed</p>
              </div>
              <p className="text-white/60 text-sm">Don't worry, let's try again</p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Return to Login
              </button>
            </motion.div>
          ) : searchParams.get('token') ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-3 text-green-400 bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                <CheckCircle className="w-6 h-6" />
                <p className="font-medium">Authentication successful!</p>
              </div>
              <p className="text-white/60 text-sm">Taking you to your dashboard...</p>

              {/* Loading animation */}
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>

              <button
                onClick={() => {
                  console.log('Manual redirect to dashboard...')
                  window.location.href = '/dashboard'
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Continue to Dashboard
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-3 text-white/80">
                <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium">Processing your request...</p>
              </div>
              <p className="text-white/60 text-sm">This will only take a moment</p>

              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                Return to Login
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Subtle branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-white/40 text-sm mt-6"
        >
          Your healthcare management companion
        </motion.p>
      </motion.div>
    </div>
  )
}

export default OAuth2Redirect