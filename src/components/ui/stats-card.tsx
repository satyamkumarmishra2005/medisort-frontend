import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Card } from './card'

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period?: string
  }
  icon?: LucideIcon
  variant?: 'default' | 'healthcare' | 'success' | 'warning' | 'danger'
  className?: string
  animated?: boolean
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  variant = 'default',
  className,
  animated = true
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'healthcare':
        return {
          card: 'border-healthcare-blue/20 bg-gradient-to-br from-healthcare-blue/5 to-transparent',
          icon: 'text-healthcare-blue bg-healthcare-blue/10',
          value: 'text-healthcare-blue'
        }
      case 'success':
        return {
          card: 'border-healthcare-green/20 bg-gradient-to-br from-healthcare-green/5 to-transparent',
          icon: 'text-healthcare-green bg-healthcare-green/10',
          value: 'text-healthcare-green'
        }
      case 'warning':
        return {
          card: 'border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent',
          icon: 'text-yellow-500 bg-yellow-500/10',
          value: 'text-yellow-500'
        }
      case 'danger':
        return {
          card: 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent',
          icon: 'text-red-500 bg-red-500/10',
          value: 'text-red-500'
        }
      default:
        return {
          card: 'border-border',
          icon: 'text-primary bg-primary/10',
          value: 'text-foreground'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
    >
      <Card 
        variant="elevated" 
        className={cn(
          'p-6 transition-all duration-300 hover:shadow-lg',
          styles.card,
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <motion.p 
              className={cn('text-3xl font-bold', styles.value)}
              initial={animated ? { scale: 0.5 } : undefined}
              animate={animated ? { scale: 1 } : undefined}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {value}
            </motion.p>
            
            {change && (
              <motion.div 
                className="flex items-center mt-2"
                initial={animated ? { opacity: 0, x: -10 } : undefined}
                animate={animated ? { opacity: 1, x: 0 } : undefined}
                transition={{ delay: 0.4 }}
              >
                <span className={cn(
                  'text-sm font-medium',
                  change.type === 'increase' ? 'text-healthcare-green' : 'text-red-500'
                )}>
                  {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
                </span>
                {change.period && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {change.period}
                  </span>
                )}
              </motion.div>
            )}
          </div>
          
          {Icon && (
            <motion.div 
              className={cn(
                'p-3 rounded-full',
                styles.icon
              )}
              initial={animated ? { rotate: -180, scale: 0 } : undefined}
              animate={animated ? { rotate: 0, scale: 1 } : undefined}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.1 }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

interface MetricsGridProps {
  metrics: Array<Omit<StatsCardProps, 'animated'>>
  columns?: 1 | 2 | 3 | 4
  className?: string
  animated?: boolean
}

const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  columns = 3,
  className,
  animated = true
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn(
      'grid gap-6',
      gridCols[columns],
      className
    )}>
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={animated ? { opacity: 0, y: 20 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: index * 0.1 }}
        >
          <StatsCard {...metric} animated={false} />
        </motion.div>
      ))}
    </div>
  )
}

export { StatsCard, MetricsGrid }