import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/toast'
import ApiService from '../services/api'

interface CustomReminder {
  id?: number
  title: string
  time: string
  frequency: string
  isActive: boolean
  type: 'custom'
  daysOfWeek?: number[]
  isRecurring?: boolean
  label?: string
  notes?: string
}

const CustomRemindersTest: React.FC = () => {
  const [reminders, setReminders] = useState<CustomReminder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [newReminder, setNewReminder] = useState({
    title: '',
    time: '09:00',
    frequency: 'daily',
    isActive: true,
    daysOfWeek: [1, 2, 3, 4, 5] // Weekdays
  })
  const [testResults, setTestResults] = useState<string[]>([])
  const { addToast } = useToast()

  const addTestResult = (message: string, isSuccess: boolean = true) => {
    const timestamp = new Date().toLocaleTimeString()
    const result = `[${timestamp}] ${isSuccess ? '✅' : '❌'} ${message}`
    setTestResults(prev => [...prev, result])
    console.log(result)
  }

  const loadReminders = async () => {
    try {
      setIsLoading(true)
      addTestResult('Testing: Get all reminders')
      
      const result = await ApiService.getAllCustomReminders()
      
      if (result.success && result.data) {
        const reminders = result.data as CustomReminder[]
        setReminders(reminders)
        addTestResult(`Successfully loaded ${reminders.length} reminders`)
        
        addToast({
          type: 'success',
          title: 'Reminders Loaded',
          description: `Found ${reminders.length} custom reminders`,
          duration: 3000
        })
      } else {
        addTestResult(`Failed to load reminders: ${result.message}`, false)
        
        addToast({
          type: 'error',
          title: 'Load Failed',
          description: result.message || 'Unknown error',
          duration: 4000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult(`Error loading reminders: ${errorMessage}`, false)
      
      addToast({
        type: 'error',
        title: 'Network Error',
        description: errorMessage,
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createReminder = async () => {
    if (!newReminder.title.trim()) {
      addToast({
        type: 'error',
        title: 'Invalid Data',
        description: 'Please enter a title for the reminder',
        duration: 3000
      })
      return
    }

    try {
      setIsCreating(true)
      addTestResult(`Testing: Create reminder "${newReminder.title}"`)
      
      const result = await ApiService.createCustomReminder(newReminder)
      
      if (result.success && result.data) {
        const newReminder = result.data as CustomReminder
        setReminders(prev => [...prev, newReminder])
        addTestResult(`Successfully created reminder: ${newReminder.title}`)
        
        // Reset form
        setNewReminder({
          title: '',
          time: '09:00',
          frequency: 'daily',
          isActive: true,
          daysOfWeek: [1, 2, 3, 4, 5]
        })
        
        addToast({
          type: 'success',
          title: 'Reminder Created',
          description: `"${newReminder.title}" has been created successfully`,
          duration: 4000
        })
      } else {
        addTestResult(`Failed to create reminder: ${result.message}`, false)
        
        addToast({
          type: 'error',
          title: 'Creation Failed',
          description: result.message || 'Unknown error',
          duration: 4000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult(`Error creating reminder: ${errorMessage}`, false)
      
      addToast({
        type: 'error',
        title: 'Network Error',
        description: errorMessage,
        duration: 4000
      })
    } finally {
      setIsCreating(false)
    }
  }

  const toggleReminder = async (id: number, title: string) => {
    try {
      addTestResult(`Testing: Toggle reminder "${title}"`)
      
      const result = await ApiService.toggleCustomReminderStatus(id)
      
      if (result.success && result.data) {
        const updatedReminder = result.data as CustomReminder
        setReminders(prev => prev.map(r => 
          r.id === id ? updatedReminder : r
        ))
        addTestResult(`Successfully toggled reminder: ${updatedReminder.title} (${updatedReminder.isActive ? 'Active' : 'Inactive'})`)
        
        addToast({
          type: 'success',
          title: 'Reminder Updated',
          description: `"${title}" is now ${updatedReminder.isActive ? 'active' : 'inactive'}`,
          duration: 3000
        })
      } else {
        addTestResult(`Failed to toggle reminder: ${result.message}`, false)
        
        addToast({
          type: 'error',
          title: 'Toggle Failed',
          description: result.message || 'Unknown error',
          duration: 4000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult(`Error toggling reminder: ${errorMessage}`, false)
      
      addToast({
        type: 'error',
        title: 'Network Error',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  const testReminderDelivery = async (id: number, title: string) => {
    try {
      addTestResult(`Testing: Manual delivery for "${title}"`)
      
      const result = await ApiService.testCustomReminderDelivery(id)
      
      if (result.success) {
        addTestResult(`✅ Test notification sent for: ${title}`)
        
        addToast({
          type: 'success',
          title: 'Test Notification Sent',
          description: `Manual test notification sent for "${title}"`,
          duration: 4000
        })
      } else {
        addTestResult(`❌ Failed to send test notification: ${result.message}`, false)
        
        addToast({
          type: 'error',
          title: 'Test Failed',
          description: result.message || 'Unknown error',
          duration: 4000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult(`❌ Error testing reminder delivery: ${errorMessage}`, false)
      
      addToast({
        type: 'error',
        title: 'Network Error',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  const deleteReminder = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      addTestResult(`Testing: Delete reminder "${title}"`)
      
      const result = await ApiService.deleteCustomReminder(id)
      
      if (result.success) {
        setReminders(prev => prev.filter(r => r.id !== id))
        addTestResult(`Successfully deleted reminder: ${title}`)
        
        addToast({
          type: 'success',
          title: 'Reminder Deleted',
          description: `"${title}" has been deleted`,
          duration: 3000
        })
      } else {
        addTestResult(`Failed to delete reminder: ${result.message}`, false)
        
        addToast({
          type: 'error',
          title: 'Delete Failed',
          description: result.message || 'Unknown error',
          duration: 4000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult(`Error deleting reminder: ${errorMessage}`, false)
      
      addToast({
        type: 'error',
        title: 'Network Error',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  const testAllEndpoints = async () => {
    addTestResult('=== Starting comprehensive API test ===')
    
    // Test stats
    try {
      addTestResult('Testing: Get reminder stats')
      const statsResult = await ApiService.getCustomReminderStats()
      if (statsResult.success) {
        addTestResult(`Stats: ${JSON.stringify(statsResult.data)}`)
      } else {
        addTestResult(`Stats failed: ${statsResult.message}`, false)
      }
    } catch (error) {
      addTestResult(`Stats error: ${error}`, false)
    }

    // Test today's reminders
    try {
      addTestResult('Testing: Get today\'s reminders')
      const todayResult = await ApiService.getTodaysCustomReminders()
      if (todayResult.success) {
        const todayReminders = todayResult.data as CustomReminder[] || []
        addTestResult(`Today's reminders: ${todayReminders.length} found`)
        
        // Show details of today's reminders
        todayReminders.forEach(reminder => {
          addTestResult(`  - "${reminder.title}" at ${reminder.time} (${reminder.isActive ? 'Active' : 'Inactive'})`)
        })
      } else {
        addTestResult(`Today's reminders failed: ${todayResult.message}`, false)
      }
    } catch (error) {
      addTestResult(`Today's reminders error: ${error}`, false)
    }

    // Test upcoming reminders
    try {
      addTestResult('Testing: Get upcoming reminders')
      const upcomingResult = await ApiService.getUpcomingCustomReminders(2)
      if (upcomingResult.success) {
        const upcomingReminders = upcomingResult.data as CustomReminder[] || []
        addTestResult(`Upcoming reminders: ${upcomingReminders.length} found`)
        
        // Show details of upcoming reminders
        upcomingReminders.forEach(reminder => {
          addTestResult(`  - "${reminder.title}" at ${reminder.time}`)
        })
      } else {
        addTestResult(`Upcoming reminders failed: ${upcomingResult.message}`, false)
      }
    } catch (error) {
      addTestResult(`Upcoming reminders error: ${error}`, false)
    }

    // Test overdue reminders
    try {
      addTestResult('Testing: Get overdue reminders')
      const overdueResult = await ApiService.getOverdueCustomReminders()
      if (overdueResult.success) {
        const overdueReminders = overdueResult.data as CustomReminder[] || []
        addTestResult(`Overdue reminders: ${overdueReminders.length} found`)
        
        // Show details of overdue reminders
        overdueReminders.forEach(reminder => {
          addTestResult(`  - "${reminder.title}" was due at ${reminder.time}`)
        })
      } else {
        addTestResult(`Overdue reminders failed: ${overdueResult.message}`, false)
      }
    } catch (error) {
      addTestResult(`Overdue reminders error: ${error}`, false)
    }

    addTestResult('=== API test completed ===')
  }

  const createTestReminderForNow = async () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const nextMinute = new Date(now.getTime() + 60000)
    const nextMinuteTime = `${nextMinute.getHours().toString().padStart(2, '0')}:${nextMinute.getMinutes().toString().padStart(2, '0')}`
    
    const testReminder = {
      title: `Test Reminder - ${nextMinuteTime}`,
      time: nextMinuteTime,
      frequency: 'daily',
      isActive: true,
      daysOfWeek: [] // Daily reminder
    }

    try {
      setIsCreating(true)
      addTestResult(`Creating test reminder for ${nextMinuteTime} (1 minute from now)`)
      
      const result = await ApiService.createCustomReminder(testReminder)
      
      if (result.success && result.data) {
        const newReminder = result.data as CustomReminder
        setReminders(prev => [...prev, newReminder])
        addTestResult(`✅ Test reminder created: "${newReminder.title}" - should trigger at ${nextMinuteTime}`)
        
        addToast({
          type: 'success',
          title: 'Test Reminder Created',
          description: `Reminder set for ${nextMinuteTime}. Check your notifications!`,
          duration: 5000
        })
      } else {
        addTestResult(`❌ Failed to create test reminder: ${result.message}`, false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult(`❌ Error creating test reminder: ${errorMessage}`, false)
    } finally {
      setIsCreating(false)
    }
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  useEffect(() => {
    loadReminders()
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Custom Reminders Test</h1>
          <p className="text-muted-foreground">Test the custom reminder API functionality</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
            <p className="text-sm text-blue-600 font-medium">
              Current Time: {currentTime.toLocaleTimeString()} | 
              Day: {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>
        </motion.div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              API Test Controls
            </CardTitle>
            <CardDescription>
              Test various custom reminder API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={loadReminders} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Load Reminders
              </Button>
              <Button onClick={testAllEndpoints} variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Test All Endpoints
              </Button>
              <Button onClick={createTestReminderForNow} disabled={isCreating} variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Create Test Reminder (Next Minute)
              </Button>
              <Button onClick={clearTestResults} variant="outline">
                Clear Test Results
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Reminder Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Test Reminder</CardTitle>
              <CardDescription>
                Create a new reminder to test the API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={newReminder.title}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Take vitamins, Exercise"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <Input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  value={newReminder.frequency}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </div>
              
              <Button onClick={createReminder} disabled={isCreating} className="w-full">
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Reminder
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                API call results and logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">No test results yet. Run some tests to see results here.</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-xs font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reminders List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Reminders ({reminders.length})</CardTitle>
            <CardDescription>
              Reminders loaded from the backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reminders</h3>
                <p className="text-gray-600">Create a test reminder to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{reminder.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            reminder.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {reminder.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>🕐 {reminder.time}</span>
                          <span>📅 {reminder.frequency}</span>
                          <span>🆔 {reminder.id}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testReminderDelivery(reminder.id!, reminder.title)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Test Now
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleReminder(reminder.id!, reminder.title)}
                        >
                          {reminder.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReminder(reminder.id!, reminder.title)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CustomRemindersTest