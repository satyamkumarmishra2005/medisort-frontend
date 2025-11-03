import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from './button'
import { Badge } from './badge'
import { LogOut, User, Settings, Bell } from 'lucide-react'
import { cn } from '../../lib/utils'
import { refillNotificationService } from '../../services/refillNotificationService'

interface NavigationProps {
  className?: string
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const { user, logout } = useAuth()
  const [refillAlertCount, setRefillAlertCount] = useState(0)

  useEffect(() => {
    const updateRefillAlertCount = () => {
      const activeAlerts = refillNotificationService.getActiveRefillAlerts()
      setRefillAlertCount(activeAlerts.length)
    }

    // Initial load
    updateRefillAlertCount()

    // Initialize the refill service if not already done
    refillNotificationService.initialize().catch(console.error)

    // Listen for refill alert updates
    const handleRefillAlertsUpdated = () => {
      updateRefillAlertCount()
    }

    const handleRefillAlertDismissed = () => {
      updateRefillAlertCount()
    }

    const handleRefillConfirmed = () => {
      updateRefillAlertCount()
    }

    window.addEventListener('refill-alerts-updated', handleRefillAlertsUpdated)
    window.addEventListener('refill-alert-dismissed', handleRefillAlertDismissed)
    window.addEventListener('refill-confirmed', handleRefillConfirmed)

    return () => {
      window.removeEventListener('refill-alerts-updated', handleRefillAlertsUpdated)
      window.removeEventListener('refill-alert-dismissed', handleRefillAlertDismissed)
      window.removeEventListener('refill-confirmed', handleRefillConfirmed)
    }
  }, [])

  return (
    <nav className={cn(
      "flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg",
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MediSort
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {user && (
          <>
            {/* Enhanced Notifications */}
            <Link to="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="relative text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-3 rounded-xl"
              >
                <Bell className="h-5 w-5" />
                {refillAlertCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-6 h-6 text-xs p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg animate-pulse"
                  >
                    {refillAlertCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Enhanced User Info */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-black/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <div className="p-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-slate-200 font-medium">{user.email}</span>
            </div>

            {/* Enhanced Profile Button */}
            <Link to="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-3 rounded-xl"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            {/* Enhanced Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 p-3 rounded-xl"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}