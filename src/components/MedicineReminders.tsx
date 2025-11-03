import React, { useState, useEffect, useCallback } from 'react'
import { MedicineReminder, Medicine, ReminderRequest, medicineApi } from '../services/medicineApi'
import { customReminderService, CustomReminder } from '../services/customReminderService'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { LoadingSpinner } from './ui/loading'
import { useToast } from './ui/toast'
import { ReminderFormDebugger } from './ReminderFormDebugger'
import { SimpleCustomReminderTest } from './SimpleCustomReminderTest'
import { AuthenticationTester } from './AuthenticationTester'
import { SessionCleaner } from './SessionCleaner'
import { LoginStatusChecker } from './LoginStatusChecker'
import { AuthenticationHelper } from './AuthenticationHelper'
import { AuthTestRunner } from './AuthTestRunner'
import { Plus, Edit, Trash2, Clock, Bell, BellOff, AlertCircle } from 'lucide-react'

// Extended type to handle both medicine and custom reminders
type ExtendedReminder = MedicineReminder & { isCustom?: boolean }

export const MedicineReminders: React.FC = () => {
  const [reminders, setReminders] = useState<ExtendedReminder[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ExtendedReminder | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  const { addToast } = useToast()
  const { isAuthenticated, isTokenExpired } = useAuth()

  // Initialize form data with proper default based on auth status
  const getInitialFormData = () => {
    const isAuthValid = isAuthenticated && !isTokenExpired()
    console.log('🔍 getInitialFormData - Auth status:', { isAuthenticated, isTokenExpired: isTokenExpired(), isAuthValid })
    return {
      medicineId: 0,
      reminderTime: '',
      frequency: 'daily',
      isActive: true,
      customTitle: '',
      reminderType: isAuthValid ? 'medicine' : 'custom' as 'medicine' | 'custom'
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'as-needed', label: 'As Needed' }
  ]

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setAuthError(null)
      
      let allReminders: ExtendedReminder[] = []
      let customRemindersMapped: ExtendedReminder[] = []

      // Only load custom reminders if authenticated to prevent cache issues
      if (isAuthenticated && !isTokenExpired()) {
        try {
          const customReminders = await customReminderService.getAllReminders()
          customRemindersMapped = customReminders.map((custom: CustomReminder) => ({
            id: custom.id,
            medicineId: 0, // Custom reminders don't have medicine ID
            medicineName: custom.title,
            reminderTime: custom.time,
            frequency: custom.frequency,
            isActive: custom.isActive,
            nextReminder: undefined,
            createdAt: custom.createdAt,
            isCustom: true
          } as ExtendedReminder))
          
          allReminders = [...customRemindersMapped]
        } catch (error) {
          console.error('Error loading custom reminders:', error)
          // Don't use cache fallback to prevent deleted reminders from reappearing
        }
      }
      let medicinesResponse: Medicine[] = []

      // Only load medicine data if authenticated
      if (isAuthenticated && !isTokenExpired()) {
        try {
          medicinesResponse = await medicineApi.getMedicines()
          setMedicines(medicinesResponse)
          
          // Get reminders for each medicine
          const medicineReminders: ExtendedReminder[] = []
          const medicineReminderStatuses = JSON.parse(localStorage.getItem('medicine_reminder_statuses') || '{}')
          
          for (const medicine of medicinesResponse) {
            if (medicine.id) {
              try {
                const medicineRemindersList = await medicineApi.getMedicineReminders(medicine.id)
                
                // Apply locally stored status overrides and ensure medicine name is available
                const remindersWithStatus = medicineRemindersList.map(reminder => ({
                  ...reminder,
                  medicineName: medicine.name, // Ensure the medicine name is available on the reminder
                  isActive: medicineReminderStatuses[reminder.id || 0] !== undefined 
                    ? medicineReminderStatuses[reminder.id || 0] 
                    : reminder.isActive
                }))
                
                medicineReminders.push(...remindersWithStatus)
              } catch (error) {
                console.warn(`Failed to load reminders for medicine ${medicine.id}:`, error)
              }
            }
          }

          allReminders = [...medicineReminders, ...customRemindersMapped]
        } catch (error: any) {
          console.error('Error loading medicine data:', error)
          
          // Check if it's an authentication error
          if (error.message?.includes('Authentication required') || 
              error.message?.includes('Unauthorized') ||
              error.message?.includes('401')) {
            setAuthError('Your session has expired. Please log in again to manage medicine reminders.')
          } else {
            setAuthError('Failed to load medicine data. You can still manage custom reminders.')
          }
          
          // Don't show any reminders if medicine loading fails and we're not authenticated
          allReminders = isAuthenticated ? customRemindersMapped : []
        }
      } else {
        // Not authenticated - don't show any reminders to prevent cache issues
        if (!isAuthenticated) {
          setAuthError('Please log in to manage reminders.')
        }
        allReminders = []
      }

      console.log('📄 Loaded reminders debug:', {
        totalReminders: allReminders.length,
        medicineReminders: allReminders.filter(r => !(r as any).isCustom).length,
        customReminders: customRemindersMapped.length,
        isAuthenticated,
        authError
      })
      
      setReminders(allReminders)
    } catch (error) {
      console.error('Error loading reminders:', error)
      addToast({ title: 'Failed to load some reminders', type: 'error' })
      
      // Don't use fallback to prevent cache issues with deleted reminders
      console.error('Failed to load reminders, not using cache fallback to prevent deleted items from reappearing')
      setReminders([])
    } finally {
      setLoading(false)
    }
  }, [addToast, isAuthenticated, isTokenExpired])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Update form data when authentication status changes
  useEffect(() => {
    if (!showForm && !editingReminder) {
      setFormData(getInitialFormData())
    }
  }, [isAuthenticated, showForm, editingReminder])

  // Force custom reminder when not authenticated (even if form is open)
  useEffect(() => {
    if ((!isAuthenticated || isTokenExpired()) && formData.reminderType === 'medicine') {
      console.log('🔄 Forcing switch to custom reminder due to auth status')
      setFormData(prev => ({ 
        ...prev, 
        reminderType: 'custom',
        medicineId: 0,
        customTitle: prev.customTitle || ''
      }))
    }
  }, [isAuthenticated, formData.reminderType])

  const resetForm = () => {
    setFormData(getInitialFormData())
    setEditingReminder(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 handleSubmit called with:', {
      reminderType: formData.reminderType,
      isAuthenticated,
      isTokenExpired: isTokenExpired(),
      customTitle: formData.customTitle,
      medicineId: formData.medicineId
    })
    
    // AGGRESSIVE SAFETY CHECK: Block ALL medicine reminder attempts when not authenticated
    if (formData.reminderType === 'medicine') {
      if (!isAuthenticated || isTokenExpired()) {
        console.error('🚫 BLOCKED: Attempted to create medicine reminder without authentication')
        addToast({ 
          title: 'You must be logged in to create medicine reminders. Please use custom reminders instead.', 
          type: 'error' 
        })
        // Force switch to custom reminder
        setFormData(prev => ({ ...prev, reminderType: 'custom', customTitle: prev.customTitle || 'Custom Reminder' }))
        return
      }
    }
    
    // Validation based on reminder type
    if (formData.reminderType === 'medicine' && !formData.medicineId) {
      addToast({ title: 'Please select a medicine', type: 'error' })
      return
    }
    
    if (formData.reminderType === 'custom' && !formData.customTitle.trim()) {
      addToast({ title: 'Please enter a reminder title', type: 'error' })
      return
    }
    
    if (!formData.reminderTime) {
      addToast({ title: 'Please set a reminder time', type: 'error' })
      return
    }

    try {
      setFormLoading(true)
      
      if (editingReminder) {
        // Handle editing
        if ((editingReminder as any).isCustom) {
          // Edit custom reminder using the service
          customReminderService.updateReminder(editingReminder.id!, {
            title: formData.customTitle,
            time: formData.reminderTime,
            frequency: formData.frequency,
            isActive: formData.isActive
          })
          addToast({ title: 'Custom reminder updated successfully', type: 'success' })
        } else {
          // For medicine reminders, we'll need to implement updateReminder in the API
          addToast({ title: 'Medicine reminder editing not yet implemented', type: 'warning' })
        }
      } else {
        if (formData.reminderType === 'medicine') {
          try {
            const reminderRequest: ReminderRequest = {
              reminderTime: formData.reminderTime,
              frequency: formData.frequency
            }
            await medicineApi.addReminderToMedicine(formData.medicineId, reminderRequest)
            addToast({ title: 'Medicine reminder created successfully', type: 'success' })
          } catch (error: any) {
            console.error('Medicine reminder creation failed:', error)
            
            if (error.message?.includes('Authentication required') || 
                error.message?.includes('Unauthorized') ||
                error.message?.includes('401')) {
              addToast({ 
                title: 'Session expired - Please log in again to create medicine reminders', 
                type: 'error' 
              })
              setAuthError('Your session has expired. Please log in again.')
            } else {
              addToast({ title: 'Failed to create medicine reminder', type: 'error' })
            }
            return
          }
        } else {
          // Create custom reminder using the service
          customReminderService.createReminder({
            title: formData.customTitle,
            time: formData.reminderTime,
            frequency: formData.frequency,
            isActive: formData.isActive
          })
          
          addToast({ title: 'Custom reminder created successfully', type: 'success' })
        }
      }
      
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving reminder:', error)
      addToast({ title: 'Failed to save reminder', type: 'error' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (reminder: ExtendedReminder) => {
    setEditingReminder(reminder)
    const isCustomReminder = (reminder as any).isCustom
    setFormData({
      medicineId: isCustomReminder ? 0 : reminder.medicineId,
      reminderTime: reminder.reminderTime,
      frequency: reminder.frequency,
      isActive: reminder.isActive,
      customTitle: isCustomReminder ? reminder.medicineName || '' : '',
      reminderType: isCustomReminder ? 'custom' : 'medicine'
    })
    setShowForm(true)
  }



  const handleDelete = async (reminder: ExtendedReminder) => {
    const reminderName = getMedicineName(reminder)
    if (!window.confirm(`Are you sure you want to delete the reminder for "${reminderName}"?`)) {
      return
    }

    try {
      if ((reminder as any).isCustom) {
        // Delete custom reminder using the service
        const success = await customReminderService.deleteReminder(reminder.id!)
        if (success) {
          addToast({ title: 'Custom reminder deleted successfully', type: 'success' })
        } else {
          addToast({ title: 'Custom reminder not found', type: 'error' })
        }
      } else {
        // Check authentication before attempting medicine reminder deletion
        if (!isAuthenticated || isTokenExpired()) {
          addToast({ 
            title: 'Session expired - Please log in again to delete medicine reminders', 
            type: 'error' 
          })
          setAuthError('Your session has expired. Please log in again.')
          return
        }

        // Delete medicine reminder via API
        if (!reminder.id) {
          addToast({ title: 'Error: Reminder ID not found', type: 'error' })
          console.error('Reminder ID is missing:', reminder)
          return
        }
        
        console.log('🗑️ Deleting medicine reminder:', reminder)
        await medicineApi.deleteReminder(reminder.id)
        addToast({ title: 'Medicine reminder deleted successfully', type: 'success' })
      }
      loadData()
    } catch (error) {
      console.error('Error deleting reminder:', error)
      
      // Handle authentication errors specifically
      if (error instanceof Error) {
        if (error.message.includes('Authentication required') || 
            error.message.includes('Unauthorized') ||
            error.message.includes('401')) {
          
          addToast({ 
            title: 'Session expired - Please log in again to delete medicine reminders', 
            type: 'error' 
          })
          setAuthError('Your session has expired. Please log in again.')
          return
        }
      }
      
      // Handle other types of errors
      let errorMessage = 'Failed to delete reminder'
      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          errorMessage = 'Network error - please check your connection'
        } else {
          errorMessage = error.message
        }
      }
      
      addToast({ title: errorMessage, type: 'error' })
    }
  }

  const toggleReminderStatus = async (reminder: ExtendedReminder) => {
    try {
      const newStatus = !reminder.isActive
      
      if ((reminder as any).isCustom) {
        // Toggle custom reminder status using the service
        customReminderService.toggleReminderStatus(reminder.id!)
        
        addToast({ 
          title: `Custom reminder ${newStatus ? 'activated' : 'deactivated'} successfully`, 
          type: 'success' 
        })
      } else {
        // For medicine reminders, store status locally until backend API is updated
        const medicineReminderStatuses = JSON.parse(localStorage.getItem('medicine_reminder_statuses') || '{}')
        medicineReminderStatuses[reminder.id || 0] = newStatus
        localStorage.setItem('medicine_reminder_statuses', JSON.stringify(medicineReminderStatuses))
        
        addToast({ 
          title: `Medicine reminder ${newStatus ? 'activated' : 'deactivated'} successfully`, 
          type: 'success' 
        })
      }
      
      // Reload data to reflect changes
      loadData()
    } catch (error) {
      addToast({ title: 'Failed to toggle reminder status', type: 'error' })
      console.error('Error toggling reminder status:', error)
    }
  }

  const getMedicineName = (reminder: ExtendedReminder) => {
    // If it's a custom reminder, use the medicineName field directly
    if ((reminder as any).isCustom) {
      return reminder.medicineName || 'Custom Reminder'
    }
    
    // For medicine reminders, the medicineName should now be attached during loading
    if (reminder.medicineName && reminder.medicineName !== 'Unknown Medicine') {
      return reminder.medicineName
    }
    
    // Fallback: try to find in loaded medicines array
    const medicine = medicines.find(m => m.id === reminder.medicineId)
    if (medicine?.name) {
      return medicine.name
    }
    
    // Final fallback
    return `Medicine ID: ${reminder.medicineId}`
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" variant="healthcare" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove this after testing */}
      <ReminderFormDebugger />
      
      {/* Login Status Checker */}
      <LoginStatusChecker />
      
      {/* Authentication Helper */}
      <AuthenticationHelper 
        onAuthSuccess={() => {
          setAuthError(null)
          loadData() // Reload data after successful authentication
        }}
        showTokenInfo={true}
      />
      
      {/* Authentication Test Runner */}
      <AuthTestRunner />
      
      {/* Authentication Tester */}
      <AuthenticationTester />
      
      {/* Simple Test Component */}
      <SimpleCustomReminderTest />
      
      {/* Form State Debug */}
      {showForm && (
        <Card className="p-3 mb-4 bg-red-50 border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">🔍 Form State Debug</h4>
          <div className="text-sm space-y-1">
            <div>Current reminderType: <strong>{formData.reminderType}</strong></div>
            <div>Custom Title: <strong>{formData.customTitle || 'Empty'}</strong></div>
            <div>Medicine ID: <strong>{formData.medicineId}</strong></div>
            <div>Should be Custom: <strong>{(!isAuthenticated || isTokenExpired()) ? 'YES' : 'NO'}</strong></div>
          </div>
        </Card>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Medicine Reminders</h2>
          <p className="text-muted-foreground">
            {reminders.filter(r => r.isActive).length} active reminders
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData(getInitialFormData()) // Reset form with proper defaults
            setShowForm(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {/* Session Cleaner - Show when auth errors detected */}
      {authError && <SessionCleaner />}

      {/* Authentication Error Banner */}
      {authError && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">Authentication Notice</p>
              <p className="text-yellow-700 text-sm mt-1">{authError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                onClick={() => window.location.href = '/login'}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reminder Type Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reminder Type *
              </label>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 ${!isAuthenticated || isTokenExpired() ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="reminderType"
                    value="medicine"
                    checked={formData.reminderType === 'medicine'}
                    disabled={!isAuthenticated || isTokenExpired()}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      reminderType: e.target.value as 'medicine' | 'custom',
                      medicineId: 0,
                      customTitle: ''
                    }))}
                    className="text-primary"
                  />
                  <span>Medicine Reminder</span>
                  {(!isAuthenticated || isTokenExpired()) && (
                    <span className="text-xs text-muted-foreground">(Login required)</span>
                  )}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reminderType"
                    value="custom"
                    checked={formData.reminderType === 'custom'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      reminderType: e.target.value as 'medicine' | 'custom',
                      medicineId: 0,
                      customTitle: ''
                    }))}
                    className="text-primary"
                  />
                  <span>Custom Reminder</span>
                </label>
              </div>
              {(!isAuthenticated || isTokenExpired()) && (
                <p className="text-xs text-muted-foreground mt-1">
                  Medicine reminders require authentication. Custom reminders work without login.
                </p>
              )}
            </div>

            {/* Medicine Selection (only for medicine reminders) */}
            {formData.reminderType === 'medicine' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Medicine *
                </label>
                <select
                  value={formData.medicineId}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicineId: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  required
                >
                  <option value={0}>Select a medicine</option>
                  {medicines.map(medicine => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name} - {medicine.dosage}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Title (only for custom reminders) */}
            {formData.reminderType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reminder Title *
                </label>
                <Input
                  type="text"
                  value={formData.customTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, customTitle: e.target.value }))}
                  placeholder="e.g., Take vitamins, Check blood pressure, Exercise"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a custom reminder title (e.g., health checkups, exercise, vitamins)
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Reminder Time *
              </label>
              <Input
                type="time"
                value={formData.reminderTime}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  frequency: e.target.value
                }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                required
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-foreground">
                Active reminder
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={formLoading}
                className="flex-1"
              >
                {formLoading ? 'Saving...' : editingReminder ? 'Update Reminder' : 'Add Reminder'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={formLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No reminders set up yet</p>
          <Button onClick={() => setShowForm(true)}>
            Create Your First Reminder
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-foreground">
                      {getMedicineName(reminder)}
                    </h3>
                    <Badge variant={reminder.isActive ? 'default' : 'secondary'}>
                      {reminder.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {reminder.frequency}
                    </Badge>
                    {(reminder as any).isCustom && (
                      <Badge variant="secondary">
                        Custom
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{formatTime(reminder.reminderTime)}</span>
                    </div>
                    {reminder.nextReminder && (
                      <div>
                        <span className="text-muted-foreground">Next:</span>
                        <span className="ml-1 font-medium">
                          {new Date(reminder.nextReminder).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleReminderStatus(reminder)}
                    className="flex items-center gap-1"
                  >
                    {reminder.isActive ? (
                      <BellOff className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    {reminder.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(reminder)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(reminder)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}