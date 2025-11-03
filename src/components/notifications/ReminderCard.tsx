import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Pill, Calendar, Bell, Check, X, Timer } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface Reminder {
  id: number
  medicineName: string
  dosage: string
  time: string
  status: 'upcoming' | 'due' | 'overdue' | 'taken'
  dueDate: Date
  isCustom?: boolean
}

interface ReminderCardProps {
  reminder: Reminder
  onMarkTaken: (id: number) => void
  onSnooze: (id: number, minutes: number) => void
  onDismiss: (id: number) => void
  className?: string
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onMarkTaken,
  onSnooze,
  onDismiss,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'border-red-200 bg-red-50'
      case 'due': return 'border-orange-200 bg-orange-50'
      case 'upcoming': return 'border-blue-200 bg-blue-50'
      case 'taken': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>
      case 'due': return <Badge variant="warning">Due Now</Badge>
      case 'upcoming': return <Badge variant="default">Upcoming</Badge>
      case 'taken': return <Badge variant="success">Taken</Badge>
      default: return null
    }
  }

  const getTimeUntilDue = () => {
    const now = new Date()
    const diff = reminder.dueDate.getTime() - now.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (minutes < 0) {
      const overdue = Math.abs(minutes)
      if (overdue < 60) return `${overdue}m overdue`
      return `${Math.floor(overdue / 60)}h ${overdue % 60}m overdue`
    }
    
    if (minutes < 60) return `in ${minutes}m`
    if (hours < 24) return `in ${hours}h ${minutes % 60}m`
    return `in ${Math.floor(hours / 24)}d`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={className}
    >
      <Card className={`transition-all duration-200 hover:shadow-md ${getStatusColor(reminder.status)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Medicine Info */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {reminder.isCustom ? (
                  <Bell className="w-5 h-5 text-purple-600" />
                ) : (
                  <Pill className="w-5 h-5 text-blue-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {reminder.medicineName}
                </h3>
                {reminder.dosage && (
                  <p className="text-sm text-gray-600 mt-1">{reminder.dosage}</p>
                )}
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {reminder.time}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {getTimeUntilDue()}
                  </div>
                </div>
                
                <div className="mt-2">
                  {getStatusBadge(reminder.status)}
                </div>
              </div>
            </div>

            {/* Actions */}
            {reminder.status !== 'taken' && (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => onMarkTaken(reminder.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Taken
                </Button>
                
                {reminder.status === 'due' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSnooze(reminder.id, 15)}
                  >
                    <Timer className="w-4 h-4 mr-1" />
                    15m
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss(reminder.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}