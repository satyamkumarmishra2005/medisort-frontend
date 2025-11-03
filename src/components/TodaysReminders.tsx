import React from 'react'

interface TodaysRemindersProps {
  className?: string
}

export const TodaysReminders: React.FC<TodaysRemindersProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      {/* This component is now empty - Quick Actions moved to MedicineDashboard */}
    </div>
  )
}