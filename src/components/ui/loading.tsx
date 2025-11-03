import React from 'react'
import { cn } from '../../lib/utils'
import { Loader2, Heart } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'healthcare' | 'pulse' | 'dots'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  if (variant === 'healthcare') {
    return (
      <div className={cn('animate-pulse-glow', className)}>
        <Heart className={cn(sizeClasses[size], 'text-healthcare-blue animate-pulse')} />
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-healthcare-blue animate-pulse',
              size === 'sm' && 'w-2 h-2',
              size === 'md' && 'w-3 h-3',
              size === 'lg' && 'w-4 h-4',
              size === 'xl' && 'w-6 h-6'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-healthcare-blue',
              size === 'sm' && 'w-1 h-1',
              size === 'md' && 'w-2 h-2',
              size === 'lg' && 'w-3 h-3',
              size === 'xl' && 'w-4 h-4'
            )}
            style={{
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <Loader2 className={cn(sizeClasses[size], 'animate-spin text-healthcare-blue', className)} />
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  variant?: 'text' | 'card' | 'avatar' | 'button'
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 3,
  variant = 'text'
}) => {
  if (variant === 'card') {
    return (
      <div className={cn('animate-pulse space-y-4 p-4', className)}>
        <div className="h-4 bg-muted rounded loading-skeleton w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded loading-skeleton" />
          <div className="h-3 bg-muted rounded loading-skeleton w-5/6" />
        </div>
      </div>
    )
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('flex items-center space-x-4', className)}>
        <div className="w-12 h-12 bg-muted rounded-full loading-skeleton" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded loading-skeleton w-1/2" />
          <div className="h-3 bg-muted rounded loading-skeleton w-1/3" />
        </div>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <div className={cn('h-10 bg-muted rounded-md loading-skeleton w-24', className)} />
    )
  }

  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded loading-skeleton',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  loadingText?: string
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  className,
  loadingText = 'Loading...'
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-scale">
          <div className="text-center space-y-4">
            <LoadingSpinner variant="healthcare" size="lg" />
            <p className="text-sm text-muted-foreground">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export { LoadingSpinner, LoadingSkeleton, LoadingOverlay }