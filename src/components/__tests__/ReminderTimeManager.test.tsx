import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReminderTimeManager } from '../ReminderTimeManager'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />
}))

describe('ReminderTimeManager', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render with empty reminder times', () => {
      render(
        <ReminderTimeManager
          reminderTimes={[]}
          dosesPerDay={0}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Reminder Times')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add reminder time/i })).toBeInTheDocument()
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    })

    it('should render with existing reminder times', () => {
      render(
        <ReminderTimeManager
          reminderTimes={['08:00', '14:00', '20:00']}
          dosesPerDay={3}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByDisplayValue('08:00')).toBeInTheDocument()
      expect(screen.getByDisplayValue('14:00')).toBeInTheDocument()
      expect(screen.getByDisplayValue('20:00')).toBeInTheDocument()
      expect(screen.getByText('3 of 3 reminders set')).toBeInTheDocument()
    })

    it('should show auto-filled indicator when autoFilled is true', () => {
      render(
        <ReminderTimeManager
          reminderTimes={['09:00']}
          dosesPerDay={1}
          onChange={mockOnChange}
          autoFilled={true}
        />
      )

      expect(screen.getByText('Auto-filled')).toBeInTheDocument()
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument()
    })
  })

  describe('Auto-generation of Times', () => {
    it('should auto-generate times for 1 dose per day', async () => {
      render(
        <ReminderTimeManager
          reminderTimes={[]}
          dosesPerDay={1}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['09:00'])
      })
    })

    it('should auto-generate times for 2 doses per day', async () => {
      render(
        <ReminderTimeManager
          reminderTimes={[]}
          dosesPerDay={2}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['09:00', '21:00'])
      })
    })

    it('should auto-generate times for 3 doses per day', async () => {
      render(
        <ReminderTimeManager
          reminderTimes={[]}
          dosesPerDay={3}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['08:00', '14:00', '20:00'])
      })
    })

    it('should not auto-generate when autoFilled is true', () => {
      render(
        <ReminderTimeManager
          reminderTimes={[]}
          dosesPerDay={2}
          onChange={mockOnChange}
          autoFilled={true}
        />
      )

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Time Input Management', () => {
    it('should add a new reminder time', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['09:00']}
          dosesPerDay={2}
          onChange={mockOnChange}
        />
      )

      const addButton = screen.getByRole('button', { name: /add reminder time/i })
      await user.click(addButton)

      const timeInputs = screen.getAllByDisplayValue('')
      expect(timeInputs).toHaveLength(1) // One empty input added
    })

    it('should remove a reminder time', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['09:00', '21:00']}
          dosesPerDay={2}
          onChange={mockOnChange}
        />
      )

      const removeButtons = screen.getAllByTestId('x-icon')
      await user.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith(['21:00'])
    })

    it('should update time when input changes', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['09:00']}
          dosesPerDay={1}
          onChange={mockOnChange}
        />
      )

      const timeInput = screen.getByDisplayValue('09:00')
      await user.clear(timeInput)
      await user.type(timeInput, '10:30')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['10:30'])
      })
    })
  })

  describe('Time Validation', () => {
    it('should show error for invalid time format', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['']}
          dosesPerDay={1}
          onChange={mockOnChange}
        />
      )

      const timeInput = screen.getByDisplayValue('')
      await user.type(timeInput, '25:00') // Invalid hour

      await waitFor(() => {
        expect(screen.getByText(/Please enter time in HH:MM format/)).toBeInTheDocument()
      })
    })

    it('should show error for duplicate times', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['09:00', '']}
          dosesPerDay={2}
          onChange={mockOnChange}
        />
      )

      const emptyInput = screen.getByDisplayValue('')
      await user.type(emptyInput, '09:00') // Duplicate time

      await waitFor(() => {
        expect(screen.getByText(/Duplicate time - each reminder must be unique/)).toBeInTheDocument()
      })
    })

    it('should show error for empty time', async () => {
      render(
        <ReminderTimeManager
          reminderTimes={['']}
          dosesPerDay={1}
          onChange={mockOnChange}
        />
      )

      // Trigger validation by trying to change to another empty value
      const timeInput = screen.getByDisplayValue('')
      fireEvent.blur(timeInput)

      await waitFor(() => {
        expect(screen.getByText('Time is required')).toBeInTheDocument()
      })
    })
  })

  describe('Helper Functions', () => {
    it('should generate optimal times when button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['10:00']} // Non-optimal time
          dosesPerDay={3}
          onChange={mockOnChange}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate optimal/i })
      await user.click(generateButton)

      expect(mockOnChange).toHaveBeenCalledWith(['08:00', '14:00', '20:00'])
    })

    it('should sort times when sort button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['20:00', '08:00', '14:00']} // Unsorted times
          dosesPerDay={3}
          onChange={mockOnChange}
        />
      )

      const sortButton = screen.getByRole('button', { name: /sort times/i })
      await user.click(sortButton)

      expect(mockOnChange).toHaveBeenCalledWith(['08:00', '14:00', '20:00'])
    })

    it('should not show sort button when there is only one time', () => {
      render(
        <ReminderTimeManager
          reminderTimes={['09:00']}
          dosesPerDay={1}
          onChange={mockOnChange}
        />
      )

      expect(screen.queryByRole('button', { name: /sort times/i })).not.toBeInTheDocument()
    })
  })

  describe('Status Indicators', () => {
    it('should show mismatch warning when times count differs from doses per day', () => {
      render(
        <ReminderTimeManager
          reminderTimes={['09:00']}
          dosesPerDay={3}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('1 of 3 reminders set')).toBeInTheDocument()
      expect(screen.getByText('Mismatch with doses per day')).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('should show error status when there are validation errors', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={['']}
          dosesPerDay={1}
          onChange={mockOnChange}
        />
      )

      const timeInput = screen.getByDisplayValue('')
      await user.type(timeInput, '25:00') // Invalid time

      await waitFor(() => {
        expect(screen.getByText('Please fix errors below')).toBeInTheDocument()
      })
    })
  })

  describe('Suggestions', () => {
    it('should show suggested times when no times are set', () => {
      render(
        <ReminderTimeManager
          reminderTimes={[]}
          dosesPerDay={2}
          onChange={mockOnChange}
          autoFilled={true} // Prevent auto-generation
        />
      )

      expect(screen.getByText('Suggested Times:')).toBeInTheDocument()
      expect(screen.getByText('9:00 AM')).toBeInTheDocument()
      expect(screen.getByText('9:00 PM')).toBeInTheDocument()
    })

    it('should apply suggested time when clicked', async () => {
      const user = userEvent.setup()

      render(
        <ReminderTimeManager
          reminderTimes={[]}
          dosesPerDay={1}
          onChange={mockOnChange}
          autoFilled={true}
        />
      )

      const suggestedTimeButton = screen.getByText('9:00 AM')
      await user.click(suggestedTimeButton)

      expect(mockOnChange).toHaveBeenCalledWith(['09:00'])
    })
  })

  describe('Time Display Formatting', () => {
    it('should display times in 12-hour format', () => {
      render(
        <ReminderTimeManager
          reminderTimes={['08:00', '14:30', '20:15']}
          dosesPerDay={3}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('8:00 AM')).toBeInTheDocument()
      expect(screen.getByText('2:30 PM')).toBeInTheDocument()
      expect(screen.getByText('8:15 PM')).toBeInTheDocument()
    })

    it('should handle midnight and noon correctly', () => {
      render(
        <ReminderTimeManager
          reminderTimes={['00:00', '12:00']}
          dosesPerDay={2}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('12:00 AM')).toBeInTheDocument()
      expect(screen.getByText('12:00 PM')).toBeInTheDocument()
    })
  })
})