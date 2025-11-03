import React from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Clock, CheckCircle, X, ShoppingCart } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'

interface RefillAlert {
  id: number
  medicineId: number
  medicineName: string
  dosage: string
  currentStock: number
  totalQuantity: number
  daysRemaining: number
  alertLevel: 'low' | 'critical' | 'out'
  lastRefillDate?: Date
  estimatedFinishDate: Date
}

interface RefillAlertCardProps {
  alert: RefillAlert
  onConfirmRefill: (alertId: number) => void
  onDismiss: (alertId: number) => void
  onSnooze: (alertId: number, hours: number) => void
  className?: string
}

export const RefillAlertCard: React.FC<RefillAlertCardProps> = ({
  alert,
  onConfirmRefill,
  onDismiss,
  onSnooze,
  className = ''
}) => {
  const getAlertColor = (level: string) => {
    switch (level) {
      case 'out': return 'border-red-200 bg-red-50'
      case 'critical': return 'border-orange-200 bg-orange-50'
      case 'low': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'out': return <Badge variant="destructive">Out of Stock</Badge>
      case 'critical': return <Badge variant="destructive">Critical</Badge>
      case 'low': return <Badge variant="warning">Low Stock</Badge>
      default: return null
    }
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'out': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return Package
    }
  }

  const stockPercentage = (alert.currentStock / alert.totalQuantity) * 100
  const Icon = getAlertIcon(alert.alertLevel)

  const getUrgencyMessage = () => {
    if (alert.alertLevel === 'out') {
      return 'Medicine finished - refill immediately'
    }
    if (alert.daysRemaining <= 1) {
      return `Only ${alert.daysRemaining} day${alert.daysRemaining !== 1 ? 's' : ''} remaining`
    }
    return `${alert.daysRemaining} days remaining`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={className}
    >
      <Card className={`transition-all duration-200 hover:shadow-md ${getAlertColor(alert.alertLevel)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Medicine Info */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Icon className={`w-5 h-5 ${
                  alert.alertLevel === 'out' ? 'text-red-600' :
                  alert.alertLevel === 'critical' ? 'text-orange-600' : 'text-yellow-600'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {alert.medicineName}
                    </h3>
                    {alert.dosage && (
                      <p className="text-sm text-gray-600">{alert.dosage}</p>
                    )}
                  </div>
                  {getAlertBadge(alert.alertLevel)}
                </div>
                
                {/* Stock Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock Level</span>
                    <span className="font-medium">
                      {alert.currentStock} / {alert.totalQuantity}
                    </span>
                  </div>
                  <Progress 
                    value={stockPercentage} 
                    className="h-2"
                    variant={
                      alert.alertLevel === 'out' ? 'danger' :
                      alert.alertLevel === 'critical' ? 'warning' : 'default'
                    }
                  />
                </div>
                
                {/* Urgency Message */}
                <div className="flex items-center gap-2 mt-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {getUrgencyMessage()}
                  </span>
                </div>
                
                {/* Estimated finish date */}
                <p className="text-xs text-gray-500 mt-1">
                  Estimated to finish: {alert.estimatedFinishDate.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => onConfirmRefill(alert.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Refilled
              </Button>
              
              {alert.alertLevel !== 'out' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSnooze(alert.id, 24)}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  24h
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(alert.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Additional Info */}
          {alert.lastRefillDate && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last refilled: {alert.lastRefillDate.toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}