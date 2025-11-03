import React, { useState, useEffect, useCallback } from 'react'
import { Medicine, MedicineRequest, ExtractedMedicineData } from '../services/medicineApi'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { ReminderTimeManager } from './ReminderTimeManager'
import { Sparkles, Edit3, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'

interface EnhancedMedicineFormProps {
  medicine?: Medicine
  extractedData?: ExtractedMedicineData | null
  onSubmit: (medicine: MedicineRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  showAutoFillIndicators?: boolean
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

export const EnhancedMedicineForm: React.FC<EnhancedMedicineFormProps> = ({
  medicine,
  extractedData,
  onSubmit,
  onCancel,
  isLoading = false,
  showAutoFillIndicators = true
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
    longTerm: false,
    alertBeforeFinish: false,
    reminderTimes: [] as string[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())
  const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set())

  // Initialize form with extracted data or existing medicine
  useEffect(() => {
    if (extractedData) {
      const newAutoFilledFields = new Set<string>()
      const newFormData = { ...formData }

      // Auto-fill from OCR data
      if (extractedData.name?.trim()) {
        newFormData.name = extractedData.name
        newAutoFilledFields.add('name')
      }
      if (extractedData.dosage?.trim()) {
        newFormData.dosage = extractedData.dosage
        newAutoFilledFields.add('dosage')
      }
      if (extractedData.category?.trim()) {
        newFormData.category = extractedData.category
        newAutoFilledFields.add('category')
      }
      if (extractedData.manufacturer?.trim()) {
        newFormData.manufacturer = extractedData.manufacturer
        newAutoFilledFields.add('manufacturer')
      }
      if (extractedData.instructions?.trim()) {
        newFormData.notes = extractedData.instructions
        newAutoFilledFields.add('notes')
      }
      if (extractedData.dosesPerDay > 0) {
        newFormData.dosesPerDay = extractedData.dosesPerDay
        newAutoFilledFields.add('dosesPerDay')
      }
      if (extractedData.durationDays > 0) {
        newFormData.durationDays = extractedData.durationDays
        newAutoFilledFields.add('durationDays')
      }
      if (extractedData.reminderTimes?.length > 0) {
        newFormData.reminderTimes = extractedData.reminderTimes
        newAutoFilledFields.add('reminderTimes')
      }

      // Set default start date to today if not provided
      if (!newFormData.startDate) {
        newFormData.startDate = new Date().toISOString().split('T')[0]
      }

      // Calculate total quantity if not provided (estimate based on duration and doses)
      if (!newFormData.totalQuantity && newFormData.durationDays > 0 && newFormData.dosesPerDay > 0) {
        newFormData.totalQuantity = newFormData.durationDays * newFormData.dosesPerDay
      }

      setFormData(newFormData)
      setAutoFilledFields(newAutoFilledFields)
    } else if (medicine) {
      // Load existing medicine data
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
        longTerm: medicine.longTerm || false,
        alertBeforeFinish: medicine.alertBeforeFinish || false,
        reminderTimes: []
      })
      setAutoFilledFields(new Set())
      setManuallyEditedFields(new Set())
    }
  }, [extractedData, medicine, formData])

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

    if (formData.dosesPerDay <= 0) {
      newErrors.dosesPerDay = 'Doses per day must be greater than 0'
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
      // Reminder times should only be set manually by users in the Reminders section
      const { reminderTimes, ...medicineDataWithoutReminders } = formData
      await onSubmit(medicineDataWithoutReminders)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleInputChange = useCallback((field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Mark field as manually edited if it was auto-filled
    if (autoFilledFields.has(field)) {
      setManuallyEditedFields(prev => new Set(prev).add(field))
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [autoFilledFields, errors])

  const handleReminderTimesChange = useCallback((times: string[]) => {
    handleInputChange('reminderTimes', times)
  }, [handleInputChange])

  const isFieldAutoFilled = (field: string): boolean => {
    return showAutoFillIndicators && autoFilledFields.has(field) && !manuallyEditedFields.has(field)
  }

  const isFieldManuallyEdited = (field: string): boolean => {
    return showAutoFillIndicators && manuallyEditedFields.has(field)
  }

  const getFieldClassName = (field: string, baseClassName: string = ''): string => {
    return cn(
      baseClassName,
      isFieldAutoFilled(field) && 'border-healthcare-blue bg-healthcare-blue/5',
      isFieldManuallyEdited(field) && 'border-healthcare-green bg-healthcare-green/5',
      errors[field] && 'border-red-500'
    )
  }

  const renderFieldIndicator = (field: string) => {
    if (!showAutoFillIndicators) return null

    if (isFieldAutoFilled(field)) {
      return (
        <Badge variant="default" className="ml-2 bg-healthcare-blue/10 text-healthcare-blue text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          Auto-filled
        </Badge>
      )
    }

    if (isFieldManuallyEdited(field)) {
      return (
        <Badge variant="default" className="ml-2 bg-healthcare-green/10 text-healthcare-green text-xs">
          <Edit3 className="w-3 h-3 mr-1" />
          Edited
        </Badge>
      )
    }

    return null
  }

  const confidence = extractedData?.confidence ? Math.round(extractedData.confidence * 100) : 0

  return (
    <Card className="p-6">
      {/* OCR Confidence Header */}
      {extractedData && showAutoFillIndicators && (
        <div className={cn(
          'mb-6 p-4 rounded-lg border',
          confidence >= 85 && 'border-green-200 bg-green-50/50',
          confidence >= 70 && confidence < 85 && 'border-yellow-200 bg-yellow-50/50',
          confidence < 70 && 'border-red-200 bg-red-50/50'
        )}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">OCR Auto-Fill Applied</h3>
            <span className={cn(
              'text-sm font-bold',
              confidence >= 85 && 'text-green-600',
              confidence >= 70 && confidence < 85 && 'text-yellow-600',
              confidence < 70 && 'text-red-600'
            )}>
              {confidence}% confidence
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Fields marked with <Sparkles className="w-3 h-3 inline mx-1" /> were auto-filled from your prescription. 
            Review and edit as needed.
          </p>
          {confidence < 70 && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3" />
              Low confidence - please review all fields carefully
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Medicine Name *
                {renderFieldIndicator('name')}
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter medicine name"
                className={getFieldClassName('name')}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Dosage *
                {renderFieldIndicator('dosage')}
              </label>
              <Input
                id="dosage"
                type="text"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                placeholder="e.g., 500mg, 1 tablet, 5ml"
                className={getFieldClassName('dosage')}
              />
              {errors.dosage && <p className="text-red-500 text-sm mt-1">{errors.dosage}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Category *
                {renderFieldIndicator('category')}
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={getFieldClassName('category', 'w-full px-3 py-2 border rounded-md bg-background text-foreground')}
              >
                <option value="">Select category</option>
                {MEDICINE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Manufacturer
                {renderFieldIndicator('manufacturer')}
              </label>
              <Input
                id="manufacturer"
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="Medicine manufacturer"
                className={getFieldClassName('manufacturer')}
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
                className={getFieldClassName('startDate')}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Duration (Days) *
                {renderFieldIndicator('durationDays')}
              </label>
              <Input
                id="durationDays"
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => handleInputChange('durationDays', parseInt(e.target.value) || 0)}
                className={getFieldClassName('durationDays')}
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
                className={getFieldClassName('totalQuantity')}
              />
              {errors.totalQuantity && <p className="text-red-500 text-sm mt-1">{errors.totalQuantity}</p>}
            </div>

            <div>
              <label htmlFor="dosesPerDay" className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Doses Per Day *
                {renderFieldIndicator('dosesPerDay')}
              </label>
              <Input
                id="dosesPerDay"
                type="number"
                min="1"
                value={formData.dosesPerDay}
                onChange={(e) => handleInputChange('dosesPerDay', parseInt(e.target.value) || 0)}
                className={getFieldClassName('dosesPerDay')}
              />
              {errors.dosesPerDay && <p className="text-red-500 text-sm mt-1">{errors.dosesPerDay}</p>}
            </div>
          </div>
        </div>

        {/* Reminder Times */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            Reminder Times
            {renderFieldIndicator('reminderTimes')}
          </h3>
          
          <ReminderTimeManager
            reminderTimes={formData.reminderTimes}
            dosesPerDay={formData.dosesPerDay}
            onChange={handleReminderTimesChange}
            autoFilled={isFieldAutoFilled('reminderTimes')}
          />
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
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            Notes
            {renderFieldIndicator('notes')}
          </h3>
          
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
              className={getFieldClassName('notes', 'w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none')}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
            variant="healthcare"
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