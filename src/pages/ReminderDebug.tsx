import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bug, Clock, RefreshCw, Play, CheckCircle, AlertCircle, Info, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/toast'
import ApiService from '../services/api'

interface DebugInfo {
  currentTime: string
  currentDay: string
  totalReminders: number
  activeReminders: number
  todaysReminders: number
  dueNow: number
  reminderDetails: Array<{
    id: number
    title: string
    time: string
    days: string
    active: boolean
    timeDifferenceSeconds?: number
    withinTolerance?: boolean
  }>
}

const ReminderDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTriggeringScheduler, setIsTriggeringScheduler] = useState(false)
  const [schedulerResult, setSchedulerResult] = useState<any>(null)
  const [databaseState, setDatabaseState] = useState<any>(null)
  const [directDbResult, setDirectDbResult] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { addToast } = useToast()

  const loadDebugInfo = async () => {
    try {
      setIsLoading(true)
      
      // First check if backend is running
      const pingResponse = await fetch('/api/custom-reminders/debug/ping')
      if (!pingResponse.ok) {
        throw new Error('Backend is not responding')
      }
      
      const response = await fetch('/api/custom-reminders/debug/scheduler-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
        
        addToast({
          type: 'success',
          title: 'Debug Info Loaded',
          description: `Found ${data.activeReminders} active reminders. Scheduler last run: ${data.lastSchedulerRun || 'Never'}`,
          duration: 4000
        })
      } else {
        throw new Error('Failed to load debug info')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addToast({
        type: 'error',
        title: 'Debug Load Failed',
        description: errorMessage,
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerSchedulerManually = async () => {
    try {
      setIsTriggeringScheduler(true)
      const response = await fetch('/api/custom-reminders/debug/trigger-scheduler', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSchedulerResult(data)
        
        addToast({
          type: 'success',
          title: 'Scheduler Triggered',
          description: `Processed ${data.remindersFound} reminders`,
          duration: 4000
        })
      } else {
        throw new Error('Failed to trigger scheduler')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addToast({
        type: 'error',
        title: 'Scheduler Trigger Failed',
        description: errorMessage,
        duration: 4000
      })
    } finally {
      setIsTriggeringScheduler(false)
    }
  }

  const checkDatabaseState = async () => {
    try {
      const response = await fetch('/api/custom-reminders/debug/database-state', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDatabaseState(data)
        
        addToast({
          type: 'info',
          title: 'Database State Loaded',
          description: `Found ${data.totalRemindersInDB} reminders in database`,
          duration: 3000
        })
      } else {
        throw new Error('Failed to load database state')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addToast({
        type: 'error',
        title: 'Database Check Failed',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  const createTestReminder = async () => {
    try {
      const response = await fetch('/api/custom-reminders/debug/create-test-reminder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        addToast({
          type: 'success',
          title: 'Test Reminder Created',
          description: `Reminder will trigger at ${data.scheduledTime}. Watch for notification!`,
          duration: 5000
        })
        
        // Refresh debug info to show the new reminder
        loadDebugInfo()
      } else {
        throw new Error('Failed to create test reminder')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addToast({
        type: 'error',
        title: 'Test Reminder Failed',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  const clearCache = async () => {
    try {
      const { customReminderService } = await import('../services/customReminderService')
      customReminderService.clearCache()
      
      addToast({
        type: 'success',
        title: 'Cache Cleared',
        description: 'All cached reminder data has been cleared',
        duration: 3000
      })
      
      // Refresh debug info
      loadDebugInfo()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Clear Cache Failed',
        description: 'Failed to clear cache',
        duration: 3000
      })
    }
  }

  const searchVitaminA = async () => {
    try {
      const response = await fetch('/api/custom-reminders/debug/search-reminder?searchTerm=vitamin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Vitamin search results:', data)
        
        addToast({
          type: 'info',
          title: 'Search Results',
          description: `Found ${data.matchCount} reminders containing "vitamin"`,
          duration: 4000
        })
        
        // Show results in console for debugging
        if (data.matchingReminders.length > 0) {
          console.table(data.matchingReminders)
        }
      } else {
        throw new Error('Failed to search reminders')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addToast({
        type: 'error',
        title: 'Search Failed',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  const deleteVitaminReminders = async () => {
    if (!window.confirm('Are you sure you want to delete ALL reminders containing "vitamin" from the database? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/custom-reminders/debug/delete-by-search?searchTerm=vitamin', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🗑️ Delete results:', data)
        
        addToast({
          type: 'success',
          title: 'Reminders Deleted',
          description: `Deleted ${data.deletedCount} vitamin reminders from database`,
          duration: 5000
        })
        
        // Show deleted reminders in console
        if (data.deletedReminders.length > 0) {
          console.log('🗑️ Deleted reminders:', data.deletedReminders)
        }
        
        // Refresh debug info
        loadDebugInfo()
      } else {
        throw new Error('Failed to delete reminders')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  const directDatabaseQuery = async () => {
    try {
      const response = await fetch('/api/custom-reminders/debug/direct-db-query', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medisort_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDirectDbResult(data)
        
        addToast({
          type: 'info',
          title: 'Direct DB Query Complete',
          description: `Found ${data.directQueryResults} reminders for your user, ${data.totalRemindersInSystem} total in system`,
          duration: 4000
        })
      } else {
        throw new Error('Failed to query database directly')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addToast({
        type: 'error',
        title: 'Direct DB Query Failed',
        description: errorMessage,
        duration: 4000
      })
    }
  }

  useEffect(() => {
    loadDebugInfo()
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Auto-refresh debug info every 30 seconds
    const debugTimer = setInterval(() => {
      loadDebugInfo()
    }, 30000)

    return () => {
      clearInterval(timer)
      clearInterval(debugTimer)
    }
  }, [])

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Reminder Debug Console</h1>
          <p className="text-muted-foreground">Debug and troubleshoot custom reminder delivery</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
            <p className="text-sm text-blue-600 font-medium">
              Current Time: {currentTime.toLocaleTimeString()} | 
              Day: {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>
        </motion.div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-orange-600" />
              Debug Controls
            </CardTitle>
            <CardDescription>
              Tools to debug and test reminder delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={loadDebugInfo} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Debug Info
              </Button>
              <Button onClick={triggerSchedulerManually} disabled={isTriggeringScheduler} variant="outline">
                <Play className={`w-4 h-4 mr-2 ${isTriggeringScheduler ? 'animate-spin' : ''}`} />
                Trigger Scheduler Now
              </Button>
              <Button onClick={checkDatabaseState} variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Check Database State
              </Button>
              <Button onClick={createTestReminder} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Test Reminder (+1 min)
              </Button>
              <Button onClick={clearCache} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
              <Button onClick={searchVitaminA} variant="outline">
                <AlertCircle className="w-4 h-4 mr-2" />
                Search "Vitamin A"
              </Button>
              <Button onClick={deleteVitaminReminders} variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Vitamin Reminders
              </Button>
              <Button onClick={directDatabaseQuery} variant="outline">
                <AlertCircle className="w-4 h-4 mr-2" />
                Direct DB Query
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current reminder system status</CardDescription>
            </CardHeader>
            <CardContent>
              {debugInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{debugInfo.totalReminders}</div>
                      <div className="text-sm text-gray-600">Total Reminders</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{debugInfo.activeReminders}</div>
                      <div className="text-sm text-gray-600">Active Reminders</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{debugInfo.todaysReminders}</div>
                      <div className="text-sm text-gray-600">Today's Reminders</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{debugInfo.dueNow}</div>
                      <div className="text-sm text-gray-600">Due Right Now</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Current System Time</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Time: {debugInfo.currentTime} | Day: {debugInfo.currentDay}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading debug information...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduler Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduler Test Results</CardTitle>
              <CardDescription>Results from manual scheduler trigger</CardDescription>
            </CardHeader>
            <CardContent>
              {schedulerResult ? (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Scheduler Executed</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Found {schedulerResult.remindersFound} reminders due at {schedulerResult.currentTime}
                    </p>
                  </div>
                  
                  {schedulerResult.processedReminders && schedulerResult.processedReminders.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Processed Reminders:</h4>
                      <div className="space-y-2">
                        {schedulerResult.processedReminders.map((result: string, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Click "Trigger Scheduler Now" to test</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reminder Details */}
        <Card>
          <CardHeader>
            <CardTitle>Active Reminder Details</CardTitle>
            <CardDescription>Detailed information about each active reminder</CardDescription>
          </CardHeader>
          <CardContent>
            {debugInfo && debugInfo.reminderDetails ? (
              debugInfo.reminderDetails.length > 0 ? (
                <div className="space-y-4">
                  {debugInfo.reminderDetails.map((reminder) => (
                    <div key={reminder.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{reminder.title}</h4>
                        <div className={`flex items-center gap-1 ${getStatusColor(reminder.active)}`}>
                          {getStatusIcon(reminder.active)}
                          <span className="text-sm">{reminder.active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <div className="font-medium">{reminder.time}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Days:</span>
                          <div className="font-medium">{reminder.days}</div>
                        </div>
                        {reminder.timeDifferenceSeconds !== undefined && (
                          <div>
                            <span className="text-gray-500">Time Diff:</span>
                            <div className="font-medium">{reminder.timeDifferenceSeconds}s</div>
                          </div>
                        )}
                        {reminder.withinTolerance !== undefined && (
                          <div>
                            <span className="text-gray-500">In Tolerance:</span>
                            <div className={`font-medium ${getStatusColor(reminder.withinTolerance)}`}>
                              {reminder.withinTolerance ? 'Yes' : 'No'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Reminders</h3>
                  <p className="text-gray-600">Create some reminders to see debug information</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading reminder details...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database State */}
        {databaseState && (
          <Card>
            <CardHeader>
              <CardTitle>Database State (Service Layer)</CardTitle>
              <CardDescription>Reminders via service layer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Service Layer Results</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    User: {databaseState.userEmail} | Total Reminders: {databaseState.totalRemindersInDB}
                  </p>
                </div>
                
                {databaseState.reminders && databaseState.reminders.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Reminders via Service:</h4>
                    <div className="space-y-2">
                      {databaseState.reminders.map((reminder: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                          <div className="font-medium">ID: {reminder.id} - {reminder.customMessage}</div>
                          <div className="text-gray-600">
                            Time: {reminder.reminderTime} | Active: {reminder.active ? 'Yes' : 'No'} | 
                            Medicine User ID: {reminder.medicineUserId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Direct Database Query */}
        {directDbResult && (
          <Card>
            <CardHeader>
              <CardTitle>Direct Database Query</CardTitle>
              <CardDescription>Raw database results (bypasses service layer)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Direct Database Results</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Your User ID: {directDbResult.userId} | Your Reminders: {directDbResult.directQueryResults} | 
                    Total in System: {directDbResult.totalRemindersInSystem}
                  </p>
                </div>
                
                {directDbResult.userReminders && directDbResult.userReminders.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Your Reminders (Direct DB):</h4>
                    <div className="space-y-2">
                      {directDbResult.userReminders.map((reminder: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                          <div className="font-medium">ID: {reminder.id} - {reminder.message}</div>
                          <div className="text-gray-600">
                            Active: {reminder.active ? 'Yes' : 'No'} | Medicine User ID: {reminder.medicineUserId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {directDbResult.allRemindersInSystem && directDbResult.allRemindersInSystem.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">All Reminders in System:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {directDbResult.allRemindersInSystem.map((reminder: any, index: number) => (
                        <div key={index} className="p-2 bg-yellow-50 rounded text-xs">
                          <div className="font-medium">ID: {reminder.id} - {reminder.message}</div>
                          <div className="text-gray-600">
                            User: {reminder.userEmail} (ID: {reminder.medicineUserId})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Tips</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">If reminders are not triggering:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Check if reminders are active (green status)</li>
                  <li>• Verify the time matches current system time</li>
                  <li>• Ensure the current day is selected (or no days for daily)</li>
                  <li>• Check if "Time Diff" is within 60 seconds</li>
                  <li>• Use "Trigger Scheduler Now" to test manually</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">System Requirements:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Backend scheduler must be running (@EnableScheduling)</li>
                  <li>• Database connection must be active</li>
                  <li>• User must be authenticated</li>
                  <li>• Reminders must have valid time format (HH:MM)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReminderDebug
