import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Clock, Package, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface NotificationStatsProps {
  stats: {
    totalReminders: number
    dueNow: number
    overdue: number
    upcoming: number
    refillAlerts: number
    completedToday: number
  }
}

export const NotificationStats: React.FC<NotificationStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Due Now',
      value: stats.dueNow,
      icon: Clock,
      color: 'text-orange-600 bg-orange-100',
      bgColor: 'bg-orange-50',
      description: 'Medicines to take now'
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100',
      bgColor: 'bg-red-50',
      description: 'Missed reminders'
    },
    {
      title: 'Upcoming',
      value: stats.upcoming,
      icon: Bell,
      color: 'text-blue-600 bg-blue-100',
      bgColor: 'bg-blue-50',
      description: 'Next 6 hours'
    },
    {
      title: 'Refill Alerts',
      value: stats.refillAlerts,
      icon: Package,
      color: 'text-purple-600 bg-purple-100',
      bgColor: 'bg-purple-50',
      description: 'Need refilling'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
      bgColor: 'bg-green-50',
      description: 'Medicines taken'
    },
    {
      title: 'Total Active',
      value: stats.totalReminders,
      icon: Calendar,
      color: 'text-gray-600 bg-gray-100',
      bgColor: 'bg-gray-50',
      description: 'All reminders'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`hover:shadow-md transition-all duration-200 ${stat.bgColor} border-0`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {stat.value > 0 && stat.title !== 'Total Active' && stat.title !== 'Completed Today' && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.value}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    {stat.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}