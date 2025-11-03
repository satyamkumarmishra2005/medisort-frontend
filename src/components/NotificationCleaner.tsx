import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Trash2, RefreshCw } from 'lucide-react'
import { customReminderNotificationService } from '../services/customReminderNotificationService'
import { customReminderService } from '../services/customReminderService'

export const NotificationCleaner: React.FC = () => {
  const handleClearNotifications = () => {
    // Clear browser notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => {
            notification.close()
          })
          console.log(`🗑️ Cleared ${notifications.length} browser notifications`)
        })
      })
    }

    // Reset the notification service
    customReminderNotificationService.forceReset()
    
    // Clear reminder cache
    customReminderService.clearCache()
    
    alert('All notifications cleared and service reset!')
  }

  const handleForceRefresh = async () => {
    try {
      // Force refresh reminders from backend
      await customReminderService.forceRefreshFromBackend()
      
      // Reset notification service
      customReminderNotificationService.forceReset()
      
      // Restart the service
      customReminderNotificationService.start()
      
      alert('Reminders refreshed and notification service restarted!')
    } catch (error) {
      console.error('Error refreshing:', error)
      alert('Error refreshing reminders. Check console for details.')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Notification Cleaner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Use these tools to clear stuck notifications and refresh the reminder system.
        </p>
        
        <Button
          onClick={handleClearNotifications}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Notifications
        </Button>
        
        <Button
          onClick={handleForceRefresh}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Force Refresh Reminders
        </Button>
      </CardContent>
    </Card>
  )
}