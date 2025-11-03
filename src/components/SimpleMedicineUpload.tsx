import React, { useState } from 'react'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { MedicineForm } from './MedicineForm'
import { medicineApi, type MedicineRequest } from '../services/medicineApi'
import { cn } from '../lib/utils'

interface SimpleMedicineUploadProps {
  onSuccess?: (medicine: any) => void
  onCancel?: () => void
  className?: string
}

export const SimpleMedicineUpload: React.FC<SimpleMedicineUploadProps> = ({
  onSuccess,
  onCancel,
  className
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (medicineData: MedicineRequest) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await medicineApi.createMedicine(medicineData)
      
      // ✅ Clean up any automatic reminders created by backend
      if (result.id) {
        try {
          console.log('🧹 Checking for automatic reminders created by backend...')
          const automaticReminders = await medicineApi.getMedicineReminders(result.id)
          
          if (automaticReminders.length > 0) {
            console.log(`🗑️ Found ${automaticReminders.length} automatic reminders, deleting them...`)
            
            // Delete all automatic reminders
            for (const reminder of automaticReminders) {
              if (reminder.id) {
                await medicineApi.deleteReminder(reminder.id)
                console.log(`✅ Deleted automatic reminder: ${reminder.reminderTime}`)
              }
            }
            
            console.log('✅ All automatic reminders cleaned up successfully')
          }
        } catch (reminderError) {
          console.error('⚠️ Error cleaning up automatic reminders:', reminderError)
          // Don't fail the whole operation
        }
      }
      
      onSuccess?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save medicine')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
  }

  return (
    <div className={cn("max-w-4xl mx-auto p-6", className)}>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-center flex-1">
              Add New Medicine
            </CardTitle>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Enter Medicine Information
              </h2>
              <p className="text-gray-600">
                Fill in the medicine details to add it to your collection
              </p>
            </div>

            <MedicineForm
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}