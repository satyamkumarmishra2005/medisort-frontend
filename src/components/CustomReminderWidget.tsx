import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Clock, Plus, ChevronRight, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { customReminderService, CustomReminder } from '../services/customReminderService'
import { useNavigate } from 'react-router-dom'

export const CustomReminderWidget: React.FC = () => {
  const [todaysReminders, setTodaysReminders] = useState<CustomReminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)
  const navigate = useNavigate()

  const categories = [
    { value: 'health', icon: '🏥', color: 'bg-green-100 text-green-800' },
    { value: 'medication', icon: '💊', color: 'bg-blue-100 text-blue-800' },
    { value: 'exercise', icon: '🏃', color: 'bg-orange-100 text-orange-800' },
    { value: 'nutrition', icon: '🥗', color: 'bg-purple-100 text-purple-800' },
    { value: 'appointment', icon: '📅', color: 'bg-red-100 text-red-800' },
    { value: 'personal', icon: '🧘', color: 'bg-pink-100 text-pink-800' },
    { value: 'other', icon: '📝', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    loadTodaysReminders()
    loadCompletedCount()
  }, [])

  const loadTodaysReminders = async () => {
    try {
      setIsLoading(true)
      const reminders = await customReminderService.getTodaysReminders()
      setTodaysReminders(reminders.slice(0, 3)) // Show only first 3
    } catch (error) {
      console.error('Error loading today\'s reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompletedCount = () => {
    const today = new Date().toDateString()
    const completedKey = `completed_reminders_${today}`
    const completed = localStorage.getItem(completedKey)
    
    if (completed) {
      try {
        const completedIds = JSON.parse(completed)
        setCompletedCount(completedIds.length)
      } catch (error) {
        setCompletedCount(0)
      }
    }
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

  const handleViewAll = () => {
    navigate('/custom-reminders')
  }

  const handleCreateNew = () => {
    navigate('/custom-reminders')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Custom Reminders
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {todaysReminders.length > 0 
                ? `${completedCount} of ${todaysReminders.length} completed today`
                : 'No reminders scheduled for today'
              }
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAll}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {todaysReminders.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Custom Reminders</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create personalized reminders for your health routine
            </p>
            <Button onClick={handleCreateNew} size="sm" variant="healthcare">
              <Plus className="w-4 h-4 mr-2" />
              Create First Reminder
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysReminders.map((reminder, index) => {
              const categoryInfo = getCategoryInfo(reminder.label)
              
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{categoryInfo.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{reminder.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(reminder.time)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryInfo.value}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNew}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewAll}
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}