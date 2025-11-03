import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Clock, Package, Settings, X, Check, Timer, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { notificationService, NotificationReminder } from '../../services/notificationService'
import { refillNotificationService } from '../../services/refillNotificationService'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationReminder[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'medicine' | 'refill'>('all')

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    // Get active notifications from various sources
    const medicineNotifications: NotificationReminder[] = [] // Would come from notification service
    const refillAlerts = refillNotificationService.getActiveRefillAlerts()
    
    // Combine all notifications
    const allNotifications = [
      ...medicineNotifications,
      ...refillAlerts.map(alert => ({
        id: alert.medicineId, // Use medicineId as the notification id
        medicineId: alert.medicineId,
        medicineName: alert.medicineName,
        dosage: alert.dosage,
        reminderTime: 'refill',
        isOverdue: alert.alertLevel === 'critical',
        scheduledFor: new Date(),
        type: 'refill' as const,
        refillData: {
          daysRemaining: alert.daysRemaining,
          currentStock: alert.currentStock,
          alertLevel: alert.alertLevel === 'warning' ? 'low' as const : 
                     alert.alertLevel === 'urgent' ? 'critical' as const : 
                     'out' as const
        }
      }))
    ]
    
    setNotifications(allNotifications)
  }

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true
    if (activeTab === 'medicine') return notification.type !== 'refill'
    if (activeTab === 'refill') return notification.type === 'refill'
    return true
  })

  const getNotificationIcon = (notification: NotificationReminder) => {
    if (notification.type === 'refill') return Package
    if (notification.isOverdue) return AlertTriangle
    return Clock
  }

  const getNotificationColor = (notification: NotificationReminder) => {
    if (notification.type === 'refill') {
      if (notification.refillData?.alertLevel === 'out') return 'text-red-600 bg-red-50'
      if (notification.refillData?.alertLevel === 'critical') return 'text-orange-600 bg-orange-50'
      return 'text-yellow-600 bg-yellow-50'
    }
    if (notification.isOverdue) return 'text-red-600 bg-red-50'
    return 'text-blue-600 bg-blue-50'
  }

  const handleMarkAsTaken = async (notificationId: number) => {
    await notificationService.markReminderAsTaken(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleDismiss = (notificationId: number) => {
    notificationService.dismissNotification(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notification Center</h2>
                <p className="text-sm text-gray-600">
                  {notifications.length} active notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'medicine', label: 'Medicine', count: notifications.filter(n => n.type !== 'refill').length },
              { id: 'refill', label: 'Refills', count: notifications.filter(n => n.type === 'refill').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No active notifications at the moment.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification)
                  const colorClass = getNotificationColor(notification)
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {notification.medicineName}
                                  </h4>
                                  {notification.dosage && (
                                    <p className="text-sm text-gray-600">{notification.dosage}</p>
                                  )}
                                  
                                  {notification.type === 'refill' ? (
                                    <div className="mt-2">
                                      <Badge 
                                        variant={
                                          notification.refillData?.alertLevel === 'out' ? 'destructive' :
                                          notification.refillData?.alertLevel === 'critical' ? 'destructive' : 'warning'
                                        }
                                      >
                                        {notification.refillData?.alertLevel === 'out' ? 'Out of Stock' :
                                         notification.refillData?.alertLevel === 'critical' ? 'Critical' : 'Low Stock'}
                                      </Badge>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {notification.refillData?.daysRemaining === 0 
                                          ? 'Medicine finished - refill immediately'
                                          : `${notification.refillData?.daysRemaining} days remaining`
                                        }
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="mt-2">
                                      <Badge variant={notification.isOverdue ? 'destructive' : 'default'}>
                                        {notification.isOverdue ? 'Overdue' : 'Due Now'}
                                      </Badge>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Scheduled for {notification.reminderTime}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2 flex-shrink-0">
                                  {notification.type !== 'refill' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkAsTaken(notification.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Taken
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDismiss(notification.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}