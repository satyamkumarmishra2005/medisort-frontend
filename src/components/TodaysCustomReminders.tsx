import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  Circle, 
  RefreshCw, 
  Calendar,
  ChevronRight,
  Star,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { customReminderService, CustomReminder } from '../services/customReminderService'
import { useToast } from './ui/toast'

interface ReminderWithStatus extends CustomReminder {
  isCompleted?: boolean
  completedAt?: string
}

export const TodaysCustomReminders: React.FC = () => {
  const [todaysReminders, setTodaysReminders] = useState<ReminderWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completedReminders, setCompletedReminders] = useState<Set<number>>(new Set())
  
  const { addToast } = useToast()

  const categories = [
    { value: 'health', label: 'Health', icon: '🏥', color: 'bg-green-100 text-green-800' },
    { value: 'medication', label: 'Medication', icon: '💊', color: 'bg-blue-100 text-blue-800' },
    { value: 'exercise', label: 'Exercise', icon: '🏃', color: 'bg-orange-100 text-orange-800' },
    { value: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'bg-purple-100 text-purple-800' },
    { value: 'appointment', label: 'Appointment', icon: '📅', color: 'bg-red-100 text-red-800' },
    { value: 'personal', label: 'Personal', icon: '🧘', color: 'bg-pink-100 text-pink-800' },
    { value: 'other', label: 'Other', icon: '📝', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    loadTodaysReminders()
    loadCompletedStatus()
  }, [])

  const loadTodaysReminders = async () => {
    try {
      setIsLoading(true)
      const reminders = await customReminderService.getTodaysReminders()
      
      // Sort by time
      const sortedReminders = reminders.sort((a, b) => a.time.localeCompare(b.time))
      setTodaysReminders(sortedReminders)
    } catch (error) {
      console.error('Error loading today\'s reminders:', error)
      addToast({
        type: 'error',
        title: 'Failed to Load Reminders',
        description: 'Could not load today\'s reminders',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompletedStatus = () => {
    const today = new Date().toDateString()
    const completedKey = `completed_reminders_${today}`
    const completed = localStorage.getItem(completedKey)
    
    if (completed) {
      try {
        const completedIds = JSON.parse(completed)
        setCompletedReminders(new Set(completedIds))
      } catch (error) {
        console.error('Error loading completed status:', error)
      }
    }
  }

  const saveCompletedStatus = (completedIds: Set<number>) => {
    const today = new Date().toDateString()
    const completedKey = `completed_reminders_${today}`
    localStorage.setItem(completedKey, JSON.stringify(Array.from(completedIds)))
  }

  const handleToggleComplete = (reminderId: number, reminderTitle: string) => {
    const newCompleted = new Set(completedReminders)
    
    if (newCompleted.has(reminderId)) {
      newCompleted.delete(reminderId)
      addToast({
        type: 'info',
        title: 'Reminder Unmarked',
        description: `"${reminderTitle}" marked as incomplete`,
        duration: 2000
      })
    } else {
      newCompleted.add(reminderId)
      addToast({
        type: 'success',
        title: 'Reminder Completed',
        description: `"${reminderTitle}" marked as complete`,
        duration: 2000
      })
    }
    
    setCompletedReminders(newCompleted)
    saveCompletedStatus(newCompleted)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getCategoryInfo = (category?: string) => {
    return categories.find(c => c.value === category) || categories[categories.length - 1]
  }

  const isReminderOverdue = (time: string) => {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)
    
    return now > reminderTime
  }

  const isReminderUpcoming = (time: string) => {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)
    
    const timeDiff = reminderTime.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    
    return hoursDiff > 0 && hoursDiff <= 2 // Upcoming in next 2 hours
  }

  const completedCount = completedReminders.size
  const totalCount = todaysReminders.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Custom Reminders
            </CardTitle>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-600">
                {completedCount} of {totalCount} completed
              </span>
              {totalCount > 0 && (
                <Badge variant={completionPercentage === 100 ? 'success' : 'info'}>
                  {completionPercentage}% Complete
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadTodaysReminders}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading today's reminders...</span>
          </div>
        ) : todaysReminders.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Reminders Today</h3>
            <p className="text-sm text-gray-600">
              You don't have any custom reminders scheduled for today
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress Bar */}
            {totalCount > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Daily Progress</span>
                  <span className="font-medium">{completedCount}/{totalCount}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Reminders List */}
            <AnimatePresence>
              {todaysReminders.map((reminder, index) => {
                const isCompleted = completedReminders.has(reminder.id!)
                const isOverdue = !isCompleted && isReminderOverdue(reminder.time)
                const isUpcoming = !isCompleted && isReminderUpcoming(reminder.time)
                const categoryInfo = getCategoryInfo(reminder.label)
                
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 border rounded-lg transition-all ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : isOverdue
                        ? 'bg-red-50 border-red-200'
                        : isUpcoming
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Completion Toggle */}
                      <button
                        onClick={() => handleToggleComplete(reminder.id!, reminder.title)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isCompleted && <CheckCircle className="w-4 h-4" />}
                      </button>
                      
                      {/* Reminder Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {reminder.title}
                          </h4>
                          <Badge className={`${categoryInfo.color} text-xs`}>
                            {categoryInfo.icon} {categoryInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`flex items-center gap-1 ${
                            isOverdue ? 'text-red-600' : isUpcoming ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {formatTime(reminder.time)}
                          </span>
                          
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                          
                          {isUpcoming && (
                            <Badge variant="warning" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Upcoming
                            </Badge>
                          )}
                          
                          {isCompleted && (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        
                        {reminder.notes && (
                          <p className={`text-xs mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                            {reminder.notes}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Indicator */}
                      <ChevronRight className={`w-4 h-4 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Completion Summary */}
            {completedCount === totalCount && totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-medium text-green-900">All Done! 🎉</h3>
                <p className="text-sm text-green-700">
                  You've completed all your custom reminders for today
                </p>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}