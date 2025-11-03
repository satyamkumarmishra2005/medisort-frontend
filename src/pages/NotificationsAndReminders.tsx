import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, Settings, Clock, Package, AlertTriangle, CheckCircle, Calendar, Filter, Search, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { NotificationCenter } from '../components/notifications/NotificationCenter'
import { NotificationStats } from '../components/notifications/NotificationStats'
import { ReminderCard } from '../components/notifications/ReminderCard'
import { QuickActions } from '../components/notifications/QuickActions'
import { RefillAlertsDashboard } from '../components/RefillAlertsDashboard'
import { useNotifications } from '../hooks/useNotifications'
import { notificationService } from '../services/notificationService'
import { refillNotificationService } from '../services/refillNotificationService'
import { useAuth } from '../contexts/AuthContext'

interface Reminder {
  id: number
  medicineName: string
  dosage: string
  time: string
  status: 'upcoming' | 'due' | 'overdue' | 'taken'
  dueDate: Date
  isCustom?: boolean
}

export const NotificationsAndReminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'due' | 'overdue' | 'upcoming' | 'taken'>('all')
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [showRefillDashboard, setShowRefillDashboard] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  
  const { isAuthenticated } = useAuth()
  const { hasPermission, requestPermission, checkForReminders } = useNotifications()

  // Mock data for demonstration
  const mockReminders: Reminder[] = [
    {
      id: 1,
      medicineName: 'Lisinopril',
      dosage: '10mg',
      time: '8:00 AM',
      status: 'due',
      dueDate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: 2,
      medicineName: 'Metformin',
      dosage: '500mg',
      time: '12:00 PM',
      status: 'upcoming',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    },
    {
      id: 3,
      medicineName: 'Vitamin D',
      dosage: '1000 IU',
      time: '6:00 PM',
      status: 'overdue',
      dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 4,
      medicineName: 'Custom Reminder',
      dosage: 'Check blood pressure',
      time: '10:00 AM',
      status: 'taken',
      dueDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isCustom: true,
    }
  ]

  useEffect(() => {
    loadReminders()
  }, [isAuthenticated])

  useEffect(() => {
    filterReminders()
  }, [reminders, searchTerm, filterStatus])

  const loadReminders = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would fetch from the API
      // For now, using mock data
      setReminders(mockReminders)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to load reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterReminders = () => {
    let filtered = reminders

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reminder =>
        reminder.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.dosage.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(reminder => reminder.status === filterStatus)
    }

    setFilteredReminders(filtered)
  }

  const handleMarkTaken = async (id: number) => {
    setReminders(prev => prev.map(reminder =>
      reminder.id === id ? { ...reminder, status: 'taken' as const } : reminder
    ))
    
    // In a real app, this would call the API
    await notificationService.markReminderAsTaken(id)
  }

  const handleSnooze = async (id: number, minutes: number) => {
    const newDueDate = new Date(Date.now() + minutes * 60 * 1000)
    setReminders(prev => prev.map(reminder =>
      reminder.id === id ? { 
        ...reminder, 
        dueDate: newDueDate,
        status: 'upcoming' as const 
      } : reminder
    ))
  }

  const handleDismiss = (id: number) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id))
  }

  const handleRefresh = async () => {
    await loadReminders()
    await checkForReminders()
  }

  const getStats = () => {
    const dueNow = reminders.filter(r => r.status === 'due').length
    const overdue = reminders.filter(r => r.status === 'overdue').length
    const upcoming = reminders.filter(r => r.status === 'upcoming').length
    const completedToday = reminders.filter(r => r.status === 'taken').length
    const refillAlerts = refillNotificationService.getActiveRefillAlerts().length

    return {
      totalReminders: reminders.length,
      dueNow,
      overdue,
      upcoming,
      refillAlerts,
      completedToday
    }
  }

  const stats = getStats()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please log in to view your notifications and reminders.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Notifications & Reminders
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your medicine reminders and alerts
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotificationCenter(true)}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notification Center
                {(stats.dueNow + stats.overdue) > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.dueNow + stats.overdue}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <NotificationStats stats={stats} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Reminders List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search medicines..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {['all', 'due', 'overdue', 'upcoming', 'taken'].map((status) => (
                        <Button
                          key={status}
                          variant={filterStatus === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilterStatus(status as any)}
                          className="capitalize"
                        >
                          {status}
                          {status !== 'all' && (
                            <Badge variant="secondary" className="ml-2">
                              {reminders.filter(r => r.status === status).length}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reminders List */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading reminders...</p>
                  </div>
                ) : filteredReminders.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || filterStatus !== 'all' ? 'No matching reminders' : 'No reminders yet'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Get started by adding your first medicine reminder.'
                        }
                      </p>
                      {!searchTerm && filterStatus === 'all' && (
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Reminder
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <AnimatePresence>
                    {filteredReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onMarkTaken={handleMarkTaken}
                        onSnooze={handleSnooze}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Right Column - Quick Actions and Info */}
            <div className="space-y-6">
              <QuickActions
                onAddReminder={() => console.log('Add reminder')}
                onTestNotifications={() => notificationService.triggerTestReminder()}
                onOpenSettings={() => window.location.href = '/notification-settings'}
                onTestRefillSystem={() => setShowRefillDashboard(true)}
                onRequestPermission={requestPermission}
                hasNotificationPermission={hasPermission}
              />

              {/* Today's Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{stats.completedToday}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{stats.dueNow + stats.upcoming}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Missed</span>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium">{stats.overdue}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last updated</span>
                      <span>{lastRefresh.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNotificationCenter && (
          <NotificationCenter
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
          />
        )}
      </AnimatePresence>

      {showRefillDashboard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Refill Alerts Dashboard</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRefillDashboard(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <RefillAlertsDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsAndReminders 