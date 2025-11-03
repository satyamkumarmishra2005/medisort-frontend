import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Plus, Edit, Trash2, Clock, Calendar, ToggleLeft, ToggleRight, Save, X, RefreshCw, Settings, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/toast'
import ApiService from '../services/api'
import { customReminderNotificationService } from '../services/customReminderNotificationService'


interface CustomReminder {
  id?: number
  title: string
  time: string
  frequency: string
  isActive: boolean
  type: 'custom'
  daysOfWeek?: number[]
  isRecurring?: boolean
  label?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface EditingReminder extends CustomReminder {
  isEditing: boolean
}

const CustomReminders: React.FC = () => {
  const [reminders, setReminders] = useState<EditingReminder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newReminder, setNewReminder] = useState({
    title: '',
    time: '09:00',
    frequency: 'daily',
    isActive: true,
    daysOfWeek: [] as number[],
    notes: ''
  })
  const { addToast } = useToast()

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'as-needed', label: 'As Needed' }
  ]

  useEffect(() => {
    loadReminders()
  }, [])

  const loadReminders = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true)
      
      const result = await ApiService.getAllCustomReminders()
      
      if (result.success && result.data) {
        const remindersWithEditing = result.data.map((reminder: CustomReminder) => ({
          ...reminder,
          isEditing: false
        }))
        setReminders(remindersWithEditing)
      } else {
        throw new Error(result.message || 'Failed to load reminders')
      }
    } catch (error: any) {
      console.error('Error loading reminders:', error)
      addToast({
        type: 'error',
        title: 'Failed to Load Reminders',
        description: error.message || 'Could not load reminders',
        duration: 4000
      })
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const createReminder = async () => {
    if (!newReminder.title.trim()) {
      addToast({
        type: 'error',
        title: 'Title Required',
        description: 'Please enter a title for your reminder',
        duration: 3000
      })
      return
    }

    try {
      setIsCreating(true)
      
      const reminderData = {
        title: newReminder.title.trim(),
        time: newReminder.time,
        frequency: newReminder.frequency,
        isActive: true,
        daysOfWeek: newReminder.daysOfWeek,
        notes: newReminder.notes.trim() || undefined
      }

      const result = await ApiService.createCustomReminder(reminderData)
      
      if (result.success) {
        await loadReminders()
        
        // Reset form
        setNewReminder({
          title: '',
          time: '09:00',
          frequency: 'daily',
          isActive: true,
          daysOfWeek: [],
          notes: ''
        })
        setShowCreateForm(false)
        
        addToast({
          type: 'success',
          title: 'Reminder Created',
          description: `"${reminderData.title}" has been created successfully`,
          duration: 3000
        })
      } else {
        throw new Error(result.message || 'Failed to create reminder')
      }
    } catch (error: any) {
      console.error('Error creating reminder:', error)
      addToast({
        type: 'error',
        title: 'Creation Failed',
        description: error.message || 'Could not create reminder',
        duration: 4000
      })
    } finally {
      setIsCreating(false)
    }
  }

  const toggleNewReminderDay = (dayIndex: number) => {
    setNewReminder(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayIndex)
        ? prev.daysOfWeek.filter(d => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex]
    }))
  }

  const toggleReminder = async (id: number) => {
    try {
      const result = await ApiService.toggleCustomReminderStatus(id)
      
      if (result.success) {
        await loadReminders()
        addToast({
          type: 'success',
          title: 'Status Updated',
          description: 'Reminder status has been updated',
          duration: 2000
        })
      } else {
        throw new Error(result.message || 'Failed to toggle reminder')
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Could not update reminder status',
        duration: 3000
      })
    }
  }

  const startEditing = (id: number) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, isEditing: true }
        : { ...reminder, isEditing: false }
    ))
  }

  const cancelEditing = (id: number) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, isEditing: false }
        : reminder
    ))
  }

  const updateReminderField = (id: number, field: string, value: any) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, [field]: value }
        : reminder
    ))
  }

  const toggleDayOfWeek = (id: number, dayIndex: number) => {
    setReminders(prev => prev.map(reminder => {
      if (reminder.id === id) {
        const currentDays = reminder.daysOfWeek || []
        const newDays = currentDays.includes(dayIndex)
          ? currentDays.filter(d => d !== dayIndex)
          : [...currentDays, dayIndex]
        return { ...reminder, daysOfWeek: newDays }
      }
      return reminder
    }))
  }

  const saveReminder = async (id: number) => {
    const reminder = reminders.find(r => r.id === id)
    if (!reminder) return

    try {
      const updateData = {
        title: reminder.title,
        time: reminder.time,
        frequency: reminder.frequency,
        isActive: reminder.isActive,
        daysOfWeek: reminder.daysOfWeek,
        notes: reminder.notes
      }

      const result = await ApiService.updateCustomReminder(id, updateData)
      
      if (result.success) {
        await loadReminders()
        addToast({
          type: 'success',
          title: 'Reminder Updated',
          description: 'Changes have been saved successfully',
          duration: 3000
        })
      } else {
        throw new Error(result.message || 'Failed to update reminder')
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Could not save changes',
        duration: 4000
      })
    }
  }

  const deleteReminder = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const result = await ApiService.deleteCustomReminder(id)
      
      if (result.success) {
        await loadReminders()
        addToast({
          type: 'success',
          title: 'Reminder Deleted',
          description: `"${title}" has been deleted`,
          duration: 3000
        })
      } else {
        throw new Error(result.message || 'Failed to delete reminder')
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: error.message || 'Could not delete reminder',
        duration: 4000
      })
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center space-y-4"
          >
            <motion.div
              className="inline-flex items-center gap-3 mb-4"
              animate={{ 
                scale: [1, 1.02, 1],
                rotate: [0, 1, -1, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-2xl">
                <Bell className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold gradient-text">
                  Custom Reminders
                </h1>
                <p className="text-muted-foreground text-lg">Your personal health companion</p>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Create, manage, and track personalized reminders to stay on top of your health goals
            </motion.p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card variant="glass" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-foreground mb-2">{reminders.length}</div>
                <div className="text-muted-foreground">Total Reminders</div>
              </CardContent>
            </Card>
            <Card variant="glass" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-accent mb-2">{reminders.filter(r => r.isActive).length}</div>
                <div className="text-muted-foreground">Active Today</div>
              </CardContent>
            </Card>
            <Card variant="glass" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {reminders.filter(r => r.frequency === 'daily').length}
                </div>
                <div className="text-muted-foreground">Daily Routines</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="text-foreground font-medium">
                  Manage your wellness journey
                </div>
                <div className="text-muted-foreground text-sm">
                  {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} configured
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    // Test notification immediately
                    const testNotification = {
                      id: Date.now(),
                      title: 'Test Notification',
                      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                      category: 'health',
                      notes: 'This is a test notification',
                      reminder: {
                        id: Date.now(),
                        title: 'Test Notification',
                        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        frequency: 'daily',
                        isActive: true,
                        type: 'custom' as const,
                        label: 'health'
                      }
                    }
                    
                    const event = new CustomEvent('custom-reminder-notification', {
                      detail: testNotification
                    })
                    window.dispatchEvent(event)
                    
                    addToast({
                      type: 'success',
                      title: 'Test Notification Sent',
                      description: 'Check the top-right corner for the notification',
                      duration: 3000
                    })
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Bell className="w-4 h-4" />
                  Test
                </Button>
                
                <Button
                  onClick={() => loadReminders(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  onClick={() => {
                    const status = customReminderNotificationService.getStatus()
                    if (!status.isRunning) {
                      customReminderNotificationService.start()
                      addToast({
                        type: 'success',
                        title: 'Service Started',
                        description: 'Notification service is now running',
                        duration: 3000
                      })
                    } else {
                      addToast({
                        type: 'info',
                        title: 'Service Running',
                        description: 'Notification service is already active',
                        duration: 3000
                      })
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <Settings className="w-4 h-4" />
                  Service
                </Button>
                
                <Button
                  onClick={() => setShowCreateForm(true)}
                  disabled={showCreateForm}
                  className="vibrant-gradient text-primary-foreground font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Reminder
                </Button>
              </div>
            </div>
          </motion.div>



          {/* Enhanced Create Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="glass-card p-8 shadow-2xl"
            >
              {/* Form Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 vibrant-gradient rounded-2xl mb-4 shadow-lg"
                >
                  <Plus className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Create New Reminder</h2>
                <p className="text-muted-foreground">Set up a personalized health reminder</p>
              </div>

              <div className="space-y-6">
                {/* Title Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-semibold mb-3 text-foreground">Reminder Title</label>
                  <Input
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Take vitamins, Exercise, Call doctor"
                    variant="glass"
                    className="h-12"
                  />
                </motion.div>
                
                {/* Time and Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-semibold mb-3 text-foreground">Time</label>
                    <Input
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                      variant="glass"
                      className="h-12"
                      icon={<Clock className="w-5 h-5" />}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-sm font-semibold mb-3 text-foreground">Frequency</label>
                    <div className="relative">
                      <select
                        value={newReminder.frequency}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all appearance-none"
                      >
                        {frequencyOptions.map(option => (
                          <option key={option.value} value={option.value} className="bg-background text-foreground">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </motion.div>
                </div>

                {/* Days of Week */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-semibold mb-3 text-foreground">Days of Week</label>
                  <div className="flex flex-wrap gap-3">
                    {dayNames.map((day, index) => (
                      <Button
                        key={index}
                        type="button"
                        onClick={() => toggleNewReminderDay(index)}
                        variant={newReminder.daysOfWeek.includes(index) ? "default" : "outline"}
                        size="sm"
                        className={newReminder.daysOfWeek.includes(index) ? "vibrant-gradient text-primary-foreground" : ""}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Leave empty for daily reminders
                  </p>
                </motion.div>

                {/* Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label className="block text-sm font-semibold mb-3 text-foreground">Notes (optional)</label>
                  <Input
                    value={newReminder.notes}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or instructions"
                    variant="glass"
                    className="h-12"
                  />
                </motion.div>
                
                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-4 pt-6"
                >
                  <Button
                    onClick={createReminder}
                    disabled={isCreating}
                    className="flex-1 vibrant-gradient text-primary-foreground font-bold py-3 px-6 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Create Reminder
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="px-6 py-3 flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Reminders List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            {isLoading ? (
              <Card variant="glass" className="p-12 text-center">
                <CardContent>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"
                  />
                  <p className="text-muted-foreground text-lg">Loading your reminders...</p>
                </CardContent>
              </Card>
            ) : reminders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-12 text-center"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="w-20 h-20 vibrant-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Bell className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No Reminders Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start your wellness journey by creating your first personalized reminder
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="vibrant-gradient text-primary-foreground font-bold py-3 px-8 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Reminder
                </Button>
              </motion.div>
            ) : (
              reminders.map((reminder, index) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  className={`group ${reminder.isEditing ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <Card variant="glass" className="p-6 hover:shadow-2xl transition-all duration-300 hover-lift">
                    {reminder.isEditing ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">Title</label>
                          <Input
                            value={reminder.title}
                            onChange={(e) => updateReminderField(reminder.id!, 'title', e.target.value)}
                            placeholder="Reminder title"
                            variant="glass"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Time</label>
                            <Input
                              type="time"
                              value={reminder.time}
                              onChange={(e) => updateReminderField(reminder.id!, 'time', e.target.value)}
                              variant="glass"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Frequency</label>
                            <select
                              value={reminder.frequency}
                              onChange={(e) => updateReminderField(reminder.id!, 'frequency', e.target.value)}
                              className="w-full p-2 bg-background border border-input rounded-md text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                            >
                              {frequencyOptions.map(option => (
                                <option key={option.value} value={option.value} className="bg-background">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Days of Week</label>
                          <div className="flex gap-2">
                            {dayNames.map((day, index) => (
                              <Button
                                key={index}
                                type="button"
                                onClick={() => toggleDayOfWeek(reminder.id!, index)}
                                variant={(reminder.daysOfWeek || []).includes(index) ? "default" : "outline"}
                                size="sm"
                                className={(reminder.daysOfWeek || []).includes(index) ? "bg-primary text-primary-foreground" : ""}
                              >
                                {day}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">Notes</label>
                          <Input
                            value={reminder.notes || ''}
                            onChange={(e) => updateReminderField(reminder.id!, 'notes', e.target.value)}
                            placeholder="Additional notes"
                            variant="glass"
                          />
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <Button onClick={() => saveReminder(reminder.id!)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => cancelEditing(reminder.id!)}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Enhanced View Mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header with icon and title */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl backdrop-blur-sm border border-primary/20">
                              <Bell className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-foreground text-lg">{reminder.title}</h4>
                                <motion.span 
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    reminder.isActive 
                                      ? 'bg-accent/20 text-accent border border-accent/30' 
                                      : 'bg-muted text-muted-foreground border border-border'
                                  }`}
                                  animate={{ scale: reminder.isActive ? [1, 1.05, 1] : 1 }}
                                  transition={{ duration: 2, repeat: reminder.isActive ? Infinity : 0 }}
                                >
                                  {reminder.isActive ? '● Active' : '○ Inactive'}
                                </motion.span>
                              </div>
                              
                              {/* Time and frequency info */}
                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg backdrop-blur-sm">
                                  <Clock className="w-4 h-4 text-primary" />
                                  <span className="font-medium">{reminder.time}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg backdrop-blur-sm">
                                  <Calendar className="w-4 h-4 text-accent" />
                                  <span className="font-medium capitalize">{reminder.frequency}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Days of week display */}
                          {reminder.daysOfWeek && reminder.daysOfWeek.length > 0 && (
                            <div className="flex gap-2 mb-3 ml-16">
                              {reminder.daysOfWeek.map(dayIndex => (
                                <span 
                                  key={dayIndex} 
                                  className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg border border-primary/30 font-medium"
                                >
                                  {dayNames[dayIndex]}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Notes display */}
                          {reminder.notes && (
                            <div className="ml-16 mb-3">
                              <div className="bg-muted/30 border border-border rounded-lg p-3 backdrop-blur-sm">
                                <p className="text-sm text-muted-foreground italic">"{reminder.notes}"</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => toggleReminder(reminder.id!)}
                            variant="ghost"
                            size="sm"
                            className={reminder.isActive ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-muted/10'}
                          >
                            {reminder.isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => startEditing(reminder.id!)}
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            onClick={() => deleteReminder(reminder.id!, reminder.title)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CustomReminders