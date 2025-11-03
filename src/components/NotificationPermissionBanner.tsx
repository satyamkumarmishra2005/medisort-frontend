import React, { useState, useEffect } from 'react'
import { notificationService } from '../services/notificationService'

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [showBanner, setShowBanner] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    // Check if we should show the permission banner
    const checkPermission = () => {
      if (!('Notification' in window)) {
        return // Browser doesn't support notifications
      }

      if (Notification.permission === 'default') {
        // Haven't asked for permission yet
        const dismissed = localStorage.getItem('notification_banner_dismissed')
        if (!dismissed) {
          setShowBanner(true)
        }
      }
    }

    checkPermission()
  }, [])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    
    try {
      const granted = await notificationService.requestNotificationPermission()
      
      if (granted) {
        setShowBanner(false)
        onPermissionGranted?.()
      } else {
        onPermissionDenied?.()
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      onPermissionDenied?.()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('notification_banner_dismissed', 'true')
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">🔔</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Enable Medicine Reminders
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Get notified when it's time to take your medications. We'll send you timely reminders so you never miss a dose.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}