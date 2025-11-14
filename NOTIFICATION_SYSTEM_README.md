# Medicine Reminder Notification System

## Overview

A comprehensive frontend notification system for medicine reminders that provides both browser notifications and in-app notifications with seamless integration into your existing React application.

## Features

### ✅ Implemented Features

1. **Real-time Reminder Checking**
   - Automatic checking every 60 seconds
   - Fetches upcoming and overdue reminders
   - Processes different reminder types (upcoming, due, overdue)

2. **Browser Notification Support**
   - Permission request handling
   - Popup notifications with custom styling
   - Click-to-focus functionality
   - Auto-dismiss for non-critical reminders

3. **In-App Notification System**
   - Custom notification overlay
   - Action buttons (Mark as Taken, Dismiss)
   - Visual indicators for different reminder types
   - Stacked notification display

4. **User Preferences**
   - Enable/disable browser notifications
   - Sound alerts toggle
   - Customizable reminder timing (5-60 minutes before)
   - Persistent preference storage

5. **Integration Components**
   - Permission request banner
   - Notification manager
   - Preferences panel
   - Testing utilities

## File Structure

```
src/
├── services/
│   └── notificationService.ts          # Core notification logic
├── components/
│   ├── NotificationPermissionBanner.tsx # Permission request UI
│   ├── InAppNotification.tsx           # Individual notification component
│   ├── NotificationManager.tsx         # Notification container/manager
│   ├── NotificationPreferences.tsx     # Settings panel
│   └── NotificationTester.tsx          # Development testing tool
├── hooks/
│   └── useNotifications.ts             # React hook for notification management
├── pages/
│   └── NotificationSettings.tsx        # Settings page
└── styles/
    └── notifications.css               # Notification styling
```

## Usage

### 1. Basic Integration

The notification system is automatically initialized when users are authenticated:

```tsx
// Already integrated in App.tsx
import { NotificationManager } from './components/NotificationManager'
import { useNotifications } from './hooks/useNotifications'

function App() {
  useNotifications() // Initializes notifications
  
  return (
    <>
      <NotificationManager />
      {/* Your app content */}
    </>
  )
}
```

### 2. Permission Banner

Add to your dashboard or main page:

```tsx
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner'

<NotificationPermissionBanner 
  onPermissionGranted={() => console.log('Notifications enabled')}
  onPermissionDenied={() => console.log('Notifications denied')}
/>
```

### 3. Settings Integration

```tsx
import { NotificationPreferencesComponent } from './components/NotificationPreferences'

<NotificationPreferencesComponent />
```

### 4. Manual Notification Triggering

```tsx
import { notificationService } from './services/notificationService'

// Trigger a test notification
const reminder = {
  id: 1,
  medicineId: 1,
  medicineName: 'Aspirin',
  dosage: '500mg',
  reminderTime: '14:30',
  isOverdue: false,
  scheduledFor: new Date(),
  type: 'due' as const
}

notificationService.showNotification(reminder)
```

## API Integration Points

### Backend Endpoints (To Be Implemented)

```typescript
// Get upcoming reminders
GET /api/notifications/reminders/upcoming?userId={id}&minutes=15

// Get today's reminders
GET /api/notifications/reminders/today?userId={id}

// Mark reminder as taken
POST /api/notifications/reminders/{id}/taken
```

### Current Mock Implementation

The service currently uses mock data for testing. Replace the mock methods in `notificationService.ts`:

```typescript
// Replace these methods with actual API calls:
- fetchUpcomingReminders()
- fetchTodayReminders()  
- markReminderAsTaken()
```

## Notification Types

### 1. Upcoming Reminders
- **Trigger**: 5-60 minutes before medicine time (user configurable)
- **Style**: Blue theme with clock icon
- **Behavior**: Auto-dismiss after 10 seconds
- **Actions**: Mark as Taken, Dismiss

### 2. Due Reminders
- **Trigger**: Exactly at medicine time
- **Style**: Yellow/amber theme with pill icon
- **Behavior**: Auto-dismiss after 10 seconds
- **Actions**: Mark as Taken, Dismiss

### 3. Overdue Reminders
- **Trigger**: After medicine time has passed
- **Style**: Red theme with alert icon
- **Behavior**: Persistent (requires user action)
- **Actions**: Mark as Taken, Dismiss

## Browser Support

### Fully Supported
- Chrome (Desktop & Mobile)
- Firefox (Desktop)
- Safari (Desktop & iOS 16.4+)
- Edge (Desktop)

### Limited Support
- Safari (iOS < 16.4) - No browser notifications
- Mobile browsers - May have background limitations

## Configuration

### Environment Variables

```env
# Optional: Custom notification sound
REACT_APP_NOTIFICATION_SOUND_URL=/sounds/notification.mp3

# Optional: Notification check interval (milliseconds)
REACT_APP_NOTIFICATION_CHECK_INTERVAL=60000
```

### User Preferences

Stored in `localStorage` as `notification_preferences`:

```json
{
  "browserNotifications": true,
  "soundAlerts": false,
  "reminderMinutes": 15,
  "autoMarkTaken": false
}
```

## Testing

### Development Mode

In development, a notification tester is available on the dashboard:

```tsx
// Automatically shown in development mode
{process.env.NODE_ENV === 'development' && <NotificationTester />}
```

### Manual Testing

```typescript
import { notificationService } from './services/notificationService'

// Test permission request
await notificationService.requestNotificationPermission()

// Test notification display
notificationService.checkForReminders()
```

## Customization

### Styling

Modify `src/styles/notifications.css` for custom themes:

```css
.notification.overdue {
  border-left-color: #your-color;
  background: #your-background;
}
```

### Sound Alerts

Add notification sound file to `public/` directory:

```typescript
// In notificationService.ts
playNotificationSound(): void {
  const audio = new Audio('/your-notification-sound.mp3')
  audio.play()
}
```

### Custom Notification Types

Extend the `NotificationReminder` interface:

```typescript
export interface NotificationReminder {
  // ... existing fields
  priority?: 'low' | 'medium' | 'high'
  category?: string
}
```

## Security Considerations

1. **Permission Handling**: Always check permission status before showing notifications
2. **User Privacy**: Don't store sensitive medicine information in notifications
3. **Rate Limiting**: Prevent notification spam with proper timing controls
4. **Data Validation**: Validate all notification data before display

## Performance

- **Memory Usage**: Notifications are cleaned up automatically
- **Background Processing**: Minimal impact with 60-second check intervals
- **Network Requests**: Batched API calls for efficiency
- **Storage**: Lightweight localStorage usage for preferences

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**
   - Check browser permission status
   - Verify user is authenticated
   - Ensure notification service is initialized

2. **Permission Denied**
   - Clear browser data and retry
   - Check browser notification settings
   - Use in-app notifications as fallback

3. **Notifications Not Dismissing**
   - Check for JavaScript errors
   - Verify event listeners are properly attached
   - Clear notification cache

### Debug Mode

Enable debug logging:

```typescript
// In notificationService.ts
console.log('🔔 Notification Debug:', { reminder, permission, isInitialized })
```

## Future Enhancements

### Planned Features
- [ ] Push notifications for mobile PWA
- [ ] Notification history/log
- [ ] Smart notification timing based on user behavior
- [ ] Integration with device calendar
- [ ] Offline notification queuing
- [ ] Advanced notification scheduling

### Backend Integration
- [ ] Real-time WebSocket notifications
- [ ] Server-side notification scheduling
- [ ] Cross-device notification sync
- [ ] Analytics and reporting

## Contributing

When adding new notification features:

1. Update the `NotificationReminder` interface
2. Add corresponding UI components
3. Update the service methods
4. Add tests for new functionality
5. Update this documentation

## License

This notification system is part of the MediSort application and follows the same licensing terms.