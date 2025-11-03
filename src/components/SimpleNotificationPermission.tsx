import React, { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from './ui/button'

export const SimpleNotificationPermission: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      // Show banner if permission is not granted and not permanently dismissed
      const dismissed = localStorage.getItem('notification_banner_dismissed')
      if (Notification.permission === 'default' && !dismissed) {
        setShowBanner(true)
      }
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        setShowBanner(false)
        // Show a test notification
        new Notification('Notifications Enabled!', {
          body: 'You will now receive medicine reminders.',
          icon: '/favicon.ico'
        })
      }
    }
  }

  const dismissBanner = () => {
    setShowBanner(false)
    localStorage.setItem('notification_banner_dismissed', 'true')
  }

  if (!showBanner || permission === 'granted') {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900">
            Enable Notifications for Medicine Reminders
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Get timely reminders for your medicines and refill alerts directly in your browser.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={requestPermission}>
              Enable Notifications
            </Button>
            <Button size="sm" variant="outline" onClick={dismissBanner}>
              Maybe Later
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={dismissBanner}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}