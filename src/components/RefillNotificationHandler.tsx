import React, { useState, useEffect } from 'react'
import { RefillNotificationModal } from './RefillNotificationModal'
import { RefillNotificationData } from '../services/refillNotificationService'

export const RefillNotificationHandler: React.FC = () => {
  const [currentAlert, setCurrentAlert] = useState<RefillNotificationData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Listen for refill notifications
    const handleRefillNotification = (event: CustomEvent) => {
      const { medicineId, medicineName, message, alertLevel, daysRemaining } = event.detail
      
      // Create alert data from notification
      const alertData: RefillNotificationData = {
        medicineId,
        medicineName,
        dosage: '', // Will be filled by the service
        daysRemaining,
        expectedEndDate: new Date(),
        currentStock: 0,
        alertLevel,
        notificationsSentToday: 0,
        lastNotificationSent: null
      }
      
      setCurrentAlert(alertData)
      setIsModalOpen(true)
    }

    // Listen for navigation to refill
    const handleNavigateToRefill = (event: CustomEvent) => {
      const { medicineId } = event.detail
      
      // Get the alert data for this medicine
      // This would typically come from the refill service
      console.log(`Navigate to refill for medicine ${medicineId}`)
    }

    window.addEventListener('refill-notification', handleRefillNotification as EventListener)
    window.addEventListener('navigate-to-refill', handleNavigateToRefill as EventListener)

    return () => {
      window.removeEventListener('refill-notification', handleRefillNotification as EventListener)
      window.removeEventListener('navigate-to-refill', handleNavigateToRefill as EventListener)
    }
  }, [])

  const handleModalClose = () => {
    setIsModalOpen(false)
    setCurrentAlert(null)
  }

  return (
    <RefillNotificationModal
      alert={currentAlert}
      isOpen={isModalOpen}
      onClose={handleModalClose}
    />
  )
}