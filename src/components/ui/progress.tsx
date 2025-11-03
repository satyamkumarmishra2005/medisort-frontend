import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'healthcare' | 'gradient'
    size?: 'sm' | 'md' | 'lg'
    showValue?: boolean
    animated?: boolean
  }
>(({ className, value, variant = 'default', size = 'md', showValue = false, animated = true, ...props }, ref) => {
  const getIndicatorColor = () => {
    switch (variant) {
      case 'success':
        return 'bg-healthcare-green'
      case 'warning':
        return 'bg-yellow-500'
      case 'danger':
        return 'bg-red-500'
      case 'healthcare':
        return 'bg-healthcare-blue'
      case 'gradient':
        return 'healthcare-gradient'
      default:
        return 'bg-primary'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2'
      case 'lg':
        return 'h-6'
      default:
        return 'h-4'
    }
  }

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary/50 backdrop-blur-sm",
          getSizeClasses(),
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 rounded-full transition-all duration-500 ease-out relative overflow-hidden",
            getIndicatorColor(),
            animated && "animate-shimmer"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        >
          {animated && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white mix-blend-difference">
            {Math.round(value || 0)}%
          </span>
        </div>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Enhanced circular progress component
const CircularProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    size?: number
    strokeWidth?: number
    variant?: 'default' | 'healthcare' | 'gradient'
    showValue?: boolean
  }
>(({ className, value = 0, size = 120, strokeWidth = 8, variant = 'default', showValue = true, ...props }, ref) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getStrokeColor = () => {
    switch (variant) {
      case 'healthcare':
        return 'stroke-healthcare-blue'
      case 'gradient':
        return 'stroke-healthcare-blue' // Will be overridden by gradient
      default:
        return 'stroke-primary'
    }
  }

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {variant === 'gradient' && (
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--healthcare-blue))" />
              <stop offset="100%" stopColor="hsl(var(--healthcare-green))" />
            </linearGradient>
          </defs>
        )}
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variant === 'gradient' ? 'url(#progress-gradient)' : undefined}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={variant !== 'gradient' ? getStrokeColor() : ''}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray,
          }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {Math.round(value)}%
          </span>
        </div>
      )}
    </div>
  )
})
CircularProgress.displayName = "CircularProgress"

export { Progress, CircularProgress }