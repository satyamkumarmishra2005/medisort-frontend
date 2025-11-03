import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Bell, Settings, TestTube, Smartphone, Package } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface QuickActionsProps {
  onAddReminder: () => void
  onTestNotifications: () => void
  onOpenSettings: () => void
  onTestRefillSystem: () => void
  onRequestPermission: () => void
  hasNotificationPermission: boolean
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddReminder,
  onTestNotifications,
  onOpenSettings,
  onTestRefillSystem,
  onRequestPermission,
  hasNotificationPermission
}) => {
  const actions = [
    {
      title: 'Add Reminder',
      description: 'Create a new medicine reminder',
      icon: Plus,
      onClick: onAddReminder,
      color: 'bg-blue-600 hover:bg-blue-700',
      primary: true
    },
    {
      title: 'Test Notifications',
      description: 'Check if notifications work',
      icon: TestTube,
      onClick: onTestNotifications,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Test Refill System',
      description: 'Check refill alerts',
      icon: Package,
      onClick: onTestRefillSystem,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Notification Settings',
      description: 'Customize preferences',
      icon: Settings,
      onClick: onOpenSettings,
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Banner */}
        {!hasNotificationPermission && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-900">Enable Notifications</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Allow browser notifications to receive medicine reminders even when the app is closed.
                </p>
                <Button
                  size="sm"
                  onClick={onRequestPermission}
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                >
                  Enable Notifications
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={action.onClick}
                  className={`w-full h-auto p-4 flex flex-col items-start gap-2 ${action.color} text-white`}
                  variant={action.primary ? 'default' : 'secondary'}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{action.title}</span>
                  </div>
                  <p className="text-xs opacity-90 text-left">
                    {action.description}
                  </p>
                </Button>
              </motion.div>
            )
          })}
        </div>

        {/* Status Info */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Notification Status:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                hasNotificationPermission ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={hasNotificationPermission ? 'text-green-600' : 'text-red-600'}>
                {hasNotificationPermission ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Next Check:</span>
            <span className="text-gray-900 font-medium">
              {(() => {
                const now = new Date()
                const hour = now.getHours()
                if (hour < 8) return '8:00 AM'
                if (hour < 18) return '6:00 PM'
                if (hour < 22) return '10:00 PM'
                return 'Tomorrow 8:00 AM'
              })()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}