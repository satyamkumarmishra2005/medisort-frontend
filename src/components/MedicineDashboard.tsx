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
      
      // Filter medicines expiring in 3 days using frontend logic (since backend is incorrect)
      const expiringResponse = allMedicines.filter(medicine => {
        const currentStock = medicine.currentStock || medicine.totalQuantity || 0
        const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
        return stockBasedDays <= 3 && stockBasedDays > 0
      })
      
      setStats(statsResponse)
      // Get the 3 most recently added medicines
      setRecentMedicines(allMedicines.slice(0, 3))
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
    
    // Listen for medicine changes
    const handleMedicineAdded = () => {
      console.log('💊 Medicine added, refreshing dashboard')
      loadDashboardData()
    }

    const handleMedicineUpdated = () => {
      console.log('💊 Medicine updated, refreshing dashboard')
      loadDashboardData()
    }

    window.addEventListener('medicine-added', handleMedicineAdded)
    window.addEventListener('medicine-updated', handleMedicineUpdated)

    return () => {
      window.removeEventListener('medicine-added', handleMedicineAdded)
      window.removeEventListener('medicine-updated', handleMedicineUpdated)
    }
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
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + medicine.durationDays)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate < today
  }

  const getDaysUntilExpiry = (medicine: Medicine) => {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const dosesPerDay = medicine.dosesPerDay || 1
    
    // Use stock-based calculation (same as refill alerts) if we have stock data
    if (currentStock > 0) {
      const daysRemaining = Math.floor(currentStock / dosesPerDay)
      return Math.max(0, daysRemaining)
    }
    
    // Fallback to date-based calculation if no stock data
    const startDate = new Date(medicine.startDate)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + medicine.durationDays)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Set end date to end of day for accurate comparison
    endDate.setHours(23, 59, 59, 999)
    
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays) // Ensure we don't return negative days
  }

  const getEndDate = (medicine: Medicine) => {
    const currentStock = medicine.currentStock || medicine.totalQuantity || 0
    const dosesPerDay = medicine.dosesPerDay || 1
    
    // Use stock-based calculation (same as refill alerts) if we have stock data
    if (currentStock > 0) {
      const daysRemaining = Math.floor(currentStock / dosesPerDay)
      const expectedEndDate = new Date()
      expectedEndDate.setDate(expectedEndDate.getDate() + daysRemaining)
      return expectedEndDate
    }
    
    // Fallback to date-based calculation if no stock data
    const startDate = new Date(medicine.startDate)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + medicine.durationDays)
    return endDate
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" variant="healthcare" />
      </div>
    )
  }

  return (
    <div className="space-y-8">


      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={onViewMedicines} className="cursor-pointer group">
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-1">Total Medicines</p>
                    <p className="text-3xl font-bold text-white">{stats.totalMedicines}</p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Pill className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div onClick={onViewMedicines} className="cursor-pointer group">
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 backdrop-blur-sm group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-300 mb-1">Expiring This Week</p>
                    <p className="text-3xl font-bold text-white">{stats.expiringThisWeek}</p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div onClick={onViewMedicines} className="cursor-pointer group">
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 backdrop-blur-sm group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-300 mb-1">Expiring This Month</p>
                    <p className="text-3xl font-bold text-white">{stats.expiringThisMonth}</p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div onClick={onViewCustomReminders || onViewReminders} className="cursor-pointer group">
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-300 mb-1">Custom Reminders</p>
                    <p className="text-3xl font-bold text-white">{stats.activeReminders}</p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Recent Medicines */}
        <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 via-slate-900/30 to-slate-800/20 overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Recent Medicines
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewMedicines}
                className="bg-slate-800/60 backdrop-blur-sm border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-all duration-200"
              >
                View All
              </Button>
            </div>
            
            {recentMedicines.length === 0 ? (
              <div className="text-center py-8">
                <div className="relative mx-auto mb-6 w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full shadow-lg"></div>
                  <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
                    <Pill className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <p className="text-slate-300 mb-4 text-lg">No medicines added yet</p>
                <Button 
                  onClick={onAddMedicine} 
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Add Your First Medicine
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMedicines.map((medicine, index) => (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl hover:shadow-lg hover:shadow-green-500/10 border border-slate-600/50 hover:border-green-500/50 backdrop-blur-sm transition-all duration-300"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{medicine.name}</h3>
                      <p className="text-sm text-slate-300">
                        💊 {medicine.dosage} • 📅 {medicine.dosesPerDay} doses/day
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30"
                    >
                      {medicine.category}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Enhanced Expiring Medicines */}
        <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 via-slate-900/30 to-slate-800/20 overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                Expiring Soon
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewMedicines}
                className="bg-slate-800/60 backdrop-blur-sm border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-all duration-200"
              >
                View All
              </Button>
            </div>
            
            {expiringMedicines.length === 0 ? (
              <div className="text-center py-8">
                <div className="relative mx-auto mb-6 w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
                  <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <p className="text-slate-300 text-lg">
                  {stats?.totalMedicines === 0 
                    ? "No medicines added yet" 
                    : "All medicines are up to date! 🎉"
                  }
                </p>
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
                    
                    return actualDaysRemaining <= 3 && actualDaysRemaining > 0
                  })
                  .slice(0, 5)
                  .map((medicine, index) => {
                  const currentStock = medicine.currentStock || medicine.totalQuantity || 0
                  const stockBasedDays = medicine.dosesPerDay > 0 ? Math.floor(currentStock / medicine.dosesPerDay) : 0
                  const daysUntilExpiry = getDaysUntilExpiry(medicine)
                  const actualDaysRemaining = currentStock > 0 ? stockBasedDays : daysUntilExpiry
                  const expired = actualDaysRemaining <= 0
                  
                  return (
                    <div
                      key={medicine.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl hover:shadow-lg hover:shadow-orange-500/10 border border-slate-600/50 hover:border-orange-500/50 backdrop-blur-sm transition-all duration-300"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{medicine.name}</h3>
                        <p className="text-sm text-slate-300">
                          📅 Ends: {getEndDate(medicine).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {expired ? (
                          <Badge 
                            variant="destructive" 
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                          >
                            Finished
                          </Badge>
                        ) : (
                          <Badge 
                            variant={actualDaysRemaining <= 1 ? 'destructive' : actualDaysRemaining <= 3 ? 'warning' : 'secondary'}
                            className={
                              actualDaysRemaining <= 1 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                                : actualDaysRemaining <= 3 
                                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                                : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30'
                            }
                          >
                            {actualDaysRemaining} day{actualDaysRemaining !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 via-slate-900/30 to-slate-800/20 overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={onAddMedicine}
              className="group flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 border border-slate-600/50 hover:border-violet-500/50 backdrop-blur-sm hover:scale-105"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Add Medicine</div>
                <div className="text-sm text-slate-300">Add a new medicine to your list</div>
              </div>
            </div>
            
            <div
              onClick={onViewReminders}
              className="group flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10 border border-slate-600/50 hover:border-teal-500/50 backdrop-blur-sm hover:scale-105"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Set Reminders</div>
                <div className="text-sm text-slate-300">Manage your medicine reminders</div>
              </div>
            </div>
            
            <div
              onClick={onViewMedicines}
              className="group flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 border border-slate-600/50 hover:border-indigo-500/50 backdrop-blur-sm hover:scale-105"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">View All</div>
                <div className="text-sm text-slate-300">See your complete medicine list</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}