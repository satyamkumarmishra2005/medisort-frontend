import React, { useState, useEffect } from 'react'
import { Bell, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { SimpleRefillAlerts } from '../components/SimpleRefillAlerts'
import { SimpleNotificationPermission } from '../components/SimpleNotificationPermission'
import { SimpleNotificationTester } from '../components/SimpleNotificationTester'
import { simpleRefillService } from '../services/simpleRefillService'

const SimpleRemindersAndNotifications: React.FC = () => {
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    // Load initial alert count
    loadAlertCount()
    
    // Listen for alert updates
    const handleAlertsUpdated = (event: CustomEvent) => {
      setAlertCount(event.detail.alertCount)
    }

    window.addEventListener('refill-alerts-updated', handleAlertsUpdated as EventListener)
    window.addEventListener('refill-confirmed', loadAlertCount)
    window.addEventListener('refill-alert-dismissed', loadAlertCount)

    return () => {
      window.removeEventListener('refill-alerts-updated', handleAlertsUpdated as EventListener)
      window.removeEventListener('refill-confirmed', loadAlertCount)
      window.removeEventListener('refill-alert-dismissed', loadAlertCount)
    }
  }, [])

  const loadAlertCount = async () => {
    await simpleRefillService.checkAllMedicinesForRefill()
    const alerts = simpleRefillService.getActiveRefillAlerts()
    setAlertCount(alerts.length)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="w-8 h-8 text-purple-600" />
          Reminders & Notifications
        </h1>
        <p className="text-slate-600 mt-2">
          Monitor refill alerts and manage notification preferences
        </p>
      </div>

      {/* Notification Permission Banner */}
      <SimpleNotificationPermission />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Daily Checks</p>
                <p className="text-xl font-bold">3 Times</p>
                <p className="text-xs text-slate-500">Morning, Evening, Night</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Bell className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Notification Status</p>
                <Badge variant={Notification.permission === 'granted' ? 'default' : 'secondary'}>
                  {Notification.permission === 'granted' ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Package className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Refill Alerts</p>
                <p className="text-xl font-bold">{alertCount}</p>
                <p className="text-xs text-slate-500">Medicines needing refill</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medicine Refill Alerts */}
      <SimpleRefillAlerts />

      {/* Notification Testing */}
      <SimpleNotificationTester />

      {/* How Refill Alerts Work */}
      <Card>
        <CardHeader>
          <CardTitle>How Refill Alerts Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Progressive Notification Schedule</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">3 Days Before End</p>
                    <p className="text-slate-600">1 notification at 9:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">2 Days Before End</p>
                    <p className="text-slate-600">2 notifications (9:00 AM, 6:00 PM)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">1 Day Before End</p>
                    <p className="text-slate-600">3 notifications (9:00 AM, 2:00 PM, 8:00 PM)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-rose-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-700 text-xs font-bold">0</span>
                  </div>
                  <div>
                    <p className="font-medium">Medicine Finished</p>
                    <p className="text-slate-600">Continues 3 notifications daily until refilled</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Alert Levels</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="warning">Warning</Badge>
                  <span>3 days remaining - Plan to refill</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Urgent</Badge>
                  <span>2 days remaining - Refill soon</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Critical</Badge>
                  <span>1 day remaining - Refill today</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Finished</Badge>
                  <span>Medicine ended - Refill immediately</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SimpleRemindersAndNotifications