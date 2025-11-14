import React, { useState, useEffect } from 'react'
import { Medicine, MedicineRequest } from '../services/medicineApi'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'

interface MedicineFormProps {
  medicine?: Medicine
  onSubmit: (medicine: MedicineRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const MEDICINE_CATEGORIES = [
  'Prescription',
  'Over-the-Counter',
  'Supplement',
  'Vitamin',
  'Antibiotic',
  'Pain Relief',
  'Allergy',
  'Other'
]

const FREQUENCY_OPTIONS = [
  { value: 'OD', label: 'Once Daily (OD)' },
  { value: 'BD', label: 'Twice Daily (BD)' },
  { value: 'TDS', label: 'Three Times Daily (TDS)' },
  { value: 'QID', label: 'Four Times Daily (QID)' },
  { value: 'Q4H', label: 'Every 4 hours' },
  { value: 'Q6H', label: 'Every 6 hours' },
  { value: 'Q8H', label: 'Every 8 hours' },
  { value: 'Q12H', label: 'Every 12 hours' },
  { value: 'PRN', label: 'As needed (PRN)' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' }
]

export const MedicineForm: React.FC<MedicineFormProps> = ({
  medicine,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    category: '',
    manufacturer: '',
    notes: '',
    startDate: '',
    durationDays: 0,
    totalQuantity: 0,
    dosesPerDay: 0,
    currentStock: 0,
    frequency: '',
    longTerm: false,
    alertBeforeFinish: false,
    reminderTimes: [] as string[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || '',
        dosage: medicine.dosage || '',
        category: medicine.category || '',
        manufacturer: medicine.manufacturer || '',
        notes: medicine.notes || '',
        startDate: medicine.startDate || '',
        durationDays: medicine.durationDays || 0,
        totalQuantity: medicine.totalQuantity || 0,
        dosesPerDay: medicine.dosesPerDay || 0,
        currentStock: medicine.currentStock || medicine.totalQuantity || 0,
        frequency: medicine.frequency || '',
        longTerm: medicine.longTerm || false,
        alertBeforeFinish: medicine.alertBeforeFinish || false,
        reminderTimes: []
      })
    } else {
      // Set default start date to today for new medicines
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, startDate: today }))
    }
  }, [medicine])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required'
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Dosage is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    } else {
      const startDate = new Date(formData.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past'
      }
    }

    if (formData.durationDays <= 0) {
      newErrors.durationDays = 'Duration must be greater than 0'
    }

    if (formData.totalQuantity <= 0) {
      newErrors.totalQuantity = 'Total quantity must be greater than 0'
    }

    if (formData.currentStock < 0) {
      newErrors.currentStock = 'Current stock cannot be negative'
    }

    if (formData.currentStock > formData.totalQuantity) {
      newErrors.currentStock = 'Current stock cannot exceed total quantity'
    }

    if (formData.dosesPerDay <= 0) {
      newErrors.dosesPerDay = 'Doses per day must be greater than 0'
    }

    if (!formData.frequency) {
      newErrors.frequency = 'Frequency is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // ✅ Remove reminderTimes from submission to prevent automatic reminder creation
      const { reminderTimes, ...medicineDataWithoutReminders } = formData
      await onSubmit(medicineDataWithoutReminders)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Medicine Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter medicine name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-foreground mb-1">
                Dosage *
              </label>
              <Input
                id="dosage"
                type="text"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                placeholder="e.g., 500mg, 1 tablet, 5ml"
                className={errors.dosage ? 'border-red-500' : ''}
              />
              {errors.dosage && <p className="text-red-500 text-sm mt-1">{errors.dosage}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                  errors.category ? 'border-red-500' : 'border-border'
                }`}
              >
                <option value="">Select category</option>
                {MEDICINE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-foreground mb-1">
                Manufacturer
              </label>
              <Input
                id="manufacturer"
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="Medicine manufacturer"
              />
            </div>
          </div>
        </div>

        {/* Treatment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Treatment Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
                Start Date *
              </label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-foreground mb-1">
                Duration (Days) *
              </label>
              <Input
                id="durationDays"
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => handleInputChange('durationDays', parseInt(e.target.value) || 0)}
                className={errors.durationDays ? 'border-red-500' : ''}
              />
              {errors.durationDays && <p className="text-red-500 text-sm mt-1">{errors.durationDays}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalQuantity" className="block text-sm font-medium text-foreground mb-1">
                Total Quantity *
              </label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                value={formData.totalQuantity}
                onChange={(e) => handleInputChange('totalQuantity', parseInt(e.target.value) || 0)}
                placeholder="Total pills/bottles"
                className={errors.totalQuantity ? 'border-red-500' : ''}
              />
              {errors.totalQuantity && <p className="text-red-500 text-sm mt-1">{errors.totalQuantity}</p>}
            </div>

            <div>
              <label htmlFor="currentStock" className="block text-sm font-medium text-foreground mb-1">
                Current Stock *
              </label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                placeholder="Current pills/bottles"
                className={errors.currentStock ? 'border-red-500' : ''}
              />
              {errors.currentStock && <p className="text-red-500 text-sm mt-1">{errors.currentStock}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-foreground mb-1">
                Frequency *
              </label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                  errors.frequency ? 'border-red-500' : 'border-border'
                }`}
              >
                <option value="">Select frequency</option>
                {FREQUENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.frequency && <p className="text-red-500 text-sm mt-1">{errors.frequency}</p>}
            </div>

            <div>
              <label htmlFor="dosesPerDay" className="block text-sm font-medium text-foreground mb-1">
                Doses Per Day *
              </label>
              <Input
                id="dosesPerDay"
                type="number"
                min="1"
                value={formData.dosesPerDay}
                onChange={(e) => handleInputChange('dosesPerDay', parseInt(e.target.value) || 0)}
                placeholder="Number of doses per day"
                className={errors.dosesPerDay ? 'border-red-500' : ''}
              />
              {errors.dosesPerDay && <p className="text-red-500 text-sm mt-1">{errors.dosesPerDay}</p>}
            </div>
          </div>

          {/* Expected End Date Display */}
          {formData.totalQuantity > 0 && formData.dosesPerDay > 0 && formData.startDate && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">Expected End Date</h4>
              <p className="text-lg font-semibold text-primary">
                {(() => {
                  const start = new Date(formData.startDate)
                  const daysToFinish = Math.floor(formData.currentStock / formData.dosesPerDay)
                  const endDate = new Date(start.getTime() + daysToFinish * 24 * 60 * 60 * 1000)
                  return endDate.toLocaleDateString()
                })()} 
                <span className="text-sm text-muted-foreground ml-2">
                  ({Math.floor(formData.currentStock / formData.dosesPerDay)} days remaining)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="longTerm"
                checked={formData.longTerm}
                onChange={(e) => handleInputChange('longTerm', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="longTerm" className="text-sm text-foreground">
                Long-term medication
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="alertBeforeFinish"
                checked={formData.alertBeforeFinish}
                onChange={(e) => handleInputChange('alertBeforeFinish', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="alertBeforeFinish" className="text-sm text-foreground">
                Alert before medication finishes
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Notes</h3>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Special instructions, side effects, or other important notes"
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : medicine ? 'Update Medicine' : 'Add Medicine'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
