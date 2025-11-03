import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, Bell, CheckCircle, X, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { customReminderService, CustomReminderRequest } from '../services/customReminderService'
import { useToast } from './ui/toast'

interface QuickReminderData {
  title: string
  time: string
  category: string
  frequency: string
  daysOfWeek: number[]
}

export const CustomReminderQuickAdd: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [quickReminder, setQuickReminder] = useState<QuickReminderData>({
    title: '',
    time: '09:00',
    category: 'health',
    frequency: 'daily',
    daysOfWeek: [1, 2, 3, 4, 5] // Weekdays
  })

  const { addToast } = useToast()

  const categories = [
    { value: 'health', label: 'Health', icon: '🏥', color: 'bg-green-100 text-green-800' },
    { value: 'medication', label: 'Medication', icon: '💊', color: 'bg-blue-100 text-blue-800' },
    { value: 'exercise', label: 'Exercise', icon: '🏃', color: 'bg-orange-100 text-orange-800' },
    { value: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'bg-purple-100 text-purple-800' },
    { value: 'appointment', label: 'Appointment', icon: '📅', color: 'bg-red-100 text-red-800' },
    { value: 'personal', label: 'Personal', icon: '🧘', color: 'bg-pink-100 text-pink-800' }
  ]

  const quickTemplates = [
    { title: 'Take vitamins', time: '08:00', category: 'health', frequency: 'daily' },
    { title: 'Morning exercise', time: '07:00', category: 'exercise', frequency: 'daily' },
    { title: 'Drink water', time: '10:00', category: 'health', frequency: 'daily' },
    { title: 'Check blood pressure', time: '18:00', category: 'health', frequency: 'weekly' },
    { title: 'Meditation', time: '20:00', category: 'personal', frequency: 'daily' },
    { title: 'Healthy snack', time: '15:00', category: 'nutrition', frequency: 'daily' }
  ]

  const handleQuickCreate = async () => {
    if (!quickReminder.title.trim()) {
      addToast({
        type: 'error',
        title: 'Title Required',
        description: 'Please enter a title for your reminder',
        duration: 3000
      })
      return
    }

    try {
      setIsCreating(true)
      
      const reminderData: CustomReminderRequest = {
        title: quickReminder.title,
        time: quickReminder.time,
        frequency: quickReminder.frequency,
        isActive: true,
        daysOfWeek: quickReminder.daysOfWeek,
        isRecurring: true,
        label: quickReminder.category
      }
      
      const createdReminder = await customReminderService.createReminder(reminderData)
      
      // Reset form
      setQuickReminder({
        title: '',
        time: '09:00',
        category: 'health',
        frequency: 'daily',
        daysOfWeek: [1, 2, 3, 4, 5]
      })
      
      setIsOpen(false)
      
      addToast({
        type: 'success',
        title: 'Reminder Created',
        description: `"${createdReminder.title}" has been added to your reminders`,
        duration: 4000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Reminder',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleTemplateSelect = (template: typeof quickTemplates[0]) => {
    setQuickReminder({
      title: template.title,
      time: template.time,
      category: template.category,
      frequency: template.frequency,
      daysOfWeek: template.frequency === 'daily' ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5]
    })
  }

  const handleDayToggle = (dayIndex: number) => {
    setQuickReminder(prev => {
      const currentDays = prev.daysOfWeek || []
      const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter(d => d !== dayIndex)
        : [...currentDays, dayIndex].sort()
      
      return { ...prev, daysOfWeek: newDays }
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Quick Add Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="healthcare"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Quick Reminder
      </Button>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <Card variant="premium" className="border-0 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Quick Add Reminder
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Quick Templates */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quick Templates</label>
                    <div className="grid grid-cols-2 gap-2">
                      {quickTemplates.map((template, index) => {
                        const category = categories.find(c => c.value === template.category)
                        return (
                          <button
                            key={index}
                            onClick={() => handleTemplateSelect(template)}
                            className="p-2 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{category?.icon}</span>
                              <span className="text-sm font-medium">{template.title}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(template.time)} • {template.frequency}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom Reminder Form */}
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Reminder Title</label>
                        <Input
                          value={quickReminder.title}
                          onChange={(e) => setQuickReminder(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Take vitamins, Exercise, Check blood pressure"
                          variant="premium"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Time</label>
                          <Input
                            type="time"
                            value={quickReminder.time}
                            onChange={(e) => setQuickReminder(prev => ({ ...prev, time: e.target.value }))}
                            variant="premium"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Frequency</label>
                          <select
                            value={quickReminder.frequency}
                            onChange={(e) => setQuickReminder(prev => ({ ...prev, frequency: e.target.value }))}
                            className="w-full p-2 border border-input rounded-md text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="as-needed">As Needed</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                          {categories.map(category => (
                            <button
                              key={category.value}
                              onClick={() => setQuickReminder(prev => ({ ...prev, category: category.value }))}
                              className={`p-2 text-center border rounded-md transition-colors ${
                                quickReminder.category === category.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="text-lg mb-1">{category.icon}</div>
                              <div className="text-xs font-medium">{category.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Days of Week */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Days of the week</label>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                            const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                            const fullDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                            const isSelected = quickReminder.daysOfWeek?.includes(dayIndex)
                            
                            return (
                              <button
                                key={dayIndex}
                                type="button"
                                onClick={() => handleDayToggle(dayIndex)}
                                title={fullDayNames[dayIndex]}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {dayNames[dayIndex]}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                      onClick={handleQuickCreate}
                      disabled={isCreating || !quickReminder.title.trim()}
                      variant="healthcare"
                      className="flex-1"
                    >
                      {isCreating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 mr-2"
                          >
                            <Clock className="w-4 h-4" />
                          </motion.div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Reminder
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}