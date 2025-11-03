import React, { useState, useEffect } from 'react'
import { notificationService, NotificationPreferences } from '../services/notificationService'

export const NotificationPreferencesComponent: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    browserNotifications: true,
    soundAlerts: false,
    reminderMinutes: 15,
    autoMarkTaken: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    // Load current preferences
    const currentPrefs = notificationService.getPreferences()
    setPreferences(currentPrefs)
  }, [])

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | number) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      // If enabling browser notifications, request permission
      if (preferences.browserNotifications && Notification.permission !== 'granted') {
        const granted = await notificationService.requestNotificationPermission()
        if (!granted) {
          setSaveMessage('Browser notification permission was denied')
          setPreferences(prev => ({ ...prev, browserNotifications: false }))
          setIsSaving(false)
          return
        }
      }

      // Save preferences
      notificationService.savePreferences(preferences)
      setSaveMessage('Preferences saved successfully!')
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveMessage('Error saving preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test medicine reminder notification',
        icon: '/favicon.ico'
      })
    } else {
      alert('Please enable browser notifications first')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Notification Preferences
      </h3>

      <div className="space-y-4">
        {/* Browser Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Browser Notifications
            </label>
            <p className="text-sm text-gray-500">
              Show popup notifications in your browser
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.browserNotifications}
              onChange={(e) => handlePreferenceChange('browserNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Sound Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Sound Alerts
            </label>
            <p className="text-sm text-gray-500">
              Play sound when notifications appear
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.soundAlerts}
              onChange={(e) => handlePreferenceChange('soundAlerts', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Reminder Minutes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Time (minutes before)
          </label>
          <select
            value={preferences.reminderMinutes}
            onChange={(e) => handlePreferenceChange('reminderMinutes', parseInt(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        {/* Test Notification Button */}
        {preferences.browserNotifications && (
          <div>
            <button
              onClick={testNotification}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Test Notification
            </button>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
          
          {saveMessage && (
            <p className={`text-sm mt-2 ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}