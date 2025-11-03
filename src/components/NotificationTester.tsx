import React from 'react'
import { notificationService, NotificationReminder } from '../services/notificationService'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export const NotificationTester: React.FC = () => {
  const testRealMedicineReminders = async () => {
    console.log('🧪 Testing with real user medicines')
    await notificationService.triggerTestReminder()
  }

  const testMorningCheck = async () => {
    console.log('🌅 Testing morning reminder check')
    await notificationService.checkForReminders('morning')
  }

  const testEveningCheck = async () => {
    console.log('🌆 Testing evening reminder check')
    await notificationService.checkForReminders('evening')
  }

  const testNightCheck = async () => {
    console.log('🌙 Testing night reminder check')
    await notificationService.checkForReminders('night')
  }

  const requestPermission = async () => {
    await notificationService.requestNotificationPermission()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Notification Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground mb-4">
          Permission: <span className="font-medium">{Notification.permission}</span>
        </div>
        
        {Notification.permission !== 'granted' && (
          <Button onClick={requestPermission} className="w-full mb-3">
            Request Permission
          </Button>
        )}
        
        <Button onClick={testRealMedicineReminders} variant="outline" className="w-full">
          Test Real Medicine Reminders
        </Button>
        
        <Button onClick={testMorningCheck} variant="outline" className="w-full">
          Test Morning Check (6AM-12PM)
        </Button>
        
        <Button onClick={testEveningCheck} variant="outline" className="w-full">
          Test Evening Check (12PM-8PM)
        </Button>
        
        <Button onClick={testNightCheck} variant="outline" className="w-full">
          Test Night Check (8PM-6AM)
        </Button>
        
        <Button onClick={async () => {
          console.log('🧪 Manual trigger: checkForSpecificReminderTimes')
          await notificationService.checkForSpecificReminderTimes()
        }} variant="outline" className="w-full bg-yellow-50 border-yellow-300">
          🔍 Debug: Check Current Time
        </Button>
      </CardContent>
    </Card>
  )
}