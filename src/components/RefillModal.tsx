import React, { useState } from 'react'
import { X, Package, AlertTriangle } from 'lucide-react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Medicine } from '../services/medicineApi'

interface RefillModalProps {
  isOpen: boolean
  onClose: () => void
  medicine: Medicine | null
  onRefill: (quantity: number) => Promise<void>
  isLoading?: boolean
}

export const RefillModal: React.FC<RefillModalProps> = ({
  isOpen,
  onClose,
  medicine,
  onRefill,
  isLoading = false
}) => {
  const [refillQuantity, setRefillQuantity] = useState<number>(0)
  const [error, setError] = useState<string>('')

  // Early return if medicine is null
  if (!medicine) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (refillQuantity <= 0) {
      setError('Refill quantity must be greater than 0')
      return
    }

    try {
      setError('')
      await onRefill(refillQuantity)
      setRefillQuantity(0)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refill medicine')
    }
  }

  const handleClose = () => {
    setRefillQuantity(0)
    setError('')
    onClose()
  }

  const currentStock = medicine.currentStock || 0
  const estimatedDaysRemaining = medicine.dosesPerDay > 0 
    ? Math.floor(currentStock / medicine.dosesPerDay) 
    : 0

  const newStock = currentStock + refillQuantity
  const newDaysRemaining = medicine.dosesPerDay > 0 
    ? Math.floor(newStock / medicine.dosesPerDay) 
    : 0

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      className="max-w-md"
    >
      <div className="p-6 -m-6 rounded-lg bg-gradient-to-br from-background via-background to-muted/20" style={{ 
        margin: '-1.5rem', 
        padding: '1.5rem',
        minHeight: '100%'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Refill Medicine</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medicine Info */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6 border border-border">
          <h3 className="font-medium text-foreground">{medicine.name}</h3>
          <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Stock:</span>
              <span className="font-medium text-foreground">{currentStock} units</span>
            </div>
            {estimatedDaysRemaining > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Remaining:</span>
                <span className={`font-medium ${
                  estimatedDaysRemaining <= 3 ? 'text-red-500' : 
                  estimatedDaysRemaining <= 7 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {estimatedDaysRemaining} days
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Refill Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="refillQuantity" className="block text-sm font-medium text-foreground mb-2">
              Refill Quantity *
            </label>
            <Input
              id="refillQuantity"
              type="number"
              min="1"
              value={refillQuantity || ''}
              onChange={(e) => setRefillQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter number of units to add"
              className={error ? 'border-red-500' : ''}
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Preview */}
          {refillQuantity > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">After Refill:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">New Stock:</span>
                  <span className="font-medium text-green-800">{newStock} units</span>
                </div>
                {newDaysRemaining > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Days Supply:</span>
                    <span className="font-medium text-green-800">{newDaysRemaining} days</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || refillQuantity <= 0}
              className="flex-1"
              variant="healthcare"
            >
              {isLoading ? 'Refilling...' : '✅ Mark as Refilled'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}