import React, { useState } from 'react'
import { customReminderService } from '../services/customReminderService'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useToast } from './ui/toast'

export const SimpleCustomReminderTest: React.FC = () => {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [creating, setCreating] = useState(false)
  const { addToast } = useToast()

  const handleCreate = async () => {
    if (!title.trim() || !time) {
      addToast({ title: 'Please fill in title and time', type: 'error' })
      return
    }

    try {
      setCreating(true)
      console.log('🧪 Testing custom reminder creation:', { title, time })
      
      const reminder = customReminderService.createReminder({
        title: title.trim(),
        time,
        frequency: 'daily',
        isActive: true
      })
      
      console.log('✅ Custom reminder created successfully:', reminder)
      addToast({ title: 'Custom reminder created successfully!', type: 'success' })
      
      // Reset form
      setTitle('')
      setTime('')
    } catch (error) {
      console.error('❌ Custom reminder creation failed:', error)
      addToast({ title: 'Failed to create custom reminder', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="p-4 mb-4 bg-green-50 border-green-200">
      <h4 className="font-semibold text-green-800 mb-3">🧪 Simple Custom Reminder Test</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Title:</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Take Vitamins"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Time:</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        
        <Button
          onClick={handleCreate}
          disabled={creating}
          className="w-full"
        >
          {creating ? 'Creating...' : 'Create Custom Reminder (No Auth Required)'}
        </Button>
      </div>
    </Card>
  )
}