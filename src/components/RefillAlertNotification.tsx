import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { Badge } from './ui/badge'
import { SimpleRefillAlert } from '../services/simpleRefillService'

interface Props {
  alert: SimpleRefillAlert
  onDismiss: (id: number) => void
  onRefilled?: (id: number) => void
}

export const RefillAlertNotification: React.FC<Props> = ({
  alert,
  onDismiss,
  onRefilled
}) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(alert.id), 300)
  }

  const handleRefilled = () => {
    // Add a brief celebration animation
    setIsVisible(false)
    
    // Show a beautiful success message
    const successDiv = document.createElement('div')
    successDiv.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-2xl">📦</div>
        <div>
          <div class="font-bold text-white">Medicine Refilled!</div>
          <div class="text-sm text-emerald-100">${alert.medicineName} stock updated</div>
        </div>
      </div>
    `
    successDiv.className = 'fixed top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 backdrop-blur-sm border border-white/20'
    successDiv.style.animation = 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 1.7s forwards'
    document.body.appendChild(successDiv)
    
    // Add CSS animation if not already present
    if (!document.getElementById('refill-celebration-styles')) {
      const style = document.createElement('style')
      style.id = 'refill-celebration-styles'
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
    
    if (onRefilled) {
      onRefilled(alert.id)
    }
    
    setTimeout(() => onDismiss(alert.id), 300)
  }

  const getAlertColor = () => {
    if (alert.daysRemaining <= 0) {
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' // Red gradient
    } else if (alert.daysRemaining === 1) {
      return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' // Orange gradient
    } else {
      return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' // Yellow gradient
    }
  }

  const getAlertIcon = () => {
    if (alert.daysRemaining <= 0) {
      return <AlertTriangle className="w-6 h-6 text-white" />
    } else {
      return <Package className="w-6 h-6 text-white" />
    }
  }

  const getAlertTitle = () => {
    if (alert.daysRemaining <= 0) {
      return 'Medicine Finished!'
    } else if (alert.daysRemaining === 1) {
      return 'Urgent Refill Needed'
    } else {
      return 'Refill Reminder'
    }
  }

  const getAlertMessage = () => {
    if (alert.daysRemaining <= 0) {
      return 'Please refill immediately'
    } else if (alert.daysRemaining === 1) {
      return 'Refill today to avoid running out'
    } else {
      return `Plan to refill in the next ${alert.daysRemaining} days`
    }
  }

  const getAlertBadge = () => {
    if (alert.daysRemaining <= 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Out of Stock</Badge>
    } else if (alert.daysRemaining === 1) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">1 Day Left</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{alert.daysRemaining} Days Left</Badge>
    }
  }

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
              '0 32px 64px -12px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
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
            background: getAlertColor(),
          }}
        >
          {/* Animated background patterns */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
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
                  {getAlertIcon()}
                </motion.div>
                <div>
                  <span className="font-bold text-white text-sm tracking-wide">REFILL ALERT</span>
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
                  📦
                </motion.div>
                <h3 className="font-bold text-white text-xl mb-2 leading-tight tracking-wide drop-shadow-md">
                  {alert.medicineName}
                </h3>
                <p className="text-white/90 text-sm mb-4">{alert.dosage}</p>
                
                <div className="flex items-center justify-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full border border-white/30">
                    <Package className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold">{alert.currentStock} doses left</span>
                  </div>
                  {getAlertBadge()}
                </div>

                <h4 className="font-bold text-white text-lg mb-2">{getAlertTitle()}</h4>
                <p className="text-white/90 text-sm">{getAlertMessage()}</p>
              </div>

              {/* Expected end date */}
              <motion.div 
                className="bg-white/15 backdrop-blur-sm border border-white/30 p-4 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-white/90 font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Expected to run out:
                </p>
                <p className="text-sm text-white/80 leading-relaxed">
                  {alert.expectedEndDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </motion.div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  onClick={handleRefilled}
                  className="flex-1 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm border border-white/20"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm tracking-wide">REFILLED</span>
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