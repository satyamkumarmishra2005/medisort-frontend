import { motion } from 'framer-motion'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/ui/layout'
import { MedicineDashboard } from '../components/MedicineDashboard'
import { MedicineList } from '../components/MedicineList'
import { MedicineForm } from '../components/MedicineForm'
import { MedicineReminders } from '../components/MedicineReminders'
import { Medicine, MedicineRequest, medicineApi } from '../services/medicineApi'
import { useToast } from '../components/ui/toast'
import { useAuth } from '../contexts/AuthContext'


type ViewMode = 'dashboard' | 'list' | 'add' | 'edit' | 'reminders'

const Medicines: React.FC = () => {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard')
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { addToast } = useToast()
  const { isAuthenticated, isTokenExpired, logout, isLoading: authLoading } = useAuth()

  // ✅ NO AUTOMATIC REMINDER CREATION
  // Medicine reminders are now user-controlled only - no automatic defaults based on dosesPerDay
  // Users must manually set reminder times if they want notifications

  const loadMedicineForEdit = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      const medicine = await medicineApi.getMedicine(parseInt(id))
      setEditingMedicine(medicine)
    } catch (error) {
      addToast({ title: 'Failed to load medicine for editing', type: 'error' })
      navigate('/medicines')
    } finally {
      setIsLoading(false)
    }
  }, [navigate, addToast])

  // Check authentication on component mount and token expiration
  useEffect(() => {
    if (!isAuthenticated || isTokenExpired()) {
      addToast({ 
        title: 'Authentication Required', 
        description: 'Please log in to access medicines',
        type: 'error' 
      })
      navigate('/login')
      return
    }
  }, [isAuthenticated, isTokenExpired, navigate, addToast])

  // Listen for auth expiration events from API interceptors
  useEffect(() => {
    const handleAuthExpired = (event: any) => {
      // Don't logout if we're in the middle of creating a medicine
      if (isLoading) {
        console.warn('⚠️ Auth expired during medicine creation - ignoring to prevent logout')
        return
      }
      
      addToast({ 
        title: 'Session Expired', 
        description: 'Your session has expired. Please log in again.',
        type: 'error' 
      })
      logout()
      navigate('/login')
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [logout, navigate, addToast, isLoading])

  // Determine view based on URL
  useEffect(() => {
    // Don't set view if not authenticated
    if (!isAuthenticated || isTokenExpired()) {
      return
    }

    const path = location.pathname
    if (path.includes('/add')) {
      setCurrentView('add')
    } else if (path.includes('/edit') && params.id) {
      setCurrentView('edit')
      loadMedicineForEdit(params.id)
    } else if (path.includes('/reminders')) {
      setCurrentView('reminders')
    } else if (path === '/medicines') {
      setCurrentView('list')
    } else {
      setCurrentView('dashboard')
    }
  }, [location.pathname, params.id, loadMedicineForEdit, isAuthenticated, isTokenExpired])

  const handleAddMedicine = () => {
    navigate('/medicines/add')
  }

  const handleEditMedicine = (medicine: Medicine) => {
    navigate(`/medicines/edit/${medicine.id}`)
  }

  const handleFormSubmit = async (medicineData: MedicineRequest) => {
    try {
      setIsLoading(true)
      
      if (editingMedicine) {
        // Update existing medicine
        await medicineApi.updateMedicine(editingMedicine.id!, medicineData)
        addToast({ title: 'Medicine updated successfully', type: 'success' })
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('medicine-updated'))
      } else {
        // Create new medicine
        const createdMedicine = await medicineApi.createMedicine(medicineData)
        
        // ✅ Clean up any automatic reminders created by backend
        if (createdMedicine.id) {
          try {
            console.log('🧹 Checking for automatic reminders created by backend...')
            const automaticReminders = await medicineApi.getMedicineReminders(createdMedicine.id)
            
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
              addToast({ 
                title: 'Medicine added successfully', 
                description: 'Automatic reminders were removed. Set custom times in the Reminders section if needed.',
                type: 'success' 
              })
            } else {
              console.log('✅ No automatic reminders found - backend behaved correctly')
              addToast({ 
                title: 'Medicine added successfully', 
                description: 'Set custom reminder times in the Reminders section if needed',
                type: 'success' 
              })
            }
          } catch (reminderError) {
            console.error('⚠️ Error cleaning up automatic reminders:', reminderError)
            // Don't fail the whole operation, just warn the user
            addToast({ 
              title: 'Medicine added successfully', 
              description: 'Note: Some automatic reminders may have been created. You can manage them in the Reminders section.',
              type: 'warning' 
            })
          }
        } else {
          addToast({ title: 'Medicine added successfully', type: 'success' })
        }
        
        // Dispatch event to notify other components
        console.log('🚀 Dispatching medicine-added event')
        window.dispatchEvent(new CustomEvent('medicine-added'))
      }
      
      navigate('/medicines')
      setEditingMedicine(null)
    } catch (error) {
      addToast({ title: 'Failed to save medicine', type: 'error' })
      console.error('Error saving medicine:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormCancel = () => {
    setEditingMedicine(null)
    navigate('/medicines')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <MedicineDashboard
            onAddMedicine={handleAddMedicine}
            onViewMedicines={() => navigate('/medicines')}
            onViewReminders={() => navigate('/medicines/reminders')}
          />
        )
      
      case 'list':
        return (
          <MedicineList
            onEdit={handleEditMedicine}
            onAdd={handleAddMedicine}
          />
        )
      
      case 'add':
      case 'edit':
        return (
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-purple-900 to-indigo-900 p-8 text-white shadow-2xl border border-slate-700/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-3">
                  {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                </h2>
                <p className="text-slate-200 text-lg">
                  {editingMedicine ? 'Update medicine information' : 'Add a new medicine to your collection'}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <MedicineForm
                medicine={editingMedicine || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isLoading={isLoading}
              />
            </motion.div>
          </div>
        )
      
      case 'reminders':
        return <MedicineReminders />
      
      default:
        return null
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated || isTokenExpired()) {
    return null
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 p-6"
        >
          {/* Enhanced Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 bg-black/60 text-gray-300 hover:bg-gray-900/80 hover:text-white border border-gray-700/50 hover:border-gray-600 backdrop-blur-sm shadow-lg hover:shadow-xl"
            >
              Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/medicines')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${
                currentView === 'list'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border border-blue-400/50'
                  : 'bg-black/60 text-gray-300 hover:bg-gray-900/80 hover:text-white border border-gray-700/50 hover:border-gray-600 backdrop-blur-sm'
              }`}
            >
              Medicine List
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/medicines/reminders')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${
                currentView === 'reminders'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border border-blue-400/50'
                  : 'bg-black/60 text-gray-300 hover:bg-gray-900/80 hover:text-white border border-gray-700/50 hover:border-gray-600 backdrop-blur-sm'
              }`}
            >
              Reminders
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {renderCurrentView()}
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Medicines