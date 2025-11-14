import React, { useState, useEffect } from 'react'
import { Package, CheckCircle, RefreshCw, X, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { simpleRefillService, SimpleRefillAlert } from '../services/simpleRefillService'

export const SimpleRefillAlerts: React.FC = () => {
  const [refillAlerts, setRefillAlerts] = useState<SimpleRefillAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRefillAlerts()
    
    // Listen for refill events
    const handleRefillConfirmed = () => {
      loadRefillAlerts()
    }
    
    const handleRefillAlertDismissed = () => {
      loadRefillAlerts()
    }

    const handleRefillAlertsUpdated = () => {
      loadRefillAlerts()
    }

    window.addEventListener('refill-confirmed', handleRefillConfirmed)
    window.addEventListener('refill-alert-dismissed', handleRefillAlertDismissed)
    window.addEventListener('refill-alerts-updated', handleRefillAlertsUpdated)

    return () => {
      window.removeEventListener('refill-confirmed', handleRefillConfirmed)
      window.removeEventListener('refill-alert-dismissed', handleRefillAlertDismissed)
      window.removeEventListener('refill-alerts-updated', handleRefillAlertsUpdated)
    }
  }, [])

  const loadRefillAlerts = async () => {
    try {
      setIsLoading(true)
      await simpleRefillService.checkAllMedicinesForRefill()
      const alerts = simpleRefillService.getActiveRefillAlerts()
      setRefillAlerts(alerts)
    } catch (error) {
      console.error('Error loading refill alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissAlert = (alertId: number) => {
    simpleRefillService.dismissAlert(alertId)
  }

  const handleConfirmRefill = (alertId: number) => {
    simpleRefillService.confirmRefill(alertId)
  }

  const getAlertBadge = (alert: SimpleRefillAlert) => {
    if (alert.daysRemaining <= 0) {
      return <Badge variant="destructive">Finished</Badge>
    } else if (alert.daysRemaining === 1) {
      return <Badge variant="destructive">1 Day Left</Badge>
    } else {
      return <Badge variant="warning">{alert.daysRemaining} Days Left</Badge>
    }
  }

  const getAlertPriority = (alert: SimpleRefillAlert) => {
    if (alert.daysRemaining <= 0) return 'Refill immediately'
    if (alert.daysRemaining === 1) return 'Refill today'
    return 'Plan to refill'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading refill alerts...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Medicine Refill Alerts
            {refillAlerts.length > 0 && (
              <Badge variant="destructive">{refillAlerts.length}</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRefillAlerts}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {refillAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              All Medicines Well Stocked
            </h3>
            <p className="text-gray-600">
              No medicines need refilling at this time
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {refillAlerts
              .sort((a, b) => a.daysRemaining - b.daysRemaining)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {alert.medicineName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {alert.dosage} • {alert.currentStock} doses remaining
                      </p>
                      <p className="text-xs text-gray-500">
                        Expected end: {alert.expectedEndDate.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {getAlertBadge(alert)}
                        <p className="text-xs text-gray-600 mt-1">
                          {getAlertPriority(alert)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismissAlert(alert.id)}
                          title="Dismiss for today"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmRefill(alert.id)}
                          title="Mark as refilled"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}