import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Settings, Calendar, Smartphone, Package, TestTube, Clock } from 'lucide-react'
import { Layout } from '../components/ui/layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

import { NotificationPreferencesComponent } from '../components/NotificationPreferences'
import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner'
import { NotificationTester } from '../components/NotificationTester'
import { RefillAlertsDashboard } from '../components/RefillAlertsDashboard'
import { AuthStatusBanner } from '../components/AuthStatusBanner'
import { useToast } from '../components/ui/toast'
import { notificationService } from '../services/notificationService'
import { refillNotificationService } from '../services/refillNotificationService'

const RemindersAndNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'refill-alerts' | 'notifications' | 'settings' | 'testing'>('refill-alerts')
  const { addToast } = useToast()

  const tabs = [
    {
      id: 'refill-alerts' as const,
      label: 'Refill Alerts',
      icon: Package,
      description: 'Monitor medicines needing refill'
    },
    {
      id: 'notifications' as const,
      label: 'Notification System',
      icon: Bell,
      description: 'Configure how you receive notifications'
    },
    {
      id: 'settings' as const,
      label: 'Preferences',
      icon: Settings,
      description: 'Customize notification settings'
    },
    {
      id: 'testing' as const,
      label: 'System Testing',
      icon: TestTube,
      description: 'Test notification systems'
    }
  ]

  const handleTestNotifications = async () => {
    try {
      await notificationService.triggerTestReminder()
      addToast({
        type: 'info',
        title: 'Testing Notifications',
        description: 'Check for notifications based on your medicines',
        duration: 3000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not test notifications',
        duration: 3000
      })
    }
  }

  const handleTestRefillSystem = async () => {
    try {
      await refillNotificationService.checkAllMedicinesForRefill()
      const alerts = refillNotificationService.getActiveRefillAlerts()
      addToast({
        type: 'info',
        title: 'Refill System Test',
        description: `Found ${alerts.length} medicines needing refill`,
        duration: 3000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Refill Test Failed',
        description: 'Could not test refill system',
        duration: 3000
      })
    }
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Authentication Status */}
        <AuthStatusBanner 
          onLoginClick={() => {
            // You can implement navigation to login page here
            addToast({
              title: "Login Required",
              description: "Please log in to access all features",
              type: "info"
            })
          }}
        />

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Reminders & Notifications
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor refill alerts and manage notification preferences
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={handleTestNotifications} variant="outline">
              <Smartphone className="w-4 h-4 mr-2" />
              Test Notifications
            </Button>
            <Button onClick={handleTestRefillSystem} variant="outline">
              <Package className="w-4 h-4 mr-2" />
              Test Refill System
            </Button>
          </div>
        </div>

        {/* Notification Permission Banner */}
        <NotificationPermissionBanner 
          onPermissionGranted={() => {
            addToast({
              type: 'success',
              title: 'Notifications Enabled',
              description: 'You will now receive medicine reminders.',
              duration: 3000
            })
          }}
          onPermissionDenied={() => {
            addToast({
              type: 'warning',
              title: 'Notifications Disabled',
              description: 'You can still use in-app reminders.',
              duration: 3000
            })
          }}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Checks</p>
                  <p className="text-xl font-bold">3 Times</p>
                  <p className="text-xs text-muted-foreground">Morning, Evening, Night</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notification Status</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={Notification.permission === 'granted' ? 'default' : 'secondary'}>
                      {Notification.permission === 'granted' ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refill Alerts</p>
                  <p className="text-xl font-bold">
                    {refillNotificationService.getActiveRefillAlerts().length}
                  </p>
                  <p className="text-xs text-muted-foreground">Medicines needing refill</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Check</p>
                  <p className="text-lg font-bold">
                    {(() => {
                      const now = new Date()
                      const hour = now.getHours()
                      if (hour < 8) return '8:00 AM'
                      if (hour < 18) return '6:00 PM'
                      if (hour < 22) return '10:00 PM'
                      return 'Tomorrow 8:00 AM'
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'refill-alerts' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <RefillAlertsDashboard />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    How Refill Alerts Work
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Progressive Notification Schedule</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-yellow-600 text-xs font-bold">3</span>
                          </div>
                          <div>
                            <p className="font-medium">3 Days Before End</p>
                            <p className="text-muted-foreground">1 notification at 9:00 AM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-orange-600 text-xs font-bold">2</span>
                          </div>
                          <div>
                            <p className="font-medium">2 Days Before End</p>
                            <p className="text-muted-foreground">2 notifications (9:00 AM, 6:00 PM)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-red-600 text-xs font-bold">1</span>
                          </div>
                          <div>
                            <p className="font-medium">1 Day Before End</p>
                            <p className="text-muted-foreground">3 notifications (9:00 AM, 2:00 PM, 8:00 PM)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-red-700 text-xs font-bold">0</span>
                          </div>
                          <div>
                            <p className="font-medium">Medicine Finished</p>
                            <p className="text-muted-foreground">Continues 3 notifications daily until refilled</p>
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
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> You can confirm refills directly from notifications or dismiss alerts for a day if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">How It Works</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-xs font-bold">1</span>
                          </div>
                          <div>
                            <p className="font-medium">Morning Check (8:00 AM)</p>
                            <p className="text-muted-foreground">Checks medicines due 6 AM - 12 PM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-orange-600 text-xs font-bold">2</span>
                          </div>
                          <div>
                            <p className="font-medium">Evening Check (6:00 PM)</p>
                            <p className="text-muted-foreground">Checks medicines due 12 PM - 8 PM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-purple-600 text-xs font-bold">3</span>
                          </div>
                          <div>
                            <p className="font-medium">Night Check (10:00 PM)</p>
                            <p className="text-muted-foreground">Checks medicines due 8 PM - 6 AM</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Notification Types</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Badge variant="default">Upcoming</Badge>
                          <span>Medicines due within 6 hours</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Due Now</Badge>
                          <span>Medicines due within 30 minutes</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive">Overdue</Badge>
                          <span>Medicines missed by more than 1 hour</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="warning">Refill</Badge>
                          <span>Medicines needing refill soon</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Medicine Reminders</h4>
                      <div className="space-y-2 text-sm">
                        <p>• <strong>Custom times only</strong> - Set by user</p>
                        <p>• Exact time notifications for medicine doses</p>
                        <p>• Mark as taken or skip functionality</p>
                        <p>• No automatic defaults based on dosesPerDay</p>
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                        <strong>Note:</strong> Only shows reminders you manually set for specific times
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Refill Notifications</h4>
                      <div className="space-y-2 text-sm">
                        <p>• <strong>Automatic monitoring</strong> - System controlled</p>
                        <p>• Progressive notification frequency (1x, 2x, 3x daily)</p>
                        <p>• Stock level monitoring</p>
                        <p>• Refill confirmation system</p>
                      </div>
                      <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-800">
                        <strong>Note:</strong> Automatically alerts when medicines are running low
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <NotificationPreferencesComponent />
              
              <Card>
                <CardHeader>
                  <CardTitle>Additional Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Daily Check Times</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Morning Check:</span>
                          <span className="font-medium">8:00 AM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Evening Check:</span>
                          <span className="font-medium">6:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Night Check:</span>
                          <span className="font-medium">10:00 PM</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Browser Support</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>✅ Chrome (Desktop & Mobile)</p>
                        <p>✅ Firefox (Desktop)</p>
                        <p>✅ Safari (Desktop & iOS 16.4+)</p>
                        <p>✅ Edge (Desktop)</p>
                        <p>⚠️ Limited support on some mobile browsers</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'testing' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Medicine Reminder Testing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NotificationTester />
                </CardContent>
              </Card>


            </motion.div>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}

export default RemindersAndNotifications