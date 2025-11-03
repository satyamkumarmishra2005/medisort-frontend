import React from 'react'
import { TestTube, Bell, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { simpleRefillService } from '../services/simpleRefillService'

export const SimpleNotificationTester: React.FC = () => {
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
    
    // Check permission
    console.log('📋 Notification permission:', Notification.permission)
    
    // Check refill service
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
- Notification Permission: ${Notification.permission}
- Active Refill Alerts: ${alerts.length}

Current Alerts:
${alertDetails || 'No active alerts'}

Check console for detailed data table`)
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
        
        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
          <p className="font-medium mb-2">Testing Notes:</p>
          <ul className="space-y-1 text-xs">
            <li>• All notifications now appear as beautiful in-app alerts</li>
            <li>• Test notifications will show interactive cards with actions</li>
            <li>• System check logs detailed information to browser console</li>
            <li>• Refill alerts are based on mock medicine data</li>
            <li>• No browser permission required for in-app notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}