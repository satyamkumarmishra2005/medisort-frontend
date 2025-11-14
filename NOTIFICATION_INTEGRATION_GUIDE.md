# Quick Integration Guide: Medicine Notification System

## 🚀 Quick Start (5 minutes)

### 1. Files Already Created
✅ All notification files are ready to use:
- `src/services/notificationService.ts` - Core service
- `src/components/NotificationManager.tsx` - UI manager  
- `src/hooks/useNotifications.ts` - React integration
- `src/styles/notifications.css` - Styling

### 2. Already Integrated
✅ The system is already integrated into your app:
- Added to `App.tsx` with `<NotificationManager />`
- Permission banner added to Dashboard
- Styles imported in `index.css`

### 3. Test It Now

1. **Start your app**: `npm start`
2. **Login to your dashboard**
3. **Look for the blue notification banner** asking for permission
4. **Click "Enable Notifications"**
5. **In development mode**, you'll see a "Notification Tester" card
6. **Click the test buttons** to see notifications in action

## 🔧 Backend Integration (When Ready)

### Replace Mock Data

In `src/services/notificationService.ts`, replace these methods:

```typescript
// REPLACE THIS:
async fetchUpcomingReminders(userId: string, minutes: number): Promise<NotificationReminder[]> {
  // Mock implementation
  return this.getMockUpcomingReminders()
}

// WITH THIS:
async fetchUpcomingReminders(userId: string, minutes: number): Promise<NotificationReminder[]> {
  const response = await fetch(`/api/notifications/reminders/upcoming?userId=${userId}&minutes=${minutes}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('medisort_token')}` }
  })
  return response.json()
}
```

### Backend Endpoints Needed

```bash
# Get upcoming reminders (next X minutes)
GET /api/notifications/reminders/upcoming?userId={id}&minutes=15

# Get today's reminders (to check for overdue)
GET /api/notifications/reminders/today?userId={id}

# Mark reminder as taken
POST /api/notifications/reminders/{id}/taken
```

## 📱 User Experience

### What Users See

1. **First Visit**: Blue banner asking to enable notifications
2. **Permission Granted**: Browser notifications + in-app notifications
3. **Permission Denied**: Only in-app notifications (still works!)
4. **Upcoming Medicine**: Blue notification 15 minutes before (configurable)
5. **Due Medicine**: Yellow notification at exact time
6. **Overdue Medicine**: Red persistent notification until action taken

### Notification Actions

- **Mark as Taken**: Removes notification, calls API to log
- **Dismiss**: Hides notification temporarily
- **Click Notification**: Focuses app window

## ⚙️ Settings & Customization

### User Settings Page

Add to your navigation:

```tsx
import NotificationSettings from './pages/NotificationSettings'

// In your routes:
<Route path="/notification-settings" element={<NotificationSettings />} />
```

### Quick Settings Component

Add anywhere in your app:

```tsx
import { NotificationPreferencesComponent } from './components/NotificationPreferences'

<NotificationPreferencesComponent />
```

## 🎯 Key Features Working Now

### ✅ Ready to Use
- Browser notification permission handling
- In-app notification display with actions
- User preference management (stored locally)
- Automatic reminder checking (every 60 seconds)
- Different notification types (upcoming/due/overdue)
- Mobile-responsive design
- Dark mode support

### 🔄 Using Mock Data (Replace When Backend Ready)
- Fetching reminders from API
- Marking reminders as taken
- Real-time reminder data

## 🐛 Troubleshooting

### Notifications Not Showing?

1. **Check browser permission**:
   ```javascript
   console.log('Permission:', Notification.permission)
   ```

2. **Check if service is initialized**:
   ```javascript
   // Should see this in console:
   // "🔔 Initializing Medicine Notification Service"
   // "✅ Medicine Notification Service initialized"
   ```

3. **Test manually**:
   - Use the NotificationTester component (shows in development)
   - Or call: `notificationService.checkForReminders()`

### Permission Issues?

- **Denied**: Clear browser data for your site and retry
- **Not asking**: Check if banner was dismissed (stored in localStorage)
- **Mobile**: Some mobile browsers have limitations

## 📋 Production Checklist

Before going live:

- [ ] Replace mock API calls with real endpoints
- [ ] Test with real user data
- [ ] Configure notification timing preferences
- [ ] Add notification sound file (optional)
- [ ] Test on target browsers/devices
- [ ] Remove NotificationTester from production builds

## 🎨 Customization Examples

### Change Notification Colors

```css
/* In src/styles/notifications.css */
.notification.due {
  border-left-color: #your-brand-color;
  background: #your-background-color;
}
```

### Add Custom Sound

```typescript
// In notificationService.ts
playNotificationSound(): void {
  const audio = new Audio('/sounds/your-sound.mp3')
  audio.play()
}
```

### Modify Check Interval

```typescript
// In notificationService.ts - startReminderChecking()
this.checkInterval = setInterval(() => {
  this.checkForReminders()
}, 30000) // Check every 30 seconds instead of 60
```

## 🚀 Next Steps

1. **Test the current implementation** with mock data
2. **Customize styling** to match your brand
3. **Implement backend endpoints** when ready
4. **Replace mock methods** with real API calls
5. **Deploy and test** with real users

The notification system is fully functional with mock data and ready for production once you connect it to your backend!