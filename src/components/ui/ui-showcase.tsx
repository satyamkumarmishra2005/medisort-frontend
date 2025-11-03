import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  Activity, 
  Users, 
  Calendar,
  Bell,
  Settings,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Badge, NotificationBadge, StatusBadge } from './badge'
import { Progress, CircularProgress } from './progress'
import { StatsCard, MetricsGrid } from './stats-card'
import { LoadingSpinner, LoadingSkeleton, LoadingOverlay } from './loading'
import { AnimatedBackground } from './animated-background'

const UIShowcase: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const sampleMetrics = [
    {
      title: 'Total Patients',
      value: '2,847',
      change: { value: 12, type: 'increase' as const, period: 'vs last month' },
      icon: Users,
      variant: 'healthcare' as const
    },
    {
      title: 'Appointments Today',
      value: '24',
      change: { value: 8, type: 'increase' as const, period: 'vs yesterday' },
      icon: Calendar,
      variant: 'success' as const
    },
    {
      title: 'Active Treatments',
      value: '156',
      change: { value: 3, type: 'decrease' as const, period: 'vs last week' },
      icon: Activity,
      variant: 'warning' as const
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 relative overflow-hidden">
      <AnimatedBackground variant="healthcare" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-healthcare-blue to-healthcare-green bg-clip-text text-transparent mb-4">
            Enhanced UI Components
          </h1>
          <p className="text-muted-foreground text-lg">
            Beautiful, accessible, and animated healthcare UI components
          </p>
        </motion.div>

        {/* Buttons Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="p-8">
            <CardHeader>
              <CardTitle>Enhanced Buttons</CardTitle>
              <CardDescription>
                Buttons with improved animations, hover effects, and healthcare variants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <Button variant="healthcare-gradient" size="lg">
                  Primary Action
                </Button>
                <Button variant="healthcare" size="lg">
                  Healthcare Blue
                </Button>
                <Button variant="healthcare-green" size="lg">
                  Success Action
                </Button>
                <Button variant="glass" size="lg">
                  Glass Effect
                </Button>
                <Button variant="premium" size="lg">
                  Premium Style
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button variant="healthcare-outline" size="default">
                  Outlined
                </Button>
                <Button variant="ghost" size="default">
                  Ghost
                </Button>
                <Button variant="outline" size="default">
                  Standard Outline
                </Button>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button variant="healthcare" size="icon">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="healthcare-green" size="icon-lg">
                  <Activity className="w-5 h-5" />
                </Button>
                <Button variant="glass" size="icon-sm">
                  <Bell className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Cards Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass" className="p-8">
            <CardHeader>
              <CardTitle>Enhanced Cards</CardTitle>
              <CardDescription>
                Cards with glassmorphism, animations, and premium variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Elevated Card</CardTitle>
                    <CardDescription>With hover lift effect</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This card has enhanced shadows and hover animations.
                    </p>
                  </CardContent>
                </Card>

                <Card variant="premium">
                  <CardHeader>
                    <CardTitle className="text-lg">Premium Card</CardTitle>
                    <CardDescription>With glow animation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Premium styling with pulse glow effect.
                    </p>
                  </CardContent>
                </Card>

                <Card variant="floating">
                  <CardHeader>
                    <CardTitle className="text-lg">Floating Card</CardTitle>
                    <CardDescription>With float animation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Gentle floating animation for attention.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Inputs Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass" className="p-8">
            <CardHeader>
              <CardTitle>Enhanced Inputs</CardTitle>
              <CardDescription>
                Input fields with icons, animations, and premium styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Premium Input</label>
                  <Input
                    variant="premium"
                    placeholder="Enter your email"
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Glass Input</label>
                  <Input
                    variant="glass"
                    placeholder="Search..."
                    icon={<Settings className="w-4 h-4" />}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password Input</label>
                  <Input
                    variant="premium"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    icon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-healthcare-blue transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Floating Input</label>
                  <Input
                    variant="floating"
                    inputSize="lg"
                    placeholder="Large floating input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Progress Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="glass" className="p-8">
            <CardHeader>
              <CardTitle>Progress Indicators</CardTitle>
              <CardDescription>
                Animated progress bars and circular indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Healthcare Progress</label>
                  <Progress variant="healthcare" value={75} size="lg" showValue animated />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gradient Progress</label>
                  <Progress variant="gradient" value={60} size="md" animated />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Success Progress</label>
                  <Progress variant="success" value={90} size="sm" />
                </div>
              </div>

              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <CircularProgress value={85} variant="healthcare" size={120} />
                  <p className="text-sm text-muted-foreground mt-2">Healthcare</p>
                </div>
                <div className="text-center">
                  <CircularProgress value={65} variant="gradient" size={120} />
                  <p className="text-sm text-muted-foreground mt-2">Gradient</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Badges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="glass" className="p-8">
            <CardHeader>
              <CardTitle>Enhanced Badges</CardTitle>
              <CardDescription>
                Badges with animations, notifications, and status indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <Badge variant="healthcare" animated>Healthcare</Badge>
                <Badge variant="success" animated>Success</Badge>
                <Badge variant="warning" animated>Warning</Badge>
                <Badge variant="glass" animated>Glass</Badge>
                <Badge variant="pulse">Live</Badge>
              </div>

              <div className="flex items-center space-x-8">
                <div className="relative">
                  <Button variant="outline" size="icon">
                    <Bell className="w-4 h-4" />
                  </Button>
                  <NotificationBadge count={5} variant="healthcare" />
                </div>

                <div className="relative">
                  <Button variant="outline" size="icon">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <NotificationBadge count={123} variant="danger" />
                </div>

                <div className="flex items-center space-x-2">
                  <StatusBadge status="online" size="md" />
                  <span className="text-sm">Online</span>
                </div>

                <div className="flex items-center space-x-2">
                  <StatusBadge status="busy" size="md" />
                  <span className="text-sm">Busy</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Stats Cards Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="glass" className="p-8">
            <CardHeader>
              <CardTitle>Statistics Cards</CardTitle>
              <CardDescription>
                Animated metric cards with icons and trend indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsGrid metrics={sampleMetrics} columns={3} />
            </CardContent>
          </Card>
        </motion.section>

        {/* Loading States Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card variant="glass" className="p-8">
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
              <CardDescription>
                Various loading indicators and skeleton states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <LoadingSpinner variant="healthcare" size="lg" />
                  <p className="text-sm text-muted-foreground mt-2">Healthcare</p>
                </div>
                <div className="text-center">
                  <LoadingSpinner variant="pulse" size="lg" />
                  <p className="text-sm text-muted-foreground mt-2">Pulse</p>
                </div>
                <div className="text-center">
                  <LoadingSpinner variant="dots" size="lg" />
                  <p className="text-sm text-muted-foreground mt-2">Dots</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Loading Skeletons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LoadingSkeleton variant="text" lines={3} />
                    <LoadingSkeleton variant="avatar" />
                    <LoadingSkeleton variant="button" />
                  </CardContent>
                </Card>

                <LoadingOverlay isLoading={isLoading} loadingText="Processing...">
                  <Card>
                    <CardHeader>
                      <CardTitle>Loading Overlay</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click the button to see the loading overlay in action.
                      </p>
                      <Button 
                        onClick={() => {
                          setIsLoading(true)
                          setTimeout(() => setIsLoading(false), 3000)
                        }}
                        variant="healthcare"
                      >
                        Trigger Loading
                      </Button>
                    </CardContent>
                  </Card>
                </LoadingOverlay>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  )
}

export { UIShowcase }