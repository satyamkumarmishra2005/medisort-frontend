import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Clock, CheckCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { refillNotificationService, RefillNotificationData } from '../services/refillNotificationService'
import { RefillNotificationModal } from './RefillNotificationModal'
import { useToast } from './ui/toast'

export const RefillAlertsDashboard: React.FC = () => {
  const [refillAlerts, setRefillAlerts] = useState<RefillNotificationData[]>([])
  const [selectedAlert, setSelectedAlert] = useState<RefillNotificationData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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

    window.addEventListener('refill-confirmed', handleRefillConfirmed)
    window.addEventListener('refill-notification', handleRefillNotification as EventListener)
    window.addEventListener('refill-alert-dismissed', handleRefillAlertDismissed as EventListener)

    return () => {
      window.removeEventListener('refill-confirmed', handleRefillConfirmed)
      window.removeEventListener('refill-notification', handleRefillNotification as EventListener)
      window.removeEventListener('refill-alert-dismissed', handleRefillAlertDismissed as EventListener)
    }
  }, [])

  const loadRefillAlerts = async () => {
    try {
      setIsLoading(true)
      
      // Get current alerts (filtered for dismissed ones)
      const alerts = refillNotificationService.getActiveRefillAlerts()
      setRefillAlerts(alerts)
      
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
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'urgent':
        return <Clock className="w-5 h-5 text-orange-500" />
      default:
        return <Package className="w-5 h-5 text-yellow-500" />
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
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading refill alerts...</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5" />
              Medicine Refill Alerts
              {refillAlerts.length > 0 && (
                <Badge variant="destructive">{refillAlerts.length}</Badge>
              )}
            </h2>
            <p className="text-muted-foreground text-sm">
              Medicines that need refilling soon
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshRefillAlerts}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div>
          {refillAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                All Medicines Well Stocked
              </h3>
              <p className="text-muted-foreground">
                No medicines need refilling at this time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {refillAlerts
                .sort((a, b) => a.daysRemaining - b.daysRemaining) // Sort by urgency
                .map((alert) => (
                  <motion.div
                    key={alert.medicineId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-muted/50 rounded-lg cursor-pointer transition-colors hover:bg-muted/70"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.alertLevel)}
                        <div>
                          <h4 className="font-medium text-foreground">
                            {alert.medicineName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {alert.dosage} • {alert.currentStock} doses remaining
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expected end: {alert.expectedEndDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {getAlertBadge(alert)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {getAlertPriority(alert)}
                        </p>
                        {alert.notificationsSentToday > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {alert.notificationsSentToday} reminder{alert.notificationsSentToday !== 1 ? 's' : ''} sent today
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
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