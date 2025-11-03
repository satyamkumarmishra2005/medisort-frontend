import React from 'react'
import { Button } from './ui/button'
import { Bell } from 'lucide-react'
import { customReminderNotificationService } from '../services/customReminderNotificationService'
import { customReminderService } from '../services/customReminderService'
import { useToast } from './ui/toast'

export const NotificationTestButton: React.FC = () => {
  const { addToast } = useToast()

  const testNotificationNow = async () => {
    try {
      // Create a test reminder for the current time
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      // Create test notification data
      const testNotification = {
        id: Date.now(),
        title: 'Test Notification',
        time: currentTime,
        category: 'health',
        notes: 'This is a test notification to verify the system is working',
        reminder: {
          id: Date.now(),
          title: 'Test Notification',
          time: currentTime,
          frequency: 'daily',
          isActive: true,
          type: 'custom' as const,
          label: 'health'
        }
      }

      // Dispatch the notification event directly
      const event = new CustomEvent('custom-reminder-notification', {
        detail: testNotification
      })
      window.dispatchEvent(event)

      addToast({
        type: 'success',
        title: 'Test Notification Sent',
        description: 'A test notification should appear in the top-right corner',
        duration: 5000
      })

    } catch (error) {
      console.error('Error sending test notification:', error)
      addToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Failed to send test notification',
        duration: 3000
      })
    }
  }

  const createQuickTestReminder = async () => {
    try {
      const now = new Date()
      const testTime = new Date(now.getTime() + 60000) // 1 minute from now
      const timeStr = `${testTime.getHours().toString().padStart(2, '0')}:${testTime.getMinutes().toString().padStart(2, '0')}`
      
      const testReminder = {
        title: 'Quick Test - 1 Minute',
        time: timeStr,
        frequency: 'daily',
        isActive: true,
        label: 'health',
        notes: 'This reminder should trigger in 1 minute'
      }

      await customReminderService.createReminder(testReminder)
      
      addToast({
        type: 'success',
        title: 'Quick Test Reminder Created',
        description: `Reminder will trigger at ${timeStr} (in 1 minute)`,
        duration: 5000
      })

    } catch (error) {
      console.error('Error creating quick test reminder:', error)
      addToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Failed to create test reminder',
        duration: 3000
      })
    }
  }

  const checkServiceStatus = () => {
    const status = customReminderNotificationService.getStatus()
    
    addToast({
      type: 'info',
      title: 'Service Status',
      description: `Notification service is ${status.isRunning ? 'running' : 'stopped'}`,
      duration: 3000
    })

    if (!status.isRunning) {
      addToast({
        type: 'warning',
        title: 'Service Not Running',
        description: 'Starting the notification service...',
        duration: 3000
      })
      customReminderNotificationService.start()
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={testNotificationNow}
        size="sm"
        className="flex items-center gap-2"
      >
        <Bell className="w-4 h-4" />
        Test Notification Now
      </Button>
      
      <Button
        onClick={createQuickTestReminder}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Bell className="w-4 h-4" />
        Test in 1 Minute
      </Button>
      
      <Button
        onClick={checkServiceStatus}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Bell className="w-4 h-4" />
        Check Service
      </Button>
    </div>
  )
}