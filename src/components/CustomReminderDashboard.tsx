import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Settings,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { customReminderService, CustomReminder, CustomReminderStats } from '../services/customReminderService'
import { TodaysCustomReminders } from './TodaysCustomReminders'
import { CustomReminderQuickAdd } from './CustomReminderQuickAdd'

interface DashboardStats extends CustomReminderStats {
  completionRate?: number
  streakDays?: number
  weeklyTrend?: number
}

export const CustomReminderDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingReminders, setUpcomingReminders] = useState<CustomReminder[]>([])
  const [overdueReminders, setOverdueReminders] = useState<CustomReminder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const categories = [
    { value: 'health', label: 'Health', icon: '🏥', color: 'bg-green-100 text-green-800' },
    { value: 'medication', label: 'Medication', icon: '💊', color: 'bg-blue-100 text-blue-800' },
    { value: 'exercise', label: 'Exercise', icon: '🏃', color: 'bg-orange-100 text-orange-800' },
    { value: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'bg-purple-100 text-purple-800' },
    { value: 'appointment', label: 'Appointment', icon: '📅', color: 'bg-red-100 text-red-800' },
    { value: 'personal', label: 'Personal', icon: '🧘', color: 'bg-pink-100 text-pink-800' }
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const [statsData, upcoming, overdue] = await Promise.all([
        customReminderService.getCustomReminderStats(),
        customReminderService.getUpcomingReminders(2), // Next 2 hours
        customReminderService.getOverdueReminders()
      ])
      
      // Calculate additional stats
      const enhancedStats: DashboardStats = {
        ...statsData,
        completionRate: calculateCompletionRate(),
        streakDays: calculateStreakDays(),
        weeklyTrend: calculateWeeklyTrend()
      }
      
      setStats(enhancedStats)
      setUpcomingReminders(upcoming)
      setOverdueReminders(overdue)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCompletionRate = (): number => {
    // Get completion data from localStorage for the past 7 days
    const completionRates: number[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toDateString()
      const completedKey = `completed_reminders_${dateKey}`
      const completed = localStorage.getItem(completedKey)
      
      if (completed) {
        try {
          const completedIds = JSON.parse(completed)
          // This is a simplified calculation - in a real app, you'd track total vs completed
          completionRates.push(completedIds.length > 0 ? 85 : 0) // Mock calculation
        } catch (error) {
          completionRates.push(0)
        }
      } else {
        completionRates.push(0)
      }
    }
    
    return completionRates.length > 0 
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0
  }

  const calculateStreakDays = (): number => {
    // Calculate consecutive days with completed reminders
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toDateString()
      const completedKey = `completed_reminders_${dateKey}`
      const completed = localStorage.getItem(completedKey)
      
      if (completed) {
        try {
          const completedIds = JSON.parse(completed)
          if (completedIds.length > 0) {
            streak++
          } else {
            break
          }
        } catch (error) {
          break
        }
      } else {
        break
      }
    }
    
    return streak
  }

  const calculateWeeklyTrend = (): number => {
    // Calculate percentage change from last week
    // This is a mock calculation - in a real app, you'd have historical data
    return Math.floor(Math.random() * 20) - 10 // Random between -10 and +10
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Custom Reminders Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Track and manage your personalized health reminders
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <CustomReminderQuickAdd />
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalReminders}</p>
                    <p className="text-sm text-muted-foreground">Total Reminders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completionRate || 0}%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.streakDays || 0}</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold">{Math.abs(stats.weeklyTrend || 0)}%</p>
                      {(stats.weeklyTrend || 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Weekly Trend</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Reminders - Takes 2 columns */}
        <div className="lg:col-span-2">
          <TodaysCustomReminders />
        </div>
        
        {/* Side Panel */}
        <div className="space-y-6">
          {/* Upcoming Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Upcoming (Next 2 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingReminders.length === 0 ? (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No upcoming reminders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingReminders.slice(0, 3).map((reminder) => {
                    const categoryInfo = getCategoryInfo(reminder.label)
                    return (
                      <div key={reminder.id} className="p-2 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{reminder.title}</p>
                            <p className="text-xs text-gray-600">{formatTime(reminder.time)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {upcomingReminders.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{upcomingReminders.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Reminders */}
          {overdueReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueReminders.slice(0, 3).map((reminder) => {
                    const categoryInfo = getCategoryInfo(reminder.label)
                    return (
                      <div key={reminder.id} className="p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{reminder.title}</p>
                            <p className="text-xs text-red-600">{formatTime(reminder.time)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {overdueReminders.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{overdueReminders.length - 3} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Reminders</span>
                  <Badge variant="success">{stats?.activeReminders || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Today's Total</span>
                  <Badge variant="secondary">{stats?.todaysReminders || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Week</span>
                  <Badge variant="outline">{(stats?.todaysReminders || 0) * 7}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.slice(0, 4).map((category) => (
                  <div key={category.value} className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm flex-1">{category.label}</span>
                    <Badge className={category.color}>
                      {Math.floor(Math.random() * 5)} {/* Mock count */}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}