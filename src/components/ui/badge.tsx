import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:scale-105",
        outline: "text-foreground border-border hover:bg-accent hover:scale-105",
        success:
          "border-transparent bg-healthcare-green text-white hover:bg-healthcare-green-dark hover:scale-105 shadow-lg shadow-healthcare-green/25",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105 shadow-lg shadow-yellow-500/25",
        info:
          "border-transparent bg-healthcare-blue text-white hover:bg-healthcare-blue-dark hover:scale-105 shadow-lg shadow-healthcare-blue/25",
        healthcare:
          "healthcare-gradient text-white hover:opacity-90 hover:scale-105 shadow-lg shadow-healthcare-blue/30",
        glass:
          "glass-card text-foreground hover:bg-background/90 hover:scale-105 backdrop-blur-md",
        pulse:
          "border-transparent bg-healthcare-blue text-white animate-pulse-glow",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  animated?: boolean
  pulse?: boolean
  count?: number
}

function Badge({ className, variant, size, animated = false, pulse = false, count, children, ...props }: BadgeProps) {
  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          badgeVariants({ variant, size }), 
          pulse && 'animate-pulse',
          className
        )}
      >
        {count !== undefined ? (count > 99 ? '99+' : count) : children}
      </motion.div>
    )
  }

  return (
    <div 
      className={cn(
        badgeVariants({ variant, size }), 
        pulse && 'animate-pulse',
        className
      )} 
      {...props}
    >
      {count !== undefined ? (count > 99 ? '99+' : count) : children}
    </div>
  )
}

// Notification Badge Component
interface NotificationBadgeProps {
  count: number
  max?: number
  showZero?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'healthcare' | 'success' | 'warning' | 'danger'
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  className,
  size = 'md',
  variant = 'default'
}) => {
  if (count === 0 && !showZero) return null

  const sizeClasses = {
    sm: 'min-w-[16px] h-4 text-xs',
    md: 'min-w-[20px] h-5 text-xs',
    lg: 'min-w-[24px] h-6 text-sm'
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    healthcare: 'bg-healthcare-blue text-white',
    success: 'bg-healthcare-green text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white'
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'absolute -top-2 -right-2 flex items-center justify-center rounded-full font-bold',
        sizeClasses[size],
        variantClasses[variant],
        'shadow-lg',
        className
      )}
    >
      {count > max ? `${max}+` : count}
    </motion.div>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  animated = true,
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const statusClasses = {
    online: 'bg-healthcare-green',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  }

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'rounded-full border-2 border-background',
        sizeClasses[size],
        statusClasses[status]
      )} />
      {animated && status === 'online' && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full bg-healthcare-green',
            sizeClasses[size]
          )}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  )
}

export { Badge, badgeVariants, NotificationBadge, StatusBadge }