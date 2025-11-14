import React, { useState } from 'react'
import { Navigation } from './navigation'
import { Sidebar } from './sidebar'
import { RefillNotificationHandler } from '../RefillNotificationHandler'
import { cn } from '../../lib/utils'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  showNavigation?: boolean
  showSidebar?: boolean
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className, 
  showNavigation = true,
  showSidebar = true
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {showNavigation && <Navigation />}
        <main className={cn("container mx-auto px-4 py-8", className)}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {showNavigation && <Navigation />}
        <main className={cn("flex-1 p-6", className)}>
          {children}
        </main>
      </div>

      {/* Refill Notification Handler */}
      <RefillNotificationHandler />
    </div>
  )
}