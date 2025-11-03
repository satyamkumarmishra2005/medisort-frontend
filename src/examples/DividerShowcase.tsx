import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Divider } from '../components/ui/divider'

const DividerShowcase: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Divider Showcase</h1>
        <p className="text-muted-foreground">Different variants of the enhanced divider component</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Elegant Variant</CardTitle>
            <CardDescription>Perfect for authentication forms and premium interfaces</CardDescription>
          </CardHeader>
          <CardContent>
            <Divider text="or continue with" variant="elegant" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modern Variant</CardTitle>
            <CardDescription>Clean and contemporary with primary color accents</CardDescription>
          </CardHeader>
          <CardContent>
            <Divider text="or continue with" variant="modern" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gradient Variant</CardTitle>
            <CardDescription>Sophisticated with subtle gradient effects</CardDescription>
          </CardHeader>
          <CardContent>
            <Divider text="or continue with" variant="gradient" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minimal Variant</CardTitle>
            <CardDescription>Simple and clean for subtle separations</CardDescription>
          </CardHeader>
          <CardContent>
            <Divider text="or continue with" variant="minimal" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Variant</CardTitle>
            <CardDescription>Standard divider for general use</CardDescription>
          </CardHeader>
          <CardContent>
            <Divider text="or continue with" variant="default" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Text Examples</CardTitle>
            <CardDescription>Different text options with the elegant variant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Divider text="or" variant="elegant" />
            <Divider text="alternative" variant="elegant" />
            <Divider text="choose another option" variant="elegant" />
            <Divider text="more options" variant="modern" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DividerShowcase