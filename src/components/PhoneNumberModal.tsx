import React, { useState } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useToast } from './ui/toast'
import { Phone, Loader2 } from 'lucide-react'
import { formatIndianPhoneNumber, validateIndianPhoneNumber, cleanPhoneNumber } from '../utils/phoneFormatter'

interface PhoneNumberModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (phoneNumber: string) => Promise<void>
    isLoading?: boolean
}

const PhoneNumberModal: React.FC<PhoneNumberModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false
}) => {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [errors, setErrors] = useState<{ phone?: string }>({})
    const { addToast } = useToast()

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

        try {
            // Get the cleaned phone number for API submission (includes country code)
            const cleanPhone = cleanPhoneNumber(phoneNumber)
            await onSubmit(cleanPhone)
        } catch (error) {
            console.error('Error submitting phone number:', error)
            addToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to save phone number. Please try again.',
                duration: 5000
            })
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Complete Your Profile"
            className="max-w-md"
        >
            <div className="space-y-4">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                        <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        We need your phone number to complete your profile and provide better healthcare services.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            variant={errors.phone ? "default" : "premium"}
                            icon={<Phone className="w-4 h-4" />}
                            className={errors.phone ? 'border-destructive' : ''}
                            maxLength={17} // +91 XXXXX XXXXX format
                            disabled={isLoading}
                        />
                        {errors.phone && (
                            <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Skip for Now
                        </Button>
                        <Button
                            type="submit"
                            variant="healthcare-gradient"
                            disabled={isLoading || !phoneNumber.trim()}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </div>
                </form>

                <div className="text-xs text-muted-foreground text-center">
                    Your phone number will be used for appointment reminders and emergency contact purposes.
                </div>
            </div>
        </Modal>
    )
}

export default PhoneNumberModal