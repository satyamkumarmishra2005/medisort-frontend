import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { customReminderNotificationService } from '../services/customReminderNotificationService'
import { customReminderService } from '../services/customReminderService'
import { useToast } from './ui/toast'
import { 
  TestTube, 
  Bell, 
  Play, 
  Square, 
  RefreshCw, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus
} from 'lucide-react'

export const CustomReminderNotificationTester: React.FC = () => {
  const [isServiceRunning, setIsServiceRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [todaysReminders, setTodaysReminders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString())
    }, 1000)

    // Check service status
    const statusInterval = setInterval(() => {
      const status = customReminderNotificationService.getStatus()
      setIsServiceRunning(status.isRunning)
    }, 1000)

    // Initial load
    loadTodaysReminders()

    return () => {
      clearInterval(timeInterval)
      clearInterval(statusInterval)
    }
  }, [])

  const loadTodaysReminders = async () => {
    try {
      setIsLoading(true)
      const reminders = await customReminderService.getTodaysReminders()
      setTodaysReminders(reminders)
    } catch (error) {
      console.error('Error loading today\'s reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startNotificationService = () => {
    customReminderNotificationService.start()
    addToast({
      type: 'success',
      title: 'Service Started',
      description: 'Custom reminder notification service is now running',
      duration: 3000
    })
  }

  const stopNotificationService = () => {
    customReminderNotificationService.stop()
    addToast({
      type: 'info',
      title: 'Service Stopped',
      description: 'Custom reminder notification service has been stopped',
      duration: 3000
    })
  }

  const forceCheckReminders = async () => {
    try {
      await customReminderNotificationService.forceCheck()
      addToast({
        type: 'info',
        title: 'Force Check Complete',
        description: 'Manually checked for due reminders',
        duration: 3000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Force Check Failed',
        description: 'Error checking for reminders',
        duration: 3000
      })
    }
  }



  const createTestReminder = async () => {
    try {
      const now = new Date()
      const testTime = new Date(now.getTime() + 2 * 60000) // 2 minutes from now
      const timeStr = `${testTime.getHours().toString().padStart(2, '0')}:${testTime.getMinutes().toString().padStart(2, '0')}`
      
      const testReminder = {
        title: 'Test Reminder - Should trigger in 2 minutes',
        time: timeStr,
        frequency: 'daily',
        isActive: true,
        label: 'health',
        notes: 'This is a test reminder created by the notification tester'
      }

      await customReminderService.createReminder(testReminder)
      await loadTodaysReminders()
      
      addToast({
        type: 'success',
        title: 'Test Reminder Created',
        description: `Reminder will trigger at ${timeStr} (in 2 minutes)`,
        duration: 5000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Test Reminder',
        description: 'Error creating test reminder',
        duration: 3000
      })
    }
  }

  const getCurrentTimeFormatted = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const isReminderDueNow = (reminderTime: string) => {
    const currentTime = getCurrentTimeFormatted()
    return reminderTime === currentTime
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-blue-600" />
            Custom Reminder Notification Tester
          </CardTitle>
          <CardDescription>
            Test and debug the custom reminder notification system
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Service Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="font-medium">Notification Service Status</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isServiceRunning ? 'success' : 'secondary'}>
                  {isServiceRunning ? 'Running' : 'Stopped'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Current time: {currentTime}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!isServiceRunning ? (
                <Button onClick={startNotificationService} size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Start Service
                </Button>
              ) : (
                <Button onClick={stopNotificationService} variant="outline" size="sm">
                  <Square className="w-4 h-4 mr-2" />
                  Stop Service
                </Button>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={forceCheckReminders}
              disabled={!isServiceRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Force Check
            </Button>



            <Button
              onClick={createTestReminder}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Test Reminder
            </Button>

            <Button
              onClick={loadTodaysReminders}
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Reminders
            </Button>

            <Button
              onClick={() => {
                customReminderNotificationService.clearNotificationHistory()
                addToast({
                  type: 'success',
                  title: 'History Cleared',
                  description: 'Notification history cleared to prevent duplicates',
                  duration: 3000
                })
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              🗑️ Clear History
            </Button>

            <Button
              onClick={() => {
                const root = document.documentElement
                const isDark = root.classList.contains('dark')
                if (isDark) {
                  root.classList.remove('dark')
                  root.classList.add('light')
                  localStorage.setItem('theme', 'light')
                } else {
                  root.classList.remove('light')
                  root.classList.add('dark')
                  localStorage.setItem('theme', 'dark')
                }
                addToast({
                  type: 'info',
                  title: 'Theme Toggled',
                  description: `Switched to ${isDark ? 'light' : 'dark'} mode`,
                  duration: 3000
                })
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              🌙 Toggle Dark Mode
            </Button>
          </div>

          {/* Browser Notification Status */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Browser Notification Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Supported:</span>
                <Badge variant={'Notification' in window ? 'success' : 'destructive'}>
                  {'Notification' in window ? 'Yes' : 'No'}
                </Badge>
              </div>

            </div>
          </div>

          {/* Today's Reminders */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Today's Custom Reminders ({todaysReminders.length})
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>Loading reminders...</span>
              </div>
            ) : todaysReminders.length === 0 ? (
              <div className="text-center p-6 bg-muted/30 rounded-lg">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No custom reminders for today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysReminders.map((reminder) => {
                  const isDueNow = isReminderDueNow(reminder.time)
                  const currentTime = getCurrentTimeFormatted()
                  
                  return (
                    <div 
                      key={reminder.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        isDueNow ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{reminder.title}</h4>
                          {isDueNow && (
                            <Badge variant="warning" className="text-xs">
                              <Bell className="w-3 h-3 mr-1" />
                              DUE NOW
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {reminder.time}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {reminder.label || 'other'}
                          </Badge>
                          <Badge variant={reminder.isActive ? 'success' : 'secondary'} className="text-xs">
                            {reminder.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {reminder.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{reminder.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isDueNow ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium mb-2">Debug Information</h3>
            <div className="text-sm space-y-1 font-mono">
              <div>Current Time: {getCurrentTimeFormatted()}</div>
              <div>Service Running: {isServiceRunning.toString()}</div>
              <div>Today's Reminders: {todaysReminders.length}</div>
              <div>Active Reminders: {todaysReminders.filter(r => r.isActive).length}</div>

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomReminderNotificationTester