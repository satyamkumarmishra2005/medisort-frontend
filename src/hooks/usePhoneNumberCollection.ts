import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/toast'
import { ApiService } from '../services/api'

interface UsePhoneNumberCollectionReturn {
  isLoading: boolean
  checkAndRedirectIfNeeded: () => Promise<boolean>
  submitPhoneNumber: (phoneNumber: string) => Promise<boolean>
}

export const usePhoneNumberCollection = (): UsePhoneNumberCollectionReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const { addToast } = useToast()

  const checkAndRedirectIfNeeded = useCallback(async (): Promise<boolean> => {
    // No onboarding process - always return false (phone not needed)
    return false
  }, [])

  const submitPhoneNumber = useCallback(async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await ApiService.updatePhoneNumber(phoneNumber)

      if (result.success) {
        // Update user context with phone number
        if (user && setUser) {
          const updatedUser = { ...user, phone: phoneNumber }
          setUser(updatedUser)
          localStorage.setItem('medisort_user', JSON.stringify(updatedUser))
        }

        addToast({
          type: 'success',
          title: 'Phone Number Added!',
          description: 'Your phone number has been successfully saved.',
          duration: 4000
        })

        return true
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          description: result.message || 'Failed to save phone number. Please try again.',
          duration: 5000
        })
        return false
      }
    } catch (error) {
      console.error('Error submitting phone number:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to save phone number. Please try again.',
        duration: 5000
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, setUser, addToast])

  return {
    isLoading,
    checkAndRedirectIfNeeded,
    submitPhoneNumber
  }
}