import React from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { ThemeToggle } from './theme-toggle'
import { Heart, Shield, Activity } from 'lucide-react'

export const ThemeDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Theme Demo</h1>
        <ThemeToggle />
      </div>

      {/* Button Variants */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>Different button styles with healthcare theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="healthcare">Healthcare</Button>
            <Button variant="healthcare-outline">Healthcare Outline</Button>
            <Button variant="healthcare-green">Healthcare Green</Button>
            <Button variant="healthcare-gradient">Healthcare Gradient</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </CardContent>
      </Card>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Default Card
            </CardTitle>
            <CardDescription>Standard card with shadow</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This is a default card variant.</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Glass Card
            </CardTitle>
            <CardDescription>Glass morphism effect</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This card has a glass effect with backdrop blur.</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-secondary-foreground" />
              Elevated Card
            </CardTitle>
            <CardDescription>Enhanced shadow with hover effect</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This card has enhanced shadows and hover effects.</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Elements */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input fields with healthcare theming</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Email address" type="email" />
            <Input placeholder="Password" type="password" />
            <Input placeholder="Phone number" type="tel" />
            <Input placeholder="Date of birth" type="date" />
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Healthcare Color Palette</CardTitle>
          <CardDescription>Theme colors that adapt to light/dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-primary rounded-lg"></div>
              <p className="text-sm font-medium text-foreground">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-accent rounded-lg"></div>
              <p className="text-sm font-medium text-foreground">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-secondary rounded-lg"></div>
              <p className="text-sm font-medium text-foreground">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 healthcare-gradient rounded-lg"></div>
              <p className="text-sm font-medium text-foreground">Gradient</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}