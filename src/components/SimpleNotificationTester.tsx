import React from 'react'
import { TestTube, Bell, Package, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { simpleRefillService } from '../services/simpleRefillService'
import { notificationService } from '../services/notificationService'
import { backendNotificationPoller } from '../services/backendNotificationPoller'
import { customReminderNotificationService } from '../services/customReminderNotificationService'
import { refillNotificationService } from '../services/refillNotificationService'
import { useAuth } from '../contexts/AuthContext'

export const SimpleNotificationTester: React.FC = () => {
  const { isAuthenticated, token } = useAuth()
  const testMedicineReminder = () => {
    // Create a mock medicine reminder for testing (in-app notification)
    const mockReminder = {
      id: 998,
      medicineId: 998,
      medicineName: 'Test Aspirin',
      dosage: '100mg',
      reminderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOverdue: false,
      scheduledFor: new Date(),
      type: 'due' as const
    }

    // Dispatch the test notification
    const event = new CustomEvent('medicine-notification', {
      detail: mockReminder
    })
    window.dispatchEvent(event)
  }

  const testRefillAlert = async () => {
    // Get a sample alert
    await simpleRefillService.checkAllMedicinesForRefill()
    const alerts = simpleRefillService.getActiveRefillAlerts()

    if (alerts.length > 0) {
      simpleRefillService.showRefillNotification(alerts[0])
    } else {
      // Create a mock refill alert for testing
      const mockAlert = {
        id: 999,
        medicineId: 999,
        medicineName: 'Test Medicine 100mg',
        dosage: '100mg',
        daysRemaining: 1,
        currentStock: 2,
        alertLevel: 'urgent' as const,
        expectedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      }

      // Dispatch the test notification
      const event = new CustomEvent('refill-alert-notification', {
        detail: mockAlert
      })
      window.dispatchEvent(event)
    }
  }

  const testSystemCheck = async () => {
    console.log('🧪 Testing notification system...')

    // Check authentication
    console.log('� Authfentication status:', isAuthenticated)
    console.log('🔑 Token present:', !!token)
    console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'No token')

    // Check permission
    console.log('� Nottification permission:', Notification.permission)

    // Check service states
    const notificationDebugInfo = notificationService.getDebugInfo()
    const backendPollerStatus = backendNotificationPoller.getStatus()
    const customReminderStatus = customReminderNotificationService.getStatus()

    console.log('🔔 Notification service debug info:', notificationDebugInfo)
    console.log('🔔 Backend poller status:', backendPollerStatus)
    console.log('🔔 Custom reminder service status:', customReminderStatus)
    console.log('🔔 Refill service status:', 'Available (no status method)')

    // Check refill service
    if (isAuthenticated) {
      await simpleRefillService.checkAllMedicinesForRefill()
      const alerts = simpleRefillService.getActiveRefillAlerts()
      console.log('📦 Active refill alerts:', alerts.length)

      // Log current data structure
      simpleRefillService.logCurrentData()

      // Show results with updated data
      const alertDetails = alerts.map(alert =>
        `${alert.medicineName}: ${alert.daysRemaining} days left (${alert.alertLevel})`
      ).join('\n')

      alert(`System Check Results:
- Authentication: ${isAuthenticated ? 'Logged in' : 'Not logged in'}
- Token: ${token ? 'Present' : 'Missing'}
- Notification Permission: ${Notification.permission}
- Notification Service: ${notificationDebugInfo.isInitialized ? 'Running' : 'Stopped'}
- Backend Poller: ${backendPollerStatus.isPolling ? 'Running' : 'Stopped'}
- Custom Reminders: ${customReminderStatus.isRunning ? 'Running' : 'Stopped'}
- Active Refill Alerts: ${alerts.length}

Current Alerts:
${alertDetails || 'No active alerts'}

Check console for detailed service states and debug info`)
    } else {
      const notificationDebugInfo = notificationService.getDebugInfo()
      const backendPollerStatus = backendNotificationPoller.getStatus()
      const customReminderStatus = customReminderNotificationService.getStatus()

      alert(`System Check Results:
- Authentication: Not logged in
- Token: Missing
- Notification Permission: ${Notification.permission}
- Notification Service: ${notificationDebugInfo.isInitialized ? 'Running' : 'Stopped'}
- Backend Poller: ${backendPollerStatus.isPolling ? 'Running' : 'Stopped'}
- Custom Reminders: ${customReminderStatus.isRunning ? 'Running' : 'Stopped'}

⚠️ Cannot check medicine data without authentication.
Please log in first to test the full system.

Check console for detailed service states.`)
    }
  }

  const stopAllServices = () => {
    console.log('🛑 Manually stopping all notification services...')

    try {
      notificationService.destroy()
      console.log('✅ Stopped notification service')
    } catch (error) {
      console.error('❌ Error stopping notification service:', error)
    }

    try {
      backendNotificationPoller.stopPolling()
      console.log('✅ Stopped backend notification poller')
    } catch (error) {
      console.error('❌ Error stopping backend poller:', error)
    }

    try {
      customReminderNotificationService.stop()
      console.log('✅ Stopped custom reminder notification service')
    } catch (error) {
      console.error('❌ Error stopping custom reminder service:', error)
    }

    try {
      refillNotificationService.destroy()
      console.log('✅ Stopped refill notification service')
    } catch (error) {
      console.error('❌ Error stopping refill service:', error)
    }

    alert('All notification services have been stopped. Check console for details.')
  }

  const restartServices = async () => {
    if (!isAuthenticated) {
      alert('Cannot restart services without authentication. Please log in first.')
      return
    }

    console.log('🔄 Restarting notification services...')

    try {
      // Stop all services first
      stopAllServices()

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Restart services
      const success = await notificationService.initialize()
      if (success) {
        backendNotificationPoller.startPolling()
        customReminderNotificationService.start()
        await refillNotificationService.initialize()
        console.log('✅ All services restarted successfully')
        alert('Notification services restarted successfully!')
      } else {
        console.error('❌ Failed to restart notification service')
        alert('Failed to restart notification services. Check console for details.')
      }
    } catch (error) {
      console.error('❌ Error restarting services:', error)
      alert('Error restarting services. Check console for details.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Notification Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className={`p-3 rounded-lg border ${isAuthenticated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 text-sm">
            {isAuthenticated ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-800">Authenticated - Services can access API</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-800">Not Authenticated - API calls will fail with 401</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button onClick={testMedicineReminder} variant="outline" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Test Medicine Reminder
          </Button>

          <Button onClick={testRefillAlert} variant="outline" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Test Refill Alert
          </Button>

          <Button onClick={testSystemCheck} variant="outline" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            System Check
          </Button>

          <Button
            onClick={stopAllServices}
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Shield className="w-4 h-4" />
            Stop All Services
          </Button>

          <Button
            onClick={restartServices}
            variant="outline"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            disabled={!isAuthenticated}
          >
            <CheckCircle className="w-4 h-4" />
            Restart Services
          </Button>
        </div>

        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
          <p className="font-medium mb-2">Testing & Debugging Notes:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Authentication Status:</strong> Shows if services can access the API</li>
            <li>• <strong>System Check:</strong> Logs detailed service states and authentication info</li>
            <li>• <strong>Stop Services:</strong> Manually stops all notification services (useful after logout)</li>
            <li>• <strong>Restart Services:</strong> Reinitializes all services (requires authentication)</li>
            <li>• <strong>Test Notifications:</strong> Create mock notifications to test UI components</li>
            <li>• <strong>Console Logs:</strong> Check browser console for detailed debugging information</li>
          </ul>
        </div>

        {!isAuthenticated && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded">
            <p className="font-medium mb-1">⚠️ Authentication Required</p>
            <p>Most testing features require authentication. The console shows 401 errors because notification services are still running after logout. Use "Stop All Services" to clean up.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}