import React, { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from './ui/badge'

interface NotificationData {
  count: number
  criticalCount: number
  alerts: Array<{
    id: number
    title: string
    message: string
    type: 'warning' | 'critical'
    timestamp: string
  }>
}

export const InAppNotificationBell: React.FC = () => {
  const [notificationData, setNotificationData] = useState<NotificationData>({
    count: 0,
    criticalCount: 0,
    alerts: []
  })

  useEffect(() => {
    // Load initial notification count
    const savedCount = localStorage.getItem('app_notification_count')
    if (savedCount) {
      setNotificationData(prev => ({ ...prev, count: parseInt(savedCount) || 0 }))
    }

    // Listen for notification updates
    const handleNotificationUpdate = (event: CustomEvent) => {
      setNotificationData(event.detail)
    }

    const handleNotificationClear = () => {
      setNotificationData({
        count: 0,
        criticalCount: 0,
        alerts: []
      })
    }

    window.addEventListener('app-notifications-updated', handleNotificationUpdate as EventListener)
    window.addEventListener('app-notifications-cleared', handleNotificationClear)

    return () => {
      window.removeEventListener('app-notifications-updated', handleNotificationUpdate as EventListener)
      window.removeEventListener('app-notifications-cleared', handleNotificationClear)
    }
  }, [])

  return (
    <div className="relative">
      <Bell className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
      {notificationData.count > 0 && (
        <Badge 
          variant={notificationData.criticalCount > 0 ? "destructive" : "default"}
          className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center text-xs px-1"
        >
          {notificationData.count}
        </Badge>
      )}
    </div>
  )
}