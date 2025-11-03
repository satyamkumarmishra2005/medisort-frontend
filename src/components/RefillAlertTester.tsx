import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Package, AlertTriangle, RefreshCw, TestTube } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { useToast } from './ui/toast'
import { medicineApi } from '../services/medicineApi'
import { refillNotificationService } from '../services/refillNotificationService'

export const RefillAlertTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [medicines, setMedicines] = useState<any[]>([])
  const { addToast } = useToast()

  const loadMedicines = async () => {
    try {
      const allMedicines = await medicineApi.getMedicines()
      setMedicines(allMedicines)
    } catch (error) {
      console.error('Error loading medicines:', error)
    }
  }

  React.useEffect(() => {
    loadMedicines()
  }, [])

  const createTestMedicine = async (name: string, stock: number, dosesPerDay: number) => {
    try {
      setIsLoading(true)
      
      const testMedicine = {
        name: name,
        dosage: '500mg',
        category: 'Test Medicine',
        manufacturer: 'Test Pharma',
        notes: 'Test medicine for refill alerts',
        startDate: new Date().toISOString().split('T')[0],
        durationDays: 30,
        totalQuantity: stock + 10, // Set total higher than current stock
        dosesPerDay: dosesPerDay,
        longTerm: false,
        alertBeforeFinish: true,
        currentStock: stock, // This will determine when alerts show
        frequency: 'daily'
      }

      const created = await medicineApi.createMedicine(testMedicine)
      
      addToast({
        type: 'success',
        title: 'Test Medicine Created',
        description: `${name} created with ${stock} doses remaining (${Math.floor(stock / dosesPerDay)} days)`,
        duration: 4000
      })

      // Refresh medicines list
      await loadMedicines()
      
      // Trigger refill check
      await refillNotificationService.checkAllMedicinesForRefill()
      
      return created
    } catch (error) {
      console.error('Error creating test medicine:', error)
      addToast({
        type: 'error',
        title: 'Failed to Create Medicine',
        description: 'Could not create test medicine',
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateMedicineStock = async (medicineId: number, newStock: number) => {
    try {
      setIsLoading(true)
      
      await medicineApi.updateMedicineStock(medicineId, newStock)
      
      addToast({
        type: 'success',
        title: 'Stock Updated',
        description: `Medicine stock updated to ${newStock} doses`,
        duration: 3000
      })

      // Refresh medicines list
      await loadMedicines()
      
      // Trigger refill check
      await refillNotificationService.checkAllMedicinesForRefill()
      
    } catch (error) {
      console.error('Error updating stock:', error)
      addToast({
        type: 'error',
        title: 'Failed to Update Stock',
        description: 'Could not update medicine stock',
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerRefillCheck = async () => {
    try {
      setIsLoading(true)
      
      await refillNotificationService.checkAllMedicinesForRefill()
      
      addToast({
        type: 'success',
        title: 'Refill Check Complete',
        description: 'Checked all medicines for refill needs',
        duration: 3000
      })
      
    } catch (error) {
      console.error('Error checking refills:', error)
      addToast({
        type: 'error',
        title: 'Refill Check Failed',
        description: 'Could not check medicines for refill',
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysRemaining = (medicine: any) => {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const dosesPerDay = medicine.dosesPerDay || 1
    return Math.floor(currentStock / dosesPerDay)
  }

  const getStockBadge = (medicine: any) => {
    const days = getDaysRemaining(medicine)
    if (days <= 0) return <Badge variant="destructive">Finished</Badge>
    if (days === 1) return <Badge variant="destructive">1 Day</Badge>
    if (days <= 3) return <Badge variant="warning">{days} Days</Badge>
    return <Badge variant="secondary">{days} Days</Badge>
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Refill Alert Tester
        </CardTitle>
        <CardDescription>
          Create test medicines and manage stock to see refill alerts in action
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Test Medicines */}
        <div className="space-y-3">
          <h3 className="font-semibold">Create Test Medicines</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => createTestMedicine('Aspirin (Critical)', 1, 2)}
              disabled={isLoading}
              variant="outline"
              className="text-red-600 border-red-200"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Critical (1 dose)
            </Button>
            
            <Button
              onClick={() => createTestMedicine('Vitamin D (Urgent)', 4, 2)}
              disabled={isLoading}
              variant="outline"
              className="text-orange-600 border-orange-200"
            >
              <Package className="w-4 h-4 mr-2" />
              Urgent (2 days)
            </Button>
            
            <Button
              onClick={() => createTestMedicine('Calcium (Warning)', 6, 2)}
              disabled={isLoading}
              variant="outline"
              className="text-yellow-600 border-yellow-200"
            >
              <Package className="w-4 h-4 mr-2" />
              Warning (3 days)
            </Button>
          </div>
        </div>

        {/* Trigger Refill Check */}
        <div className="space-y-3">
          <h3 className="font-semibold">Manual Actions</h3>
          <Button
            onClick={triggerRefillCheck}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Check All Medicines for Refill
          </Button>
        </div>

        {/* Current Medicines */}
        <div className="space-y-3">
          <h3 className="font-semibold">Your Medicines ({medicines.length})</h3>
          
          {medicines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No medicines found. Create some test medicines above to see refill alerts.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {medicines.map((medicine) => (
                <motion.div
                  key={medicine.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{medicine.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Stock: {medicine.currentStock || medicine.totalQuantity} doses • 
                        {medicine.dosesPerDay} doses/day
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStockBadge(medicine)}
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMedicineStock(medicine.id, 1)}
                          disabled={isLoading}
                        >
                          Set to 1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMedicineStock(medicine.id, 4)}
                          disabled={isLoading}
                        >
                          Set to 4
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMedicineStock(medicine.id, 20)}
                          disabled={isLoading}
                        >
                          Set to 20
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Test Refill Alerts:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Create test medicines using the buttons above</li>
            <li>2. Medicines with ≤3 days remaining will show refill alerts</li>
            <li>3. Use "Set to X" buttons to change stock levels</li>
            <li>4. Click "Check All Medicines" to refresh alerts</li>
            <li>5. Check the main dashboard to see the alerts appear</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}