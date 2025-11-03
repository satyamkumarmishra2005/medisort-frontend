import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { notificationService } from '../services/notificationService'
import { medicineApi } from '../services/medicineApi'

export const NotificationDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [medicines, setMedicines] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
      originalLog(...args)
    }

    // Load initial data
    loadDebugData()

    // Update debug info every 5 seconds
    const interval = setInterval(loadDebugData, 5000)

    return () => {
      console.log = originalLog
      clearInterval(interval)
    }
  }, [])

  const loadDebugData = async () => {
    try {
      // Get debug info from notification service
      const info = notificationService.getDebugInfo()
      setDebugInfo(info)

      // Get user medicines
      const userMedicines = await medicineApi.getActiveMedicines()
      setMedicines(userMedicines)

      // Get all reminders
      const allReminders: any[] = []
      for (const medicine of userMedicines) {
        if (medicine.id) {
          const medicineReminders = await medicineApi.getMedicineReminders(medicine.id)
          allReminders.push(...medicineReminders.map(r => ({
            ...r,
            medicineName: medicine.name,
            medicineId: medicine.id
          })))
        }
      }
      setReminders(allReminders)
    } catch (error) {
      console.error('Error loading debug data:', error)
    }
  }

  const triggerTestNotification = async () => {
    console.log('🧪 Manual test notification triggered')
    await notificationService.triggerTestReminder()
  }

  const requestPermission = async () => {
    const granted = await notificationService.requestNotificationPermission()
    console.log('Permission result:', granted)
    loadDebugData()
  }

  const createTestReminder = async () => {
    if (medicines.length === 0) {
      alert('No medicines found. Please add a medicine first.')
      return
    }

    const now = new Date()
    const testTime = `${(now.getHours()).toString().padStart(2, '0')}:${(now.getMinutes() + 1).toString().padStart(2, '0')}`
    
    try {
      await medicineApi.addReminderToMedicine(medicines[0].id, {
        reminderTime: testTime,
        frequency: 'daily'
      })
      console.log(`✅ Created test reminder for ${testTime}`)
      loadDebugData()
    } catch (error) {
      console.error('Error creating test reminder:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Notification System Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* System Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">System Status</h4>
              <div className="text-sm space-y-1">
                <div>Initialized: {debugInfo?.isInitialized ? '✅' : '❌'}</div>
                <div>Current Time: {debugInfo?.currentTime}</div>
                <div>Permission: {debugInfo?.notificationPermission}</div>
                <div>Active Notifications: {debugInfo?.activeNotifications}</div>
                <div>Check Interval: {debugInfo?.checkIntervalActive ? '✅' : '❌'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Preferences</h4>
              <div className="text-sm space-y-1">
                <div>Browser: {debugInfo?.preferences?.browserNotifications ? '✅' : '❌'}</div>
                <div>Sound: {debugInfo?.preferences?.soundAlerts ? '✅' : '❌'}</div>
                <div>Auto Mark: {debugInfo?.preferences?.autoMarkTaken ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={triggerTestNotification} size="sm">
              🧪 Test Check Now
            </Button>
            <Button onClick={requestPermission} size="sm" variant="outline">
              🔔 Request Permission
            </Button>
            <Button onClick={createTestReminder} size="sm" variant="outline">
              ⏰ Create Test Reminder (+1 min)
            </Button>
            <Button onClick={loadDebugData} size="sm" variant="outline">
              🔄 Refresh Data
            </Button>
          </div>

          {/* Medicines & Reminders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Medicines ({medicines.length})</h4>
              <div className="max-h-32 overflow-y-auto text-sm">
                {medicines.map(medicine => (
                  <div key={medicine.id} className="border-b py-1">
                    {medicine.name} - {medicine.dosage}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Active Reminders ({reminders.filter(r => r.isActive).length})</h4>
              <div className="max-h-32 overflow-y-auto text-sm">
                {reminders.filter(r => r.isActive).map(reminder => (
                  <div key={`${reminder.medicineId}-${reminder.reminderTime}`} className="border-b py-1">
                    {reminder.medicineName} at {reminder.reminderTime}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Console Logs */}
          <div>
            <h4 className="font-semibold mb-2">Recent Logs</h4>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs max-h-48 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}