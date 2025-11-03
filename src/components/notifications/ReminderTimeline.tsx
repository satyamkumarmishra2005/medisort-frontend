import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Pill, Bell, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

interface TimelineReminder {
  id: number
  time: string
  medicineName: string
  dosage: string
  status: 'upcoming' | 'due' | 'overdue' | 'taken'
  isCustom?: boolean
}

interface ReminderTimelineProps {
  reminders: TimelineReminder[]
  currentTime: string
}

export const ReminderTimeline: React.FC<ReminderTimelineProps> = ({ 
  reminders, 
  currentTime 
}) => {
  const sortedReminders = [...reminders].sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`)
    const timeB = new Date(`2000-01-01 ${b.time}`)
    return timeA.getTime() - timeB.getTime()
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return CheckCircle
      case 'overdue': return AlertTriangle
      case 'due': return Bell
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'due': return 'text-orange-600 bg-orange-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const isCurrentTime = (time: string) => {
    const current = new Date(`2000-01-01 ${currentTime}`)
    const reminder = new Date(`2000-01-01 ${time}`)
    const diff = Math.abs(current.getTime() - reminder.getTime())
    return diff <= 30 * 60 * 1000 // Within 30 minutes
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Timeline
        </CardTitle>
        <p className="text-sm text-gray-600">
          Current time: {currentTime}
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          <div className="space-y-6">
            {sortedReminders.map((reminder, index) => {
              const Icon = getStatusIcon(reminder.status)
              const colorClass = getStatusColor(reminder.status)
              const isCurrent = isCurrentTime(reminder.time)
              
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 p-2 rounded-full ${colorClass} ${
                    isCurrent ? 'ring-4 ring-blue-200 scale-110' : ''
                  } transition-all duration-200`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {reminder.time}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Now
                          </Badge>
                        )}
                      </div>
                      
                      <Badge 
                        variant={
                          reminder.status === 'taken' ? 'success' :
                          reminder.status === 'overdue' ? 'destructive' :
                          reminder.status === 'due' ? 'warning' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {reminder.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-1">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        {reminder.isCustom ? (
                          <Bell className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Pill className="w-4 h-4 text-blue-600" />
                        )}
                        {reminder.medicineName}
                      </h4>
                      {reminder.dosage && (
                        <p className="text-sm text-gray-600 mt-1">
                          {reminder.dosage}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
            
            {sortedReminders.length === 0 && (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No reminders today</h3>
                <p className="text-sm text-gray-600">
                  Add some medicine reminders to see them here.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}