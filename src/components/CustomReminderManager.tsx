import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, Calendar, Bell, Trash2, Edit, ToggleLeft, ToggleRight, RefreshCw, Upload, Download, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { customReminderService, CustomReminder, CustomReminderRequest, CustomReminderStats } from '../services/customReminderService'
import { useToast } from './ui/toast'

export const CustomReminderManager: React.FC = () => {
  const [reminders, setReminders] = useState<CustomReminder[]>([])
  const [stats, setStats] = useState<CustomReminderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newReminder, setNewReminder] = useState<CustomReminderRequest>({
    title: '',
    time: '09:00',
    frequency: 'daily',
    isActive: true,
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
    isRecurring: true
  })
  const { addToast } = useToast()

  useEffect(() => {
    loadReminders()
    loadStats()
  }, [])

  const loadReminders = async () => {
    try {
      setIsLoading(true)
      const data = await customReminderService.getAllReminders()
      setReminders(data)
    } catch (error) {
      console.error('Error loading reminders:', error)
      addToast({
        type: 'error',
        title: 'Failed to Load Reminders',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await customReminderService.getCustomReminderStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleCreateReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.time) {
      addToast({
        type: 'error',
        title: 'Invalid Data',
        description: 'Please enter a title and time for the reminder',
        duration: 3000
      })
      return
    }

    try {
      setIsCreating(true)
      const createdReminder = await customReminderService.createReminder(newReminder)
      
      setReminders(prev => [...prev, createdReminder])
      setNewReminder({
        title: '',
        time: '09:00',
        frequency: 'daily',
        isActive: true,
        daysOfWeek: [1, 2, 3, 4, 5],
        isRecurring: true
      })
      setShowCreateForm(false)
      
      await loadStats()
      
      addToast({
        type: 'success',
        title: 'Reminder Created',
        description: `"${createdReminder.title}" has been created successfully`,
        duration: 4000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Reminder',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleReminder = async (id: number) => {
    try {
      const updatedReminder = await customReminderService.toggleReminderStatus(id)
      
      setReminders(prev => prev.map(r => 
        r.id === id ? updatedReminder : r
      ))
      
      await loadStats()
      
      addToast({
        type: 'success',
        title: 'Reminder Updated',
        description: `Reminder ${updatedReminder.isActive ? 'enabled' : 'disabled'}`,
        duration: 3000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Update Reminder',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    }
  }

  const handleDeleteReminder = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const success = await customReminderService.deleteReminder(id)
      
      if (success) {
        setReminders(prev => prev.filter(r => r.id !== id))
        await loadStats()
        
        addToast({
          type: 'success',
          title: 'Reminder Deleted',
          description: `"${title}" has been deleted`,
          duration: 3000
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Delete Reminder',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    }
  }

  const handleSyncWithBackend = async () => {
    try {
      setIsLoading(true)
      const result = await customReminderService.syncWithBackend()
      
      if (result.success) {
        await loadReminders()
        await loadStats()
        
        addToast({
          type: 'success',
          title: 'Sync Complete',
          description: `Synced ${result.synced} reminders with backend`,
          duration: 4000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Sync Failed',
          description: result.errors.join(', '),
          duration: 4000
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReminders = async () => {
    try {
      const exportData = await customReminderService.exportReminders()
      
      // Create and download file
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `custom-reminders-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      addToast({
        type: 'success',
        title: 'Export Complete',
        description: 'Reminders exported successfully',
        duration: 3000
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    }
  }

  const handleImportReminders = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = await customReminderService.importReminders(text)
      
      if (result.success) {
        await loadReminders()
        await loadStats()
        
        addToast({
          type: 'success',
          title: 'Import Complete',
          description: `Imported ${result.imported} reminders`,
          duration: 4000
        })
        
        if (result.errors.length > 0) {
          console.warn('Import errors:', result.errors)
        }
      } else {
        addToast({
          type: 'error',
          title: 'Import Failed',
          description: result.errors.join(', '),
          duration: 4000
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Import Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 4000
      })
    }
    
    // Reset file input
    event.target.value = ''
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDayNames = (daysOfWeek?: number[]) => {
    if (!daysOfWeek || daysOfWeek.length === 0) return 'No days selected'
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    if (daysOfWeek.length === 7) return 'Every day'
    if (daysOfWeek.length === 5 && daysOfWeek.every(d => d >= 1 && d <= 5)) return 'Weekdays'
    if (daysOfWeek.length === 2 && daysOfWeek.includes(0) && daysOfWeek.includes(6)) return 'Weekends'
    
    return daysOfWeek.map(d => dayNames[d]).join(', ')
  }

  const handleDayToggle = (dayIndex: number) => {
    setNewReminder(prev => {
      const currentDays = prev.daysOfWeek || []
      const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter(d => d !== dayIndex)
        : [...currentDays, dayIndex].sort()
      
      return { ...prev, daysOfWeek: newDays }
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalReminders}</p>
                  <p className="text-sm text-muted-foreground">Total Reminders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeReminders}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.todaysReminders}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.upcomingReminders}</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Custom Reminders
              </CardTitle>
              <CardDescription>
                Manage your personalized health reminders
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncWithBackend}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReminders}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportReminders}
                  className="hidden"
                />
              </label>
              
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Create Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-4">Create New Reminder</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input
                      value={newReminder.title}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Take vitamins, Exercise, Check blood pressure"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <Input
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Frequency</label>
                    <select
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="as-needed">As Needed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Label (Optional)</label>
                    <Input
                      value={newReminder.label || ''}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g., Morning routine, Before breakfast"
                    />
                  </div>
                </div>
                
                {/* Days of Week */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Days of the week</label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                      const isSelected = newReminder.daysOfWeek?.includes(dayIndex)
                      
                      return (
                        <button
                          key={dayIndex}
                          type="button"
                          onClick={() => handleDayToggle(dayIndex)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {dayNames[dayIndex]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4">
                  <Button
                    onClick={handleCreateReminder}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Reminder
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Reminders List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading reminders...</span>
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Reminders</h3>
              <p className="text-gray-600 mb-4">Create your first custom reminder to get started</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Reminder
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{reminder.title}</h4>
                        {reminder.label && (
                          <Badge variant="secondary">{reminder.label}</Badge>
                        )}
                        <Badge variant={reminder.isActive ? 'success' : 'secondary'}>
                          {reminder.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(reminder.time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {getDayNames(reminder.daysOfWeek)}
                        </span>
                        <span className="capitalize">{reminder.frequency}</span>
                      </div>
                      
                      {reminder.notes && (
                        <p className="text-sm text-gray-500 mt-1">{reminder.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleReminder(reminder.id!)}
                      >
                        {reminder.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(reminder.id!)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReminder(reminder.id!, reminder.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}