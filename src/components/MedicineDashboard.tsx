import React, { useState, useEffect, useCallback } from 'react'
import { Medicine, MedicineStats, medicineApi } from '../services/medicineApi'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { LoadingSpinner } from './ui/loading'
import { useToast } from './ui/toast'
import { StatsCard } from './ui/stats-card'
import { 
  Pill, 
  AlertTriangle, 
  Calendar, 
  Bell, 
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react'
import { Button } from './ui/button'

interface MedicineDashboardProps {
  onAddMedicine: () => void
  onViewMedicines: () => void
  onViewReminders: () => void
  onViewCustomReminders?: () => void
}

export const MedicineDashboard: React.FC<MedicineDashboardProps> = ({
  onAddMedicine,
  onViewMedicines,
  onViewReminders,
  onViewCustomReminders
}) => {
  const [stats, setStats] = useState<MedicineStats | null>(null)
  const [recentMedicines, setRecentMedicines] = useState<Medicine[]>([])
  const [expiringMedicines, setExpiringMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  
  const { addToast } = useToast()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsResponse, allMedicines] = await Promise.all([
        medicineApi.getMedicineStats(),
        medicineApi.getMedicines()
      ])
      
      // Filter medicines expiring in 7 days using frontend logic (since backend is incorrect)
      const expiringResponse = allMedicines.filter(medicine => {
        const currentStock = medicine.currentStock || medicine.totalQuantity || 0
        const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
        return stockBasedDays <= 7 && stockBasedDays > 0
      })
      
      setStats(statsResponse)
      // Get the 5 most recently added medicines
      setRecentMedicines(allMedicines.slice(0, 5))
      setExpiringMedicines(expiringResponse)
    } catch (error) {
      addToast({ title: 'Failed to load dashboard data', type: 'error' })
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const isExpired = (medicine: Medicine) => {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
    
    // If we have stock data, use stock-based calculation
    if (currentStock > 0) {
      return stockBasedDays <= 0
    }
    
    // Fallback to date-based calculation if no stock data
    const startDate = new Date(medicine.startDate)
    const endDate = new Date(startDate.getTime() + medicine.durationDays * 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate < today
  }

  const getDaysUntilExpiry = (medicine: Medicine) => {
    const startDate = new Date(medicine.startDate)
    const endDate = new Date(startDate.getTime() + medicine.durationDays * 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Set end date to end of day for accurate comparison
    const endOfEndDate = new Date(endDate)
    endOfEndDate.setHours(23, 59, 59, 999)
    
    const diffTime = endOfEndDate.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays) // Ensure we don't return negative days
  }

  const getEndDate = (medicine: Medicine) => {
    const startDate = new Date(medicine.startDate)
    return new Date(startDate.getTime() + medicine.durationDays * 24 * 60 * 60 * 1000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" variant="healthcare" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medicine Dashboard</h1>
          <p className="text-muted-foreground">Overview of your medicine management</p>
        </div>
        <Button onClick={onAddMedicine} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Medicine
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={onViewMedicines} className="cursor-pointer">
            <StatsCard
              title="Total Medicines"
              value={stats.totalMedicines}
              icon={Pill}
              variant="default"
              className="hover:shadow-md transition-shadow"
            />
          </div>
          
          <div onClick={onViewMedicines} className="cursor-pointer">
            <StatsCard
              title="Expiring This Week"
              value={stats.expiringThisWeek}
              icon={AlertTriangle}
              variant={stats.expiringThisWeek > 0 ? 'warning' : 'default'}
              className="hover:shadow-md transition-shadow"
            />
          </div>
          
          <div onClick={onViewMedicines} className="cursor-pointer">
            <StatsCard
              title="Expiring This Month"
              value={stats.expiringThisMonth}
              icon={Calendar}
              variant={stats.expiringThisMonth > 0 ? 'warning' : 'default'}
              className="hover:shadow-md transition-shadow"
            />
          </div>
          
          <div onClick={onViewCustomReminders || onViewReminders} className="cursor-pointer">
            <StatsCard
              title="Custom Reminders"
              value={stats.activeReminders}
              icon={Bell}
              variant="default"
              className="hover:shadow-md transition-shadow"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Medicines */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Medicines
            </h2>
            <Button variant="outline" size="sm" onClick={onViewMedicines}>
              View All
            </Button>
          </div>
          
          {recentMedicines.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No medicines added yet</p>
              <Button onClick={onAddMedicine} size="sm">
                Add Your First Medicine
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMedicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{medicine.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {medicine.dosage} • {medicine.dosesPerDay} doses/day
                    </p>
                  </div>
                  <Badge variant="secondary">{medicine.category}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Expiring Medicines */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Expiring Soon
            </h2>
            <Button variant="outline" size="sm" onClick={onViewMedicines}>
              View All
            </Button>
          </div>
          

          
          {expiringMedicines.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">All medicines are up to date!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringMedicines
                .filter((medicine) => {
                  const currentStock = medicine.currentStock || medicine.totalQuantity || 0
                  const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
                  const daysUntilExpiry = getDaysUntilExpiry(medicine)
                  
                  // Use stock-based calculation if available, otherwise use date-based
                  const actualDaysRemaining = currentStock > 0 ? stockBasedDays : daysUntilExpiry
                  

                  
                  return actualDaysRemaining <= 7 && actualDaysRemaining > 0
                })
                .slice(0, 5)
                .map((medicine) => {
                const currentStock = medicine.currentStock || medicine.totalQuantity || 0
                const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
                const daysUntilExpiry = getDaysUntilExpiry(medicine)
                const actualDaysRemaining = currentStock > 0 ? stockBasedDays : daysUntilExpiry
                const expired = actualDaysRemaining <= 0
                
                return (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{medicine.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ends: {getEndDate(medicine).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {expired ? (
                        <Badge variant="destructive">Finished</Badge>
                      ) : (
                        <Badge variant={actualDaysRemaining <= 7 ? 'destructive' : 'warning'}>
                          {actualDaysRemaining} day{actualDaysRemaining !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={onAddMedicine}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-violet-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-foreground">Add Medicine</div>
              <div className="text-sm text-muted-foreground">Add a new medicine to your list</div>
            </div>
          </div>
          
          <div
            onClick={onViewReminders}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-foreground">Set Reminders</div>
              <div className="text-sm text-muted-foreground">Manage your medicine reminders</div>
            </div>
          </div>
          
          <div
            onClick={onViewMedicines}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Pill className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-foreground">View All</div>
              <div className="text-sm text-muted-foreground">See your complete medicine list</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}