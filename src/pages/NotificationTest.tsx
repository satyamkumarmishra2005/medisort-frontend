import React from 'react'
import { motion } from 'framer-motion'
import CustomReminderNotificationTester from '../components/CustomReminderNotificationTester'

const NotificationTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Notification System Test</h1>
          <p className="text-muted-foreground">Test and debug custom reminder notifications</p>
        </motion.div>

        <CustomReminderNotificationTester />
      </div>
    </div>
  )
}

export default NotificationTest