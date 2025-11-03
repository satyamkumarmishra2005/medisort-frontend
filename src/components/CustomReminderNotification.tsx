import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Clock, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface CustomReminderNotification {
  id: number
  title: string
  time: string
  category: string
  notes?: string
  reminder: any
}

interface Props {
  notification: CustomReminderNotification
  onDismiss: (id: number) => void
  onComplete?: (id: number) => void
}

export const CustomReminderNotification: React.FC<Props> = ({
  notification,
  onDismiss,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(true)

  const categories = [
    { value: 'health', label: 'Health', icon: '🏥', color: 'bg-green-100 text-green-800' },
    { value: 'medication', label: 'Medication', icon: '💊', color: 'bg-blue-100 text-blue-800' },
    { value: 'exercise', label: 'Exercise', icon: '🏃', color: 'bg-orange-100 text-orange-800' },
    { value: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'bg-purple-100 text-purple-800' },
    { value: 'appointment', label: 'Appointment', icon: '📅', color: 'bg-red-100 text-red-800' },
    { value: 'personal', label: 'Personal', icon: '🧘', color: 'bg-pink-100 text-pink-800' },
    { value: 'other', label: 'Other', icon: '📝', color: 'bg-gray-100 text-gray-800' }
  ]

  const getCategoryInfo = (category: string) => {
    return categories.find(c => c.value === category) || categories[categories.length - 1]
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  const handleComplete = () => {
    // Add a brief celebration animation
    setIsVisible(false)
    
    // Show a beautiful success message
    const successDiv = document.createElement('div')
    successDiv.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-2xl">🎉</div>
        <div>
          <div class="font-bold text-white">Awesome!</div>
          <div class="text-sm text-emerald-100">Reminder completed</div>
        </div>
      </div>
    `
    successDiv.className = 'fixed top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 backdrop-blur-sm border border-white/20'
    successDiv.style.animation = 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 1.7s forwards'
    document.body.appendChild(successDiv)
    
    // Add CSS animation if not already present
    if (!document.getElementById('celebration-styles')) {
      const style = document.createElement('style')
      style.id = 'celebration-styles'
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
      `
      document.head.appendChild(style)
    }
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv)
      }
    }, 2000)
    
    if (onComplete) {
      onComplete(notification.id)
    }
    
    setTimeout(() => onDismiss(notification.id), 300)
  }

  const categoryInfo = getCategoryInfo(notification.category)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8, rotateY: 15 }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotateY: 0,
            boxShadow: [
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              '0 32px 64px -12px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            ]
          }}
          exit={{ opacity: 0, x: 300, scale: 0.8, rotateY: -15 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.23, 1, 0.32, 1],
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse'
            }
          }}
          className="relative min-w-[360px] max-w-[440px] rounded-2xl overflow-hidden backdrop-blur-xl border border-white/20"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {/* Animated background patterns */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)'
            }}
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                }}
                animate={{
                  y: [-10, -30, -10],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3
                }}
              />
            ))}
          </div>
          
          {/* Main content */}
          <div className="relative z-10 p-6 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Bell className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <span className="font-bold text-white text-sm tracking-wide">REMINDER ALERT</span>
                <div className="text-xs text-white/80 font-medium">MediSort Health</div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="text-center">
              <motion.div 
                className="text-6xl mb-4 filter drop-shadow-lg"
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 8, -8, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {categoryInfo.icon}
              </motion.div>
              <h3 className="font-bold text-white text-xl mb-4 leading-tight tracking-wide drop-shadow-md">
                {notification.title}
              </h3>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full border border-white/30">
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold">{notification.time}</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full border border-white/30">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    {categoryInfo.label.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {notification.notes && (
              <motion.div 
                className="bg-white/15 backdrop-blur-sm border border-white/30 p-4 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-white/90 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span> Note:
                </p>
                <p className="text-sm text-white/80 leading-relaxed">{notification.notes}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <motion.button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm tracking-wide">✨ DONE!</span>
              </motion.button>
              
              <motion.button
                onClick={handleDismiss}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-xl backdrop-blur-sm border border-white/30 hover:border-white/50 transition-all duration-300 flex items-center justify-center"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm tracking-wide">LATER</span>
              </motion.button>
            </div>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}