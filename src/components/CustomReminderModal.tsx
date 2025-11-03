import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Clock, Calendar, Bell, Trash2, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Medicine } from '../services/medicineApi'

export interface CustomReminder {
  id?: number
  time: string
  label?: string
  isActive: boolean
  daysOfWeek?: number[] // 0-6, Sunday to Saturday
  isRecurring: boolean
}

interface CustomReminderModalProps {
  isOpen: boolean
  onClose: () => void
  medicine: Medicine
  onAddReminder: (reminders: CustomReminder[]) => Promise<void>
  existingReminders?: (CustomReminder | string)[]
  isLoading?: boolean
}

export const CustomReminderModal: React.FC<CustomReminderModalProps> = ({
  isOpen,
  onClose,
  medicine,
  onAddReminder,
  existingReminders = [],
  isLoading = false
}) => {
  const [reminders, setReminders] = useState<CustomReminder[]>([
    { time: '09:00', isActive: true, isRecurring: true, daysOfWeek: [1, 2, 3, 4, 5] }
  ])
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setReminders([
        { time: '09:00', isActive: true, isRecurring: true, daysOfWeek: [1, 2, 3, 4, 5] }
      ])
      setError('')
      setActiveTab('simple')
      setShowPreview(false)
    }
  }, [isOpen])

  const handleAddReminder = () => {
    setReminders(prev => [...prev, {
      time: '09:00',
      isActive: true,
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5]
    }])
  }

  const handleRemoveReminder = (index: number) => {
    if (reminders.length > 1) {
      setReminders(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleReminderChange = (index: number, field: keyof CustomReminder, value: any) => {
    setReminders(prev => prev.map((reminder, i) =>
      i === index ? { ...reminder, [field]: value } : reminder
    ))
  }

  const handleDayToggle = (reminderIndex: number, dayIndex: number) => {
    setReminders(prev => prev.map((reminder, i) => {
      if (i === reminderIndex) {
        const currentDays = reminder.daysOfWeek || []
        const newDays = currentDays.includes(dayIndex)
          ? currentDays.filter(d => d !== dayIndex)
          : [...currentDays, dayIndex].sort()
        return { ...reminder, daysOfWeek: newDays }
      }
      return reminder
    }))
  }

  const validateReminders = () => {
    const activeReminders = reminders.filter(r => r.isActive)

    if (activeReminders.length === 0) {
      return 'Please add at least one active reminder'
    }

    for (const reminder of activeReminders) {
      if (!reminder.time || !reminder.time.match(/^\d{2}:\d{2}$/)) {
        return 'Please enter valid times for all reminders'
      }

      if (reminder.isRecurring && (!reminder.daysOfWeek || reminder.daysOfWeek.length === 0)) {
        return 'Please select at least one day for recurring reminders'
      }
    }

    // Check for duplicate times on same days
    const timeMap = new Map<string, number[]>()
    for (const reminder of activeReminders) {
      const key = reminder.time
      const days = reminder.isRecurring ? (reminder.daysOfWeek || []) : [0, 1, 2, 3, 4, 5, 6]

      if (timeMap.has(key)) {
        const existingDays = timeMap.get(key)!
        const overlap = days.some(day => existingDays.includes(day))
        if (overlap) {
          return `Duplicate reminder time: ${formatTime(reminder.time)}`
        }
      }
      timeMap.set(key, days)
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateReminders()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError('')
      const activeReminders = reminders.filter(r => r.isActive)
      await onAddReminder(activeReminders)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reminders')
    }
  }

  const handleClose = () => {
    setReminders([{ time: '09:00', isActive: true, isRecurring: true, daysOfWeek: [1, 2, 3, 4, 5] }])
    setError('')
    setActiveTab('simple')
    setShowPreview(false)
    onClose()
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDayName = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[dayIndex]
  }

  const getPreviewText = (reminder: CustomReminder | string) => {
    // Handle legacy string format
    if (typeof reminder === 'string') {
      return `Daily at ${formatTime(reminder)}`
    }

    if (!reminder.isRecurring) {
      return `Once at ${formatTime(reminder.time)}`
    }

    const days = reminder.daysOfWeek || []
    if (days.length === 7) {
      return `Daily at ${formatTime(reminder.time)}`
    }

    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) {
      return `Weekdays at ${formatTime(reminder.time)}`
    }

    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return `Weekends at ${formatTime(reminder.time)}`
    }

    const dayNames = days.map(d => getDayName(d)).join(', ')
    return `${dayNames} at ${formatTime(reminder.time)}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Custom Reminders</h2>
                  <p className="text-sm text-gray-600">Set personalized reminder times</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {/* Medicine Info */}
            <div className="p-6 border-b border-gray-100">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{medicine.dosage}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Frequency: {medicine.frequency || `${medicine.dosesPerDay} times per day`}</span>
                        {medicine.notes && (
                          <span>• {medicine.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Existing Reminders */}
            {existingReminders.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Existing Reminders
                </h4>
                <div className="flex flex-wrap gap-2">
                  {existingReminders.map((reminder, index) => (
                    <Badge key={index} variant="success" className="text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {getPreviewText(reminder)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="p-6 pb-0">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('simple')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'simple'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Simple Times
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'advanced'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Advanced
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {reminders.map((reminder, index) => (
                  <Card key={index} className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          {/* Time Input */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time
                              </label>
                              <Input
                                type="time"
                                value={reminder.time}
                                onChange={(e) => handleReminderChange(index, 'time', e.target.value)}
                                className="w-full"
                                required
                              />
                            </div>

                            {activeTab === 'simple' && (
                              <div className="flex items-center gap-2 mt-6">
                                <input
                                  type="checkbox"
                                  id={`active-${index}`}
                                  checked={reminder.isActive}
                                  onChange={(e) => handleReminderChange(index, 'isActive', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={`active-${index}`} className="text-sm text-gray-600">
                                  Active
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Advanced Options */}
                          {activeTab === 'advanced' && (
                            <div className="space-y-4">
                              {/* Label */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Label (Optional)
                                </label>
                                <Input
                                  type="text"
                                  value={reminder.label || ''}
                                  onChange={(e) => handleReminderChange(index, 'label', e.target.value)}
                                  placeholder="e.g., Morning dose, Before breakfast"
                                  className="w-full"
                                />
                              </div>

                              {/* Recurring Options */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <input
                                    type="checkbox"
                                    id={`recurring-${index}`}
                                    checked={reminder.isRecurring}
                                    onChange={(e) => handleReminderChange(index, 'isRecurring', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label htmlFor={`recurring-${index}`} className="text-sm font-medium text-gray-700">
                                    Recurring reminder
                                  </label>
                                </div>

                                {reminder.isRecurring && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Days of the week
                                    </label>
                                    <div className="flex gap-2">
                                      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                                        <button
                                          key={dayIndex}
                                          type="button"
                                          onClick={() => handleDayToggle(index, dayIndex)}
                                          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${(reminder.daysOfWeek || []).includes(dayIndex)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                          {getDayName(dayIndex)}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Active Toggle */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`active-adv-${index}`}
                                  checked={reminder.isActive}
                                  onChange={(e) => handleReminderChange(index, 'isActive', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={`active-adv-${index}`} className="text-sm font-medium text-gray-700">
                                  Enable this reminder
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Preview */}
                          {reminder.isActive && (
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  {reminder.label || 'Reminder'}
                                </span>
                              </div>
                              <p className="text-sm text-green-700 mt-1">
                                {getPreviewText(reminder)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        {reminders.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveReminder(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Reminder Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddReminder}
                  className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Reminder
                </Button>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Error</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    How Custom Reminders Work
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Custom reminders send notifications at your specified times</li>
                    <li>• They work independently of your regular medicine schedule</li>
                    <li>• You can set different schedules for weekdays and weekends</li>
                    <li>• Reminders can be temporarily disabled without deleting them</li>
                  </ul>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding Reminders...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Add {reminders.filter(r => r.isActive).length} Reminder{reminders.filter(r => r.isActive).length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}