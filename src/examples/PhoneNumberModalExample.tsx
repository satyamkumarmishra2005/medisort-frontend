import React, { useState } from 'react'
import PhoneNumberModal from '../components/PhoneNumberModal'
import { Button } from '../components/ui/button'
import { usePhoneNumberCollection } from '../hooks/usePhoneNumberCollection'
import { useToast } from '../components/ui/toast'

/**
 * Example component showing how to use the PhoneNumberModal
 * This can be used in any component where you need to collect a phone number
 */
const PhoneNumberModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isLoading, submitPhoneNumber } = usePhoneNumberCollection()
  const { addToast } = useToast()

  const handlePhoneSubmit = async (phoneNumber: string) => {
    const success = await submitPhoneNumber(phoneNumber)
    
    if (success) {
      setIsModalOpen(false)
      addToast({
        type: 'success',
        title: 'Success!',
        description: 'Phone number has been saved successfully.',
        duration: 4000
      })
    }
    // Error handling is done in the hook
  }

  const handleModalClose = () => {
    if (!isLoading) {
      setIsModalOpen(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Phone Number Modal Example</h2>
      
      <Button onClick={() => setIsModalOpen(true)}>
        Open Phone Number Modal
      </Button>

      <PhoneNumberModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handlePhoneSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}

export default PhoneNumberModalExample