import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Package, X, Check, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { refillNotificationService, RefillNotificationData } from '../services/refillNotificationService'
import { useToast } from './ui/toast'

interface RefillNotificationModalProps {
  alert: RefillNotificationData | null
  isOpen: boolean
  onClose: () => void
}

export const RefillNotificationModal: React.FC<RefillNotificationModalProps> = ({
  alert,
  isOpen,
  onClose
}) => {
  const [refillQuantity, setRefillQuantity] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const { addToast } = useToast()

  if (!alert) return null

  const handleConfirmRefill = async () => {
    const quantity = parseInt(refillQuantity)
    
    if (!quantity || quantity <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Quantity',
        description: 'Please enter a valid refill quantity',
        duration: 3000
      })
      return
    }

    setIsConfirming(true)
    
    try {
      const success = await refillNotificationService.confirmRefill(alert.medicineId, quantity)
      
      if (success) {
        addToast({
          type: 'success',
          title: 'Refill Confirmed',
          description: `${alert.medicineName} has been refilled with ${quantity} doses`,
          duration: 4000
        })
        onClose()
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Refill Failed',
        description: 'Failed to confirm refill. Please try again.',
        duration: 4000
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleDismiss = () => {
    refillNotificationService.dismissRefillAlert(alert.medicineId)
    addToast({
      type: 'info',
      title: 'Alert Dismissed',
      description: 'Refill reminder dismissed for today',
      duration: 3000
    })
    
    // Dispatch event to notify dashboard to refresh
    window.dispatchEvent(new CustomEvent('refill-alert-dismissed', {
      detail: { medicineId: alert.medicineId }
    }))
    
    onClose()
  }

  const getAlertIcon = () => {
    switch (alert.alertLevel) {
      case 'critical':
        return <AlertTriangle className="w-8 h-8 text-red-500" />
      case 'urgent':
        return <Clock className="w-8 h-8 text-orange-500" />
      default:
        return <Package className="w-8 h-8 text-yellow-500" />
    }
  }

  const getAlertColor = () => {
    switch (alert.alertLevel) {
      case 'critical':
        return 'border-red-600 bg-slate-900'
      case 'urgent':
        return 'border-orange-600 bg-slate-900'
      default:
        return 'border-yellow-600 bg-slate-900'
    }
  }

  const getStatusBadge = () => {
    if (alert.daysRemaining <= 0) {
      return <Badge variant="destructive">Finished</Badge>
    } else if (alert.daysRemaining === 1) {
      return <Badge variant="destructive">1 Day Left</Badge>
    } else {
      return <Badge variant="warning">{alert.daysRemaining} Days Left</Badge>
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md mx-4"
          >
            <Card className={`border-2 ${getAlertColor()}`}>
              <CardHeader className="text-center pb-4 bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAlertIcon()}
                    <div>
                      <CardTitle className="text-lg text-white">Medicine Refill Needed</CardTitle>
                      {getStatusBadge()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-white hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 bg-slate-900">
                {/* Medicine Info */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {alert.medicineName}
                  </h3>
                  <p className="text-slate-300">{alert.dosage}</p>
                  
                  {alert.daysRemaining <= 0 ? (
                    <p className="text-red-400 font-medium">
                      Your medicine has finished. Please refill it immediately.
                    </p>
                  ) : (
                    <p className="text-orange-400 font-medium">
                      Your medicine will finish in {alert.daysRemaining} day{alert.daysRemaining !== 1 ? 's' : ''}. 
                      Please refill it soon.
                    </p>
                  )}
                </div>

                {/* Current Stock Info */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Current Stock:</span>
                    <span className="font-medium text-white">{alert.currentStock} doses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Expected End Date:</span>
                    <span className="font-medium text-white">
                      {alert.expectedEndDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Refill Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Refill Quantity (doses)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter number of doses"
                    value={refillQuantity}
                    onChange={(e) => setRefillQuantity(e.target.value)}
                    min="1"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleConfirmRefill}
                    disabled={isConfirming || !refillQuantity}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Confirm Refill
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                    className="flex-1 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                  >
                    Dismiss for Today
                  </Button>
                </div>

                {/* Notification Info */}
                <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-600">
                  {alert.notificationsSentToday > 0 && (
                    <p>Notifications sent today: {alert.notificationsSentToday}</p>
                  )}
                  {alert.daysRemaining === 2 && (
                    <p>You'll receive 2 reminders today</p>
                  )}
                  {alert.daysRemaining <= 1 && (
                    <p>You'll receive 3 reminders today</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}