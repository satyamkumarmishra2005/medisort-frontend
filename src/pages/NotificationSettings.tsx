import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Settings, Clock, Volume2 } from 'lucide-react'
import { Layout } from '../components/ui/layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { NotificationPreferencesComponent } from '../components/NotificationPreferences'
import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner'
import { useToast } from '../components/ui/toast'

const NotificationSettings: React.FC = () => {
  const { addToast } = useToast()

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Bell className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-3xl font-bold text-foreground">Notification Settings</h2>
              <p className="text-muted-foreground">Manage your medicine reminder preferences</p>
            </div>
          </div>
        </div>

        {/* Permission Banner */}
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
              description: 'Browser notifications are disabled. You can still receive in-app notifications.',
              duration: 4000
            })
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2">
            <NotificationPreferencesComponent />
          </div>

          {/* Information Cards */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Upcoming:</strong> Notifications appear before your medicine time based on your preference.
                </p>
                <p>
                  <strong>Due Now:</strong> Notifications appear exactly when it's time to take your medicine.
                </p>
                <p>
                  <strong>Overdue:</strong> Persistent notifications for missed medicines that require attention.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Settings className="w-5 h-5 mr-2 text-green-600" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  • Keep your browser tab open for best notification delivery
                </p>
                <p>
                  • Enable sound alerts for important medications
                </p>
                <p>
                  • Set reminder time based on your daily routine
                </p>
                <p>
                  • Test notifications to ensure they work properly
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Volume2 className="w-5 h-5 mr-2 text-purple-600" />
                  Browser Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Notifications work best in:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Chrome (Desktop & Mobile)</li>
                  <li>Firefox (Desktop)</li>
                  <li>Safari (Desktop & iOS)</li>
                  <li>Edge (Desktop)</li>
                </ul>
                <p className="text-xs">
                  Some mobile browsers may have limitations with background notifications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}

export default NotificationSettings