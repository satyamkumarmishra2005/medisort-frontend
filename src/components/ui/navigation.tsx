import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ThemeToggle } from './theme-toggle'
import { Button } from './button'
import { Badge } from './badge'
import { LogOut, User, Settings, Bell } from 'lucide-react'
import { cn } from '../../lib/utils'
import { mockNotifications } from '../../data/mockData'

interface NavigationProps {
  className?: string
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const { user, logout } = useAuth()
  const unreadNotifications = mockNotifications.filter(n => !n.isRead).length

  return (
    <nav className={cn(
      "flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border",
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 healthcare-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-bold text-foreground">MediSort</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        {user && (
          <>
            {/* Notifications */}
            <Link to="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="relative text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                  >
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            
            <Link to="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}