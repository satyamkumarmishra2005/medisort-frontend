import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { useToast } from './ui/toast'

export const SessionCleaner: React.FC = () => {
  const { logout } = useAuth()
  const { addToast } = useToast()

  const clearSession = () => {
    // Clear all auth-related data
    localStorage.removeItem('medisort_token')
    localStorage.removeItem('medisort_user')
    localStorage.removeItem('medicine_reminder_statuses')
    
    // Call logout to update context
    logout()
    
    addToast({ title: 'Session cleared! Please log in again.', type: 'success' })
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }

  return (
    <Card className="p-4 mb-4 bg-red-50 border-red-200">
      <h4 className="font-semibold text-red-800 mb-3">🧹 Session Cleaner</h4>
      <p className="text-red-700 text-sm mb-3">
        Your session has expired. Click below to clear all stored data and redirect to login.
      </p>
      <Button
        onClick={clearSession}
        variant="outline"
        className="w-full text-red-800 border-red-300 hover:bg-red-100"
      >
        Clear Session & Go to Login
      </Button>
    </Card>
  )
}