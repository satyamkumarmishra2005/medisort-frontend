import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePhoneNumberCollection } from '../hooks/usePhoneNumberCollection'
import { useToast } from '../components/ui/toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Phone, Heart, Loader2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatIndianPhoneNumber, validateIndianPhoneNumber, cleanPhoneNumber } from '../utils/phoneFormatter'

const PhoneNumberCollection: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [errors, setErrors] = useState<{ phone?: string }>({})
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { isLoading, submitPhoneNumber } = usePhoneNumberCollection()

  const validatePhoneNumber = (phone: string): boolean => {
    if (!validateIndianPhoneNumber(phone)) {
      setErrors({ phone: 'Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)' })
      return false
    }
    
    setErrors({})
    return true
  }

  const formatPhoneNumber = (value: string): string => {
    return formatIndianPhoneNumber(value)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    
    // Clear errors when user starts typing
    if (errors.phone) {
      setErrors({})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePhoneNumber(phoneNumber)) {
      return
    }

    // Get the cleaned phone number for API submission (includes country code)
    const cleanPhone = cleanPhoneNumber(phoneNumber)
    const success = await submitPhoneNumber(cleanPhone)

    if (success) {
      // Redirect to dashboard
      navigate('/dashboard', { replace: true })
    }
  }

  const handleSkip = () => {
    addToast({
      type: 'info',
      title: 'Phone Number Skipped',
      description: 'You can add your phone number later in your profile settings.',
      duration: 4000
    })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 healthcare-shadow">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-healthcare-gradient rounded-full mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Complete Your Profile
            </h1>
            <p className="text-muted-foreground">
              We need your phone number to provide better healthcare services and send you important updates.
            </p>
          </div>

          {/* Phone Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
              <Phone className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="+91 98765 43210"
                className={errors.phone ? 'border-destructive' : ''}
                maxLength={17} // +91 XXXXX XXXXX format
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="w-full"
              >
                Skip for Now
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-xs text-muted-foreground text-center">
            Your phone number will be used for appointment reminders, emergency contact purposes, and important health notifications.
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default PhoneNumberCollection