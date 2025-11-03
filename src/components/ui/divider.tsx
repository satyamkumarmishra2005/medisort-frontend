import React from 'react'
import { cn } from '../../lib/utils'

interface DividerProps {
  text?: string
  className?: string
  variant?: 'default' | 'elegant' | 'minimal' | 'modern' | 'gradient' | 'premium' | 'glowing'
}

export const Divider: React.FC<DividerProps> = ({ 
  text = 'or', 
  className,
  variant = 'default'
}) => {
  if (variant === 'elegant') {
    return (
      <div className={cn("relative my-8", className)}>
        <div className="flex items-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-border/20"></div>
          <div className="mx-4">
            <span className="inline-flex items-center px-4 py-2 text-xs font-medium text-muted-foreground/80 bg-muted/20 border border-border/40 rounded-full shadow-sm backdrop-blur-sm hover:bg-muted/30 transition-colors duration-200">
              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full mr-2"></span>
              {text}
              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full ml-2"></span>
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/60 to-border/20"></div>
        </div>
      </div>
    )
  }

  if (variant === 'modern') {
    return (
      <div className={cn("relative my-6", className)}>
        <div className="flex items-center">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-primary/10 rounded-full"></div>
          <div className="mx-6">
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-primary/80 bg-primary/5 border border-primary/20 rounded-lg shadow-sm">
              {text}
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent via-primary/20 to-primary/10 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={cn("relative my-7", className)}>
        <div className="flex items-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted-foreground/30 to-muted-foreground/10"></div>
          <div className="mx-5">
            <div className="relative">
              <span className="inline-block px-4 py-2 text-xs font-medium text-muted-foreground bg-gradient-to-r from-background via-muted/10 to-background border border-border/50 rounded-full shadow-lg backdrop-blur-sm">
                {text}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-full blur-sm -z-10"></div>
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-muted-foreground/30 to-muted-foreground/10"></div>
        </div>
      </div>
    )
  }

  if (variant === 'premium') {
    return (
      <div className={cn("relative my-8", className)}>
        <div className="flex items-center">
          {/* Left line with subtle gradient and dots */}
          <div className="flex-1 flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/30"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full mx-3"></div>
            <div className="w-0.5 h-0.5 bg-white/30 rounded-full"></div>
          </div>
          
          {/* Center text with dark theme styling */}
          <div className="mx-8">
            <div className="relative">
              <span className="inline-flex items-center px-6 py-2 text-sm font-medium text-white/80 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-teal-400/60 rounded-full mr-3"></span>
                {text}
                <span className="w-1.5 h-1.5 bg-teal-400/60 rounded-full ml-3"></span>
              </span>
            </div>
          </div>
          
          {/* Right line with subtle gradient and dots */}
          <div className="flex-1 flex items-center">
            <div className="w-0.5 h-0.5 bg-white/30 rounded-full"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full mx-3"></div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/30"></div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'glowing') {
    return (
      <div className={cn("relative my-8", className)}>
        <div className="flex items-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-purple-400/30 dark:from-transparent dark:via-purple-600/50 dark:to-purple-500/30"></div>
          <div className="mx-6">
            <div className="relative">
              <span className="inline-flex items-center px-6 py-3 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50/90 via-white/90 to-purple-50/90 dark:from-purple-900/90 dark:via-slate-800/90 dark:to-purple-900/90 border border-purple-200/60 dark:border-purple-700/60 rounded-full shadow-2xl backdrop-blur-md">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mr-3 shadow-lg shadow-purple-400/50 animate-pulse"></span>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent font-bold">
                    {text}
                  </span>
                  <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full ml-3 shadow-lg shadow-pink-400/50 animate-pulse delay-300"></span>
                </span>
              </span>
              {/* Animated glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 rounded-full blur-lg -z-10 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-purple-400/10 rounded-full blur-2xl -z-20 animate-pulse delay-1000"></div>
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-purple-300/50 to-purple-400/30 dark:from-transparent dark:via-purple-600/50 dark:to-purple-500/30"></div>
        </div>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("relative my-6", className)}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground/70 font-medium">
            {text}
          </span>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("relative my-6", className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  )
}