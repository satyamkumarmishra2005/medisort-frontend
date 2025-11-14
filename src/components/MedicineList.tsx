import React, { useState, useEffect, useCallback } from 'react'
import { Medicine, medicineApi } from '../services/medicineApi'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { LoadingSpinner } from './ui/loading'
import { useToast } from './ui/toast'
import { RefillModal } from './RefillModal'
import { CustomReminderModal, CustomReminder } from './CustomReminderModal'
import { Trash2, Edit, Search, Filter, Plus, Package, AlertTriangle, Clock, Bell } from 'lucide-react'

interface MedicineListProps {
  onEdit: (medicine: Medicine) => void
  onAdd: () => void
}

export const MedicineList: React.FC<MedicineListProps> = ({ onEdit, onAdd }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [refillModal, setRefillModal] = useState<{ isOpen: boolean; medicine: Medicine | null }>({   
    isOpen: false,
    medicine: null
  })
  const [refillLoading, setRefillLoading] = useState(false)
  const [customReminderModal, setCustomReminderModal] = useState<{ 
    isOpen: boolean; 
    medicine: Medicine | null 
  }>({
    isOpen: false,
    medicine: null
  })
  const [reminderLoading, setReminderLoading] = useState(false)

  const { addToast } = useToast()

  const itemsPerPage = 10

  const categories = [
    'All Categories',
    'Prescription',
    'Over-the-Counter',
    'Supplement',
    'Vitamin',
    'Antibiotic',
    'Pain Relief',
    'Allergy',
    'Other'
  ]

  const loadMedicines = useCallback(async () => {
    try {
      setLoading(true)
      let medicines: Medicine[] = []

      if (searchTerm) {
        medicines = await medicineApi.searchMedicines(searchTerm)
      } else if (selectedCategory && selectedCategory !== 'All Categories') {
        medicines = await medicineApi.getMedicinesByCategory(selectedCategory)
      } else {
        medicines = await medicineApi.getMedicines()
      }

      setMedicines(medicines)
      setTotal(medicines.length)
      setTotalPages(Math.ceil(medicines.length / itemsPerPage))
    } catch (error) {
      addToast({ title: 'Failed to load medicines', type: 'error' })
      console.error('Error loading medicines:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCategory, addToast])

  useEffect(() => {
    loadMedicines()
  }, [loadMedicines])

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      setDeleteLoading(id.toString())
      await medicineApi.deleteMedicine(id)
      addToast({ title: 'Medicine deleted successfully', type: 'success' })
      loadMedicines()
    } catch (error) {
      addToast({ title: 'Failed to delete medicine', type: 'error' })
      console.error('Error deleting medicine:', error)
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const isExpiringSoon = (medicine: Medicine) => {
    const startDate = new Date(medicine.startDate)
    const endDate = new Date(startDate.getTime() + medicine.durationDays * 24 * 60 * 60 * 1000)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return endDate <= thirtyDaysFromNow && endDate >= today
  }

  const isExpired = (medicine: Medicine) => {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
    
    // If we have stock data, use stock-based calculation
    if (currentStock > 0) {
      return stockBasedDays <= 0
    }
    
    // Fallback to date-based calculation if no stock data
    const startDate = new Date(medicine.startDate)
    const endDate = new Date(startDate.getTime() + medicine.durationDays * 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate < today
  }

  const getEndDate = (medicine: Medicine) => {
    const startDate = new Date(medicine.startDate)
    return new Date(startDate.getTime() + medicine.durationDays * 24 * 60 * 60 * 1000)
  }

  const getExpectedEndDate = (medicine: Medicine) => {
    if (medicine.expectedEndDate) {
      return new Date(medicine.expectedEndDate)
    }
    // Calculate based on current stock and doses per day
    const startDate = new Date(medicine.startDate)
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const daysRemaining = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
    return new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
  }

  const getDaysRemaining = (medicine: Medicine) => {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    return medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
  }

  const isLowStock = (medicine: Medicine) => {
    const daysRemaining = getDaysRemaining(medicine)
    return daysRemaining <= 7 && daysRemaining > 0
  }

  const isCriticalStock = (medicine: Medicine) => {
    const daysRemaining = getDaysRemaining(medicine)
    return daysRemaining <= 3 && daysRemaining > 0
  }

  const isOutOfStock = (medicine: Medicine) => {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    return currentStock <= 0
  }

  const handleRefill = async (medicine: Medicine) => {
    setRefillModal({ isOpen: true, medicine })
  }

  const handleRefillSubmit = async (quantity: number) => {
    if (!refillModal.medicine?.id) return

    try {
      setRefillLoading(true)
      const updatedMedicine = await medicineApi.refillMedicine(refillModal.medicine.id, quantity)
      
      // Update the medicine in the list
      setMedicines(prev => prev.map(med => 
        med.id === updatedMedicine.id ? updatedMedicine : med
      ))
      
      addToast({
        title: 'Medicine Refilled Successfully',
        description: `${refillModal.medicine.name} stock updated with ${quantity} units`,
        type: 'success'
      })
      
      setRefillModal({ isOpen: false, medicine: null })
    } catch (error) {
      addToast({
        title: 'Refill Failed',
        description: 'Failed to update medicine stock. Please try again.',
        type: 'error'
      })
    } finally {
      setRefillLoading(false)
    }
  }

  const handleCustomReminder = (medicine: Medicine) => {
    setCustomReminderModal({ isOpen: true, medicine })
  }

  const handleCustomReminderSubmit = async (reminders: CustomReminder[]) => {
    if (!customReminderModal.medicine?.id) return

    try {
      setReminderLoading(true)
      
      // Add custom reminder times to the medicine
      for (const reminder of reminders) {
        if (reminder.isActive) {
          await medicineApi.addRefillReminder(
            customReminderModal.medicine.id,
            new Date().toISOString().split('T')[0], // today
            [reminder.time],
            0 // custom reminder, not related to end date
          )
        }
      }
      
      addToast({
        title: 'Custom Reminder Added',
        description: `Custom reminder times added for ${customReminderModal.medicine.name}`,
        type: 'success'
      })
      
      setCustomReminderModal({ isOpen: false, medicine: null })
    } catch (error) {
      addToast({
        title: 'Failed to Add Reminder',
        description: 'Unable to add custom reminder. Please try again.',
        type: 'error'
      })
    } finally {
      setReminderLoading(false)
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Medicines</h2>
          <p className="text-muted-foreground">{total} medicines total</p>
        </div>
        <Button onClick={onAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Medicine
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Medicine List */}
      {medicines.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No medicines found</p>
          <Button onClick={onAdd} className="mt-4">
            Add Your First Medicine
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {medicines.map((medicine) => (
            <Card key={medicine.id} className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-foreground">{medicine.name}</h3>
                    <Badge variant="secondary">{medicine.category}</Badge>
                    {medicine.frequency && (
                      <Badge variant="outline">{medicine.frequency}</Badge>
                    )}
                    {medicine.longTerm && (
                      <Badge variant="outline">Long-term</Badge>
                    )}
                    {isOutOfStock(medicine) && (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                    {isCriticalStock(medicine) && (
                      <Badge variant="destructive">Critical Stock</Badge>
                    )}
                    {isLowStock(medicine) && !isCriticalStock(medicine) && (
                      <Badge variant="warning">Low Stock</Badge>
                    )}
                    {isExpired(medicine) && (
                      <Badge variant="destructive">Finished</Badge>
                    )}
                    {!isExpired(medicine) && isExpiringSoon(medicine) && (
                      <Badge variant="warning">Finishing Soon</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dosage:</span>
                      <span className="ml-1 font-medium">{medicine.dosage}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Stock:</span>
                      <span className={`ml-1 font-medium ${
                        isOutOfStock(medicine) ? 'text-red-600' :
                        isCriticalStock(medicine) ? 'text-red-500' :
                        isLowStock(medicine) ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {medicine.currentStock || medicine.totalQuantity || 0} units
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Days Remaining:</span>
                      <span className={`ml-1 font-medium ${
                        getDaysRemaining(medicine) <= 3 ? 'text-red-500' :
                        getDaysRemaining(medicine) <= 7 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {getDaysRemaining(medicine)} days
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="ml-1 font-medium">
                        {medicine.frequency || `${medicine.dosesPerDay}/day`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Expected End:</span>
                      <span className="ml-1 font-medium">
                        {getExpectedEndDate(medicine).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Quantity:</span>
                      <span className="ml-1 font-medium">{medicine.totalQuantity}</span>
                    </div>
                  </div>

                  {medicine.manufacturer && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Manufacturer:</span>
                      <span className="ml-1 font-medium">{medicine.manufacturer}</span>
                    </div>
                  )}

                  {medicine.notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-1 text-foreground">{medicine.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Stock Alert and Refill Button */}
                  {(isLowStock(medicine) || isCriticalStock(medicine) || isOutOfStock(medicine)) && (
                    <Button
                      variant={isOutOfStock(medicine) ? "destructive" : "healthcare"}
                      size="sm"
                      onClick={() => handleRefill(medicine)}
                      className="flex items-center gap-1"
                    >
                      <Package className="w-4 h-4" />
                      {isOutOfStock(medicine) ? 'Out of Stock - Refill' : 'Low Stock - Refill'}
                    </Button>
                  )}
                  
                  {/* Regular refill button for medicines with adequate stock */}
                  {!isOutOfStock(medicine) && !isLowStock(medicine) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefill(medicine)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Package className="w-4 h-4" />
                      Refill
                    </Button>
                  )}

                  {/* Custom Reminder Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCustomReminder(medicine)}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  >
                    <Bell className="w-4 h-4" />
                    Reminder
                  </Button>

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(medicine)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  
                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => medicine.id && handleDelete(medicine.id, medicine.name)}
                    disabled={deleteLoading === medicine.id?.toString()}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteLoading === medicine.id?.toString() ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Refill Modal */}
      {refillModal.medicine && (
        <RefillModal
          isOpen={refillModal.isOpen}
          onClose={() => setRefillModal({ isOpen: false, medicine: null })}
          medicine={refillModal.medicine}
          onRefill={handleRefillSubmit}
          isLoading={refillLoading}
        />
      )}

      {/* Custom Reminder Modal */}
      {customReminderModal.medicine && (
        <CustomReminderModal
          isOpen={customReminderModal.isOpen}
          onClose={() => setCustomReminderModal({ isOpen: false, medicine: null })}
          medicine={customReminderModal.medicine}
          onAddReminder={handleCustomReminderSubmit}
          isLoading={reminderLoading}
        />
      )}
    </div>
  )
}