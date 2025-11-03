import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Clock, CheckCircle, RefreshCw, Sparkles, Zap, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { refillNotificationService, RefillNotificationData } from '../services/refillNotificationService'
import { RefillNotificationModal } from './RefillNotificationModal'
import { useToast } from './ui/toast'
import { medicineApi } from '../services/medicineApi'

export const RefillAlertsDashboard: React.FC = () => {
  const [refillAlerts, setRefillAlerts] = useState<RefillNotificationData[]>([])
  const [selectedAlert, setSelectedAlert] = useState<RefillNotificationData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [totalMedicines, setTotalMedicines] = useState(0)
  const { addToast } = useToast()

  useEffect(() => {
    refreshRefillAlerts() // Initial load with full refresh
    
    // Listen for refill events
    const handleRefillConfirmed = () => {
      refreshRefillAlerts() // Full refresh when medicine is refilled
    }
    
    const handleRefillNotification = (event: CustomEvent) => {
      loadRefillAlerts() // Just reload current alerts
    }
    
    const handleRefillAlertDismissed = (event: CustomEvent) => {
      console.log('🔕 Refill alert dismissed, updating dashboard')
      console.log('   - Event detail:', event.detail)
      
      // Force immediate state update
      const alerts = refillNotificationService.getActiveRefillAlerts()
      console.log('   - New alert count:', alerts.length)
      setRefillAlerts(alerts)
      
      // Also do async reload as backup
      setTimeout(() => {
        loadRefillAlerts()
      }, 50)
    }

    const handleMedicineAdded = () => {
      console.log('🎉 RefillAlertsDashboard: Received medicine-added event!')
      console.log('💊 Medicine added, refreshing refill alerts')
      refreshRefillAlerts()
    }

    const handleMedicineUpdated = () => {
      console.log('💊 Medicine updated, refreshing refill alerts')
      refreshRefillAlerts()
    }

    window.addEventListener('refill-confirmed', handleRefillConfirmed)
    window.addEventListener('refill-notification', handleRefillNotification as EventListener)
    window.addEventListener('refill-alert-dismissed', handleRefillAlertDismissed as EventListener)
    window.addEventListener('medicine-added', handleMedicineAdded)
    window.addEventListener('medicine-updated', handleMedicineUpdated)

    return () => {
      window.removeEventListener('refill-confirmed', handleRefillConfirmed)
      window.removeEventListener('refill-notification', handleRefillNotification as EventListener)
      window.removeEventListener('refill-alert-dismissed', handleRefillAlertDismissed as EventListener)
      window.removeEventListener('medicine-added', handleMedicineAdded)
      window.removeEventListener('medicine-updated', handleMedicineUpdated)
    }
  }, [])

  const loadRefillAlerts = async () => {
    try {
      setIsLoading(true)
      
      // Get current alerts (filtered for dismissed ones)
      const alerts = refillNotificationService.getActiveRefillAlerts()
      setRefillAlerts(alerts)
      
      // Get total medicines count
      try {
        const medicines = await medicineApi.getMedicines()
        console.log('🔍 RefillAlertsDashboard: Loaded medicines count:', medicines.length)
        setTotalMedicines(medicines.length)
      } catch (error) {
        console.error('Error loading medicines count:', error)
        setTotalMedicines(0)
      }
      
      console.log('📊 Loaded refill alerts:', alerts.length, 'alerts')
    } catch (error) {
      console.error('Error loading refill alerts:', error)
      addToast({
        type: 'error',
        title: 'Failed to Load Alerts',
        description: 'Could not load refill alerts',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshRefillAlerts = async () => {
    try {
      setIsLoading(true)
      
      // Trigger a check for refill alerts (for initial load or refresh button)
      await refillNotificationService.checkAllMedicinesForRefill()
      
      // Get current alerts
      const alerts = refillNotificationService.getActiveRefillAlerts()
      setRefillAlerts(alerts)
      
      // Get total medicines count
      try {
        const medicines = await medicineApi.getMedicines()
        console.log('🔍 RefillAlertsDashboard (refresh): Loaded medicines count:', medicines.length)
        setTotalMedicines(medicines.length)
      } catch (error) {
        console.error('Error loading medicines count during refresh:', error)
        setTotalMedicines(0)
      }
      
      console.log('🔄 Refreshed refill alerts:', alerts.length, 'alerts')
    } catch (error) {
      console.error('Error refreshing refill alerts:', error)
      addToast({
        type: 'error',
        title: 'Failed to Refresh Alerts',
        description: 'Could not refresh refill alerts',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAlertClick = (alert: RefillNotificationData) => {
    setSelectedAlert(alert)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedAlert(null)
    // Refresh alerts after modal closes to reflect any changes
    setTimeout(() => {
      loadRefillAlerts()
    }, 100) // Small delay to ensure state updates are processed
  }

  const getAlertIcon = (alertLevel: string) => {
    switch (alertLevel) {
      case 'critical':
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg"
          >
            <AlertTriangle className="w-5 h-5 text-white" />
          </motion.div>
        )
      case 'urgent':
        return (
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
        )
      default:
        return (
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
        )
    }
  }

  const getAlertBadge = (alert: RefillNotificationData) => {
    if (alert.daysRemaining <= 0) {
      return <Badge variant="destructive">Finished</Badge>
    } else if (alert.daysRemaining === 1) {
      return <Badge variant="destructive">1 Day Left</Badge>
    } else {
      return <Badge variant="warning">{alert.daysRemaining} Days Left</Badge>
    }
  }

  const getAlertPriority = (alert: RefillNotificationData) => {
    if (alert.daysRemaining <= 0) return 'Immediate Action Required'
    if (alert.daysRemaining === 1) return 'Urgent - Refill Today'
    return 'Refill Soon'
  }

  if (isLoading) {
    return (
      <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-center h-32">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-lg font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Loading refill alerts...
            </span>
          </motion.div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 via-slate-900/30 to-slate-800/20 overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative p-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-white flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
                >
                  <Package className="w-6 h-6 text-white" />
                </motion.div>
                Medicine Refill Alerts
                {refillAlerts.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 shadow-lg">
                      {refillAlerts.length}
                    </Badge>
                  </motion.div>
                )}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-400 mt-1"
              >
                Smart monitoring for your medicine supply
              </motion.p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRefillAlerts}
                disabled={isLoading}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </motion.div>
          </motion.div>
          
          <div>
            {refillAlerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="relative mx-auto mb-6 w-20 h-20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg"></div>
                  <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 border-2 border-dashed border-green-400/50 rounded-full"
                  ></motion.div>
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {(() => {
                    console.log('🔍 RefillAlertsDashboard: totalMedicines =', totalMedicines)
                    return totalMedicines === 0 ? "No Medicines Added Yet" : "All Medicines Well Stocked! 🎉"
                  })()}
                </h3>
                <p className="text-slate-300 text-lg">
                  {totalMedicines === 0 
                    ? "Add your first medicine to start tracking refill alerts."
                    : "Your medicine supply is looking great. No refills needed right now."
                  }
                </p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400"
                >
                  <Shield className="w-4 h-4" />
                  <span>You're all set for your health journey</span>
                </motion.div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {refillAlerts
                  .sort((a, b) => a.daysRemaining - b.daysRemaining)
                  .map((alert, index) => (
                    <motion.div
                      key={alert.medicineId}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative overflow-hidden p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 border border-slate-600/50 hover:border-blue-500/50 backdrop-blur-sm"
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-12 translate-x-12"></div>
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getAlertIcon(alert.alertLevel)}
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-lg mb-1">
                              {alert.medicineName}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-slate-300 mb-2">
                              <span className="flex items-center gap-1">
                                💊 {alert.dosage}
                              </span>
                              <span className="flex items-center gap-1">
                                📦 {alert.currentStock} doses left
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              📅 Expected end: {alert.expectedEndDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                          >
                            {getAlertBadge(alert)}
                          </motion.div>
                          <p className="text-xs font-medium text-slate-300 mt-2">
                            {getAlertPriority(alert)}
                          </p>
                          {alert.notificationsSentToday > 0 && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="text-xs text-blue-400 mt-1 flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" />
                              {alert.notificationsSentToday} reminder{alert.notificationsSentToday !== 1 ? 's' : ''} sent today
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Refill Modal */}
      <RefillNotificationModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  )
}