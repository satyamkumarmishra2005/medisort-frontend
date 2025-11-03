import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Calendar, Sparkles, TrendingUp, Shield } from 'lucide-react'
import { Layout } from '../components/ui/layout'
import { Card, CardContent } from '../components/ui/card'
import { RefillAlertsDashboard } from '../components/RefillAlertsDashboard'
import { refillNotificationService } from '../services/refillNotificationService'

const RemindersAndNotifications: React.FC = () => {
  const [refillStats, setRefillStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    nextRefillDate: 'None'
  })

  const loadRefillStats = async () => {
    try {
      // Check for refill alerts
      await refillNotificationService.checkAllMedicinesForRefill()
      
      // Get current alerts (this should match what RefillAlertsDashboard shows)
      const alerts = refillNotificationService.getActiveRefillAlerts()
      console.log('📊 Refill Stats - Total alerts from service:', alerts.length)
      console.log('📊 Alert details:', alerts.map(a => ({ name: a.medicineName, days: a.daysRemaining, dismissed: a.dismissedDate })))
      
      // Debug: Check if there are any dismissed alerts that might be causing confusion
      const allAlertsIncludingDismissed = Array.from(refillNotificationService['refillAlerts']?.values() || [])
      console.log('📊 ALL alerts (including dismissed):', allAlertsIncludingDismissed.length)
      console.log('📊 All alert details:', allAlertsIncludingDismissed.map(a => ({ 
        name: a.medicineName, 
        days: a.daysRemaining, 
        dismissed: a.dismissedDate,
        isDismissedToday: a.dismissedDate === new Date().toDateString()
      })))
      
      const criticalCount = alerts.filter(alert => alert.daysRemaining <= 1).length
      
      // Find next refill date
      let nextDate = 'None'
      if (alerts.length > 0) {
        const sortedAlerts = alerts.sort((a, b) => a.daysRemaining - b.daysRemaining)
        const nextAlert = sortedAlerts[0]
        if (nextAlert.daysRemaining <= 0) {
          nextDate = 'Now'
        } else if (nextAlert.daysRemaining === 1) {
          nextDate = 'Tomorrow'
        } else {
          nextDate = `${nextAlert.daysRemaining} days`
        }
      }

      setRefillStats({
        totalAlerts: alerts.length,
        criticalAlerts: criticalCount,
        nextRefillDate: nextDate
      })

      // Store notification count in app state for in-app notifications
      // This will be used by the notification bell icon in the app header
      localStorage.setItem('app_notification_count', alerts.length.toString())
      
      // Dispatch custom event for in-app notification updates
      window.dispatchEvent(new CustomEvent('app-notifications-updated', {
        detail: {
          count: alerts.length,
          criticalCount: criticalCount,
          alerts: alerts.map(alert => ({
            id: alert.medicineId,
            title: `${alert.medicineName} needs refill`,
            message: `${alert.daysRemaining} days remaining`,
            type: alert.daysRemaining <= 1 ? 'critical' : 'warning',
            timestamp: new Date().toISOString()
          }))
        }
      }))
      
      console.log('📱 Updated in-app notification count to:', alerts.length)
    } catch (error) {
      console.error('Failed to load refill stats:', error)
    }
  }

  useEffect(() => {

    loadRefillStats()

    // Listen for refill events to update stats
    const handleRefillEvent = (event?: any) => {
      console.log('📊 Refill event detected, updating stats...', event?.type)
      setTimeout(loadRefillStats, 100) // Small delay to ensure state updates
    }

    // Listen for all refill-related events
    window.addEventListener('refill-confirmed', handleRefillEvent)
    window.addEventListener('refill-alert-dismissed', handleRefillEvent)
    window.addEventListener('refill-notification', handleRefillEvent)

    return () => {
      window.removeEventListener('refill-confirmed', handleRefillEvent)
      window.removeEventListener('refill-alert-dismissed', handleRefillEvent)
      window.removeEventListener('refill-notification', handleRefillEvent)
    }
  }, [])

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 p-6"
        >
          {/* Enhanced Header with Dark Gradient Background */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-purple-900 to-indigo-900 p-8 text-white shadow-2xl border border-slate-700/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/5 to-purple-400/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                >
                  <Package className="w-8 h-8 text-blue-200" />
                </motion.div>
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl font-bold flex items-center gap-3"
                  >
                    Refill Reminders
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-slate-200 mt-2 text-lg"
                  >
                    Stay on top of your medicine supply with smart alerts and insights
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Quick Stats with Animations */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg"
                    >
                      <Package className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-300 mb-1">Total Alerts</p>
                      <motion.p 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="text-3xl font-bold text-white"
                      >
                        {refillStats.totalAlerts}
                      </motion.p>
                      <p className="text-xs text-blue-400 mt-1">
                        {refillStats.totalAlerts === 0 ? '✨ All medicines well stocked' : '📦 Medicines need refilling'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg"
                    >
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-300 mb-1">Critical Alerts</p>
                      <motion.p 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="text-3xl font-bold text-white"
                      >
                        {refillStats.criticalAlerts}
                      </motion.p>
                      <p className="text-xs text-red-400 mt-1">
                        {refillStats.criticalAlerts === 0 ? '🛡️ No urgent refills needed' : '🚨 Need immediate attention'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg"
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-300 mb-1">Next Refill</p>
                      <motion.p 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        className="text-2xl font-bold text-white"
                      >
                        {refillStats.nextRefillDate}
                      </motion.p>
                      <p className="text-xs text-purple-400 mt-1">
                        {refillStats.nextRefillDate === 'None' ? '🎯 No refills needed soon' : '⏰ Time until next refill'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Enhanced Refill Alerts Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <RefillAlertsDashboard />
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default RemindersAndNotifications