import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react'
import { Button } from './button'
import { motion, AnimatePresence } from 'framer-motion'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: string
  maxDate?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className = "",
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  )
  const [yearPickerOpen, setYearPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setYearPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
      }
    } else {
      setSelectedDate(null)
    }
  }, [value])

  // Position dropdown to avoid overflow
  useEffect(() => {
    if (isOpen && dropdownRef.current && containerRef.current) {
      const dropdown = dropdownRef.current
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const dropdownHeight = yearPickerOpen ? 480 : 380 // Adjust based on year picker
      const spaceBelow = window.innerHeight - rect.bottom - 20 // Add some padding
      const spaceAbove = rect.top - 20 // Add some padding
      const spaceLeft = rect.left
      const spaceRight = window.innerWidth - rect.right

      // Vertical positioning
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        dropdown.style.bottom = '100%'
        dropdown.style.top = 'auto'
        dropdown.style.marginBottom = '8px'
        dropdown.style.marginTop = '0'
      } else {
        dropdown.style.top = '100%'
        dropdown.style.bottom = 'auto'
        dropdown.style.marginTop = '8px'
        dropdown.style.marginBottom = '0'
      }

      // Horizontal positioning - ensure it doesn't go off screen
      const dropdownWidth = 320
      if (spaceRight < dropdownWidth && spaceLeft > dropdownWidth) {
        dropdown.style.right = '0'
        dropdown.style.left = 'auto'
      } else {
        dropdown.style.left = '0'
        dropdown.style.right = 'auto'
      }
    }
  }, [isOpen, yearPickerOpen])

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }

  const formatValueDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i
      days.push({ date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day), isCurrentMonth: false })
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }
    
    // Add days from next month to fill the grid
    const remainingCells = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }
    
    return days
  }

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    setSelectedDate(date)
    onChange(formatValueDate(date))
    setIsOpen(false)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const navigateYear = (year: number) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1))
    setYearPickerOpen(false)
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate)) return true
    if (maxDate && date > new Date(maxDate)) return true
    return false
  }

  const getYearRange = () => {
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 100
    const endYear = currentYear + 10
    const years = []
    for (let year = endYear; year >= startYear; year--) {
      years.push(year)
    }
    return years
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`
          w-full p-3 rounded-lg border border-input bg-background text-foreground 
          transition-all duration-200 cursor-pointer flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:shadow-sm'}
          ${isOpen ? 'ring-2 ring-primary border-primary' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {selectedDate && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDate(null)
                onChange('')
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Calendar className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bg-background border border-input rounded-lg shadow-xl z-[9999] w-80 max-w-[95vw]"
            style={{ 
              minWidth: '300px',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
          >
            <div className="p-3 max-h-[85vh] overflow-y-auto">
              {/* Header with Month/Year Navigation */}
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 h-7 w-7 hover:bg-primary/10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setYearPickerOpen(!yearPickerOpen)}
                    className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/5"
                  >
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    <ChevronDown className={`w-3 h-3 transition-transform ${yearPickerOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 h-7 w-7 hover:bg-primary/10"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Year Picker */}
              <AnimatePresence>
                {yearPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 max-h-24 overflow-y-auto border rounded-md bg-muted/20 scrollbar-thin"
                  >
                    <div className="grid grid-cols-4 gap-0.5 p-1.5">
                      {getYearRange().map(year => (
                        <button
                          key={year}
                          onClick={() => navigateYear(year)}
                          className={`
                            p-1.5 text-xs rounded hover:bg-primary/10 transition-colors
                            ${year === currentMonth.getFullYear() ? 'bg-primary text-primary-foreground' : 'text-foreground'}
                          `}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1.5">
                    {day.slice(0, 2)}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-0.5 mb-3">
                {getDaysInMonth(currentMonth).slice(0, 35).map(({ date, isCurrentMonth }, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square"
                  >
                    <button
                      onClick={() => handleDateSelect(date)}
                      disabled={isDateDisabled(date)}
                      className={`
                        w-full h-full rounded text-xs font-medium transition-all duration-200 min-h-[28px]
                        ${!isCurrentMonth ? 'text-muted-foreground/40' : ''}
                        ${isDateSelected(date) 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : isCurrentMonth 
                            ? 'text-foreground hover:bg-primary/10' 
                            : 'hover:bg-muted/30'
                        }
                        ${isToday(date) && !isDateSelected(date) 
                          ? 'bg-muted text-foreground font-bold ring-1 ring-primary/30' 
                          : ''
                        }
                        ${isDateDisabled(date) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                        focus:outline-none focus:ring-1 focus:ring-primary/50
                      `}
                    >
                      {date.getDate()}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-input">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = new Date()
                      if (!isDateDisabled(today)) {
                        handleDateSelect(today)
                      }
                    }}
                    className="text-xs px-2 py-1 h-6"
                    disabled={isDateDisabled(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(null)
                      onChange('')
                      setIsOpen(false)
                    }}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Clear
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs px-2 py-1 h-6"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}