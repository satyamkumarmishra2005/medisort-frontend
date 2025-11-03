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
    <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 via-slate-900/30 to-slate-800/20 overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="relative p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Enhanced Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <div className="w-6 h-6 text-white flex items-center justify-center text-lg">ℹ️</div>
              </div>
              <h3 className="text-xl font-bold text-white">Basic Information</h3>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Medicine Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter medicine name"
                className={`bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.name ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.name}
              </p>}
            </div>

            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-slate-300 mb-2">
                Dosage *
              </label>
              <Input
                id="dosage"
                type="text"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                placeholder="e.g., 500mg, 1 tablet, 5ml"
                className={`bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.dosage ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.dosage && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.dosage}
              </p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-slate-800/60 text-white focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.category ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Select category</option>
                {MEDICINE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.category}
              </p>}
            </div>

            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-slate-300 mb-2">
                Manufacturer
              </label>
              <Input
                id="manufacturer"
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="Medicine manufacturer"
                className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Treatment Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <div className="w-6 h-6 text-white flex items-center justify-center text-lg">🏥</div>
            </div>
            <h3 className="text-xl font-bold text-white">Treatment Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">
                Start Date *
              </label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`bg-slate-800/60 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.startDate ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.startDate && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.startDate}
              </p>}
            </div>

            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-slate-300 mb-2">
                Duration (Days) *
              </label>
              <Input
                id="durationDays"
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => handleInputChange('durationDays', parseInt(e.target.value) || 0)}
                className={`bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.durationDays ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.durationDays && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.durationDays}
              </p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalQuantity" className="block text-sm font-medium text-slate-300 mb-2">
                Total Quantity *
              </label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                value={formData.totalQuantity}
                onChange={(e) => handleInputChange('totalQuantity', parseInt(e.target.value) || 0)}
                placeholder="Total pills/bottles"
                className={`bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.totalQuantity ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.totalQuantity && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.totalQuantity}
              </p>}
            </div>

            <div>
              <label htmlFor="currentStock" className="block text-sm font-medium text-slate-300 mb-2">
                Current Stock *
              </label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                placeholder="Current pills/bottles"
                className={`bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.currentStock ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.currentStock && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.currentStock}
              </p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-slate-300 mb-2">
                Frequency *
              </label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-slate-800/60 text-white focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.frequency ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Select frequency</option>
                {FREQUENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.frequency && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.frequency}
              </p>}
            </div>

            <div>
              <label htmlFor="dosesPerDay" className="block text-sm font-medium text-slate-300 mb-2">
                Doses Per Day *
              </label>
              <Input
                id="dosesPerDay"
                type="number"
                min="1"
                value={formData.dosesPerDay}
                onChange={(e) => handleInputChange('dosesPerDay', parseInt(e.target.value) || 0)}
                placeholder="Number of doses per day"
                className={`bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                  errors.dosesPerDay ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.dosesPerDay && <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.dosesPerDay}
              </p>}
            </div>
          </div>

          {/* Enhanced Expected End Date Display */}
          {formData.totalQuantity > 0 && formData.dosesPerDay > 0 && formData.startDate && (
            <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 p-6 rounded-xl border border-slate-600/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <div className="w-5 h-5 text-white flex items-center justify-center text-sm">📅</div>
                </div>
                <h4 className="text-lg font-semibold text-white">Expected End Date</h4>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {(() => {
                  const start = new Date(formData.startDate)
                  const daysToFinish = Math.floor(formData.currentStock / formData.dosesPerDay)
                  const endDate = new Date(start.getTime() + daysToFinish * 24 * 60 * 60 * 1000)
                  return endDate.toLocaleDateString()
                })()} 
              </p>
              <p className="text-slate-300 mt-2">
                📊 {Math.floor(formData.currentStock / formData.dosesPerDay)} days remaining
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Options */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
              <div className="w-6 h-6 text-white flex items-center justify-center text-lg">⚙️</div>
            </div>
            <h3 className="text-xl font-bold text-white">Options</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl border border-slate-600/50 backdrop-blur-sm">
              <input
                type="checkbox"
                id="longTerm"
                checked={formData.longTerm}
                onChange={(e) => handleInputChange('longTerm', e.target.checked)}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500/20"
              />
              <label htmlFor="longTerm" className="text-white font-medium">
                🔄 Long-term medication
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl border border-slate-600/50 backdrop-blur-sm">
              <input
                type="checkbox"
                id="alertBeforeFinish"
                checked={formData.alertBeforeFinish}
                onChange={(e) => handleInputChange('alertBeforeFinish', e.target.checked)}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500/20"
              />
              <label htmlFor="alertBeforeFinish" className="text-white font-medium">
                🔔 Alert before medication finishes
              </label>
            </div>
          </div>
        </div>

        {/* Enhanced Notes */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <div className="w-6 h-6 text-white flex items-center justify-center text-lg">📝</div>
            </div>
            <h3 className="text-xl font-bold text-white">Notes</h3>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Special instructions, side effects, or other important notes"
              rows={4}
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800/60 text-white placeholder-slate-400 resize-none focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 text-lg font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{medicine ? '✏️ Update Medicine' : '➕ Add Medicine'}</span>
              </div>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-slate-800/60 backdrop-blur-sm border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-all duration-200 px-8"
          >
            Cancel
          </Button>
        </div>
        </form>
      </div>
    </Card>
  )
}
