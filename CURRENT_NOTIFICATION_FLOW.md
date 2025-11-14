# Current Notification Flow - Complete Overview

## 🔄 **System Architecture**

```
User Login → Notification Service Initialization → Continuous Monitoring → Trigger Notifications
     ↓                    ↓                              ↓                      ↓
Authentication → Permission Request → Timer-Based Checks → Browser + In-App Alerts
```

## 🚀 **1. Initialization Flow**

### **When User Logs In:**
```typescript
// App.tsx loads → useNotifications() hook → notificationService.initialize()
```

1. **`useNotifications` Hook** (in `App.tsx`):
   - Automatically runs when user is authenticated
   - Calls `notificationService.initialize()`

2. **`notificationService.initialize()`**:
   - Requests browser notification permission
   - Starts the reminder checking timer
   - Loads user preferences from localStorage
   - Returns success/failure status

3. **Permission Handling**:
   - Shows permission banner if not granted
   - Stores permission status
   - Enables/disables browser notifications accordingly

## ⏰ **2. Continuous Monitoring System**

### **Timer-Based Checking:**
```typescript
// Every 1 minute: checkIfTimeForDailyReminder()
setInterval(() => {
  this.checkIfTimeForDailyReminder()
}, 1 * 60000) // 1 minute intervals
```

### **Two-Layer Checking System:**

#### **Layer 1: Daily Schedule Checks**
- **Morning (8:00 AM)**: Checks medicines due 6 AM - 12 PM
- **Evening (6:00 PM)**: Checks medicines due 12 PM - 8 PM  
- **Night (10:00 PM)**: Checks medicines due 8 PM - 6 AM

#### **Layer 2: Specific Time Checks** ⭐ **NEW**
- **Every minute**: `checkForSpecificReminderTimes()`
- **Matches exact reminder times** (±5 minute window)
- **Processes both medicine and custom reminders**
- **Prevents duplicate notifications**

## 📊 **3. Data Sources**

### **Medicine Reminders:**
```typescript
// From Backend API
medicineApi.getActiveMedicines() → User's medicines
medicineApi.getMedicineReminders(medicineId) → Reminder times
```

### **Custom Reminders:**
```typescript
// From localStorage
localStorage.getItem('custom_reminders') → User-created reminders
```

### **Status Overrides:**
```typescript
// From localStorage
localStorage.getItem('medicine_reminder_statuses') → Active/Inactive status
```

## 🔍 **4. Reminder Processing Flow**

### **Step 1: Data Collection**
```
Current Time: 20:36
↓
Fetch User Medicines → Get Reminder Times → Check Custom Reminders
↓
Filter Active Reminders → Match Time Windows → Create Notification Objects
```

### **Step 2: Time Matching Logic**
```typescript
// For each reminder:
const reminderTotalMinutes = reminderHour * 60 + reminderMinute
const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()
const timeDiff = Math.abs(currentTotalMinutes - reminderTotalMinutes)

// Trigger if within 5 minutes
if (timeDiff <= 5 && reminder.isActive) {
  showNotification(reminder)
}
```

### **Step 3: Duplicate Prevention**
```typescript
// Track processed times
const currentTimeKey = `${currentTime}-${now.toDateString()}`
const processedTimes = JSON.parse(localStorage.getItem('processed_reminder_times') || '[]')

if (!processedTimes.includes(currentTimeKey)) {
  // Show notification and mark as processed
}
```

## 🔔 **5. Notification Display Flow**

### **When Reminder Matches:**
```
Match Found → Create NotificationReminder Object → showNotification()
     ↓                        ↓                           ↓
Time: 20:36 → Clobazam 08:36 PM → Browser + In-App Alert
```

### **`showNotification()` Process:**
1. **Browser Notification** (if permission granted):
   ```typescript
   new Notification(title, { body, icon, tag })
   ```

2. **In-App Notification**:
   ```typescript
   window.dispatchEvent(new CustomEvent('medicine-notification', { detail: reminder }))
   ```

3. **Sound Alert** (if enabled):
   ```typescript
   new Audio('/notification-sound.mp3').play()
   ```

## 📱 **6. User Interface Components**

### **Notification Display Chain:**
```
NotificationService → CustomEvent → NotificationManager → InAppNotification
        ↓                 ↓               ↓                    ↓
    showNotification → 'medicine-    → Listens for     → Shows popup
                       notification'    events           with actions
```

### **Component Responsibilities:**

1. **`NotificationManager`**:
   - Listens for notification events
   - Manages active notification list
   - Handles stacking and positioning

2. **`InAppNotification`**:
   - Displays individual notification UI
   - Provides "Mark as Taken" and "Dismiss" buttons
   - Handles user interactions

3. **`NotificationPermissionBanner`**:
   - Shows permission request UI
   - Handles permission grant/deny

## 🎛️ **7. User Preferences System**

### **Stored in localStorage:**
```typescript
notification_preferences: {
  browserNotifications: boolean,
  soundAlerts: boolean,
  reminderMinutes: number,
  autoMarkTaken: boolean
}
```

### **Preference Impact:**
- **browserNotifications**: Enables/disables browser popups
- **soundAlerts**: Plays notification sound
- **reminderMinutes**: Used for general reminder timing (not specific times)
- **autoMarkTaken**: Future feature for automatic marking

## 🔧 **8. Current Reminder Example (Your Clobazam)**

### **Your Setup:**
- **Medicine**: Clobazam
- **Time**: 08:36 PM (20:36)
- **Status**: Active
- **Type**: Medicine Reminder

### **Processing Flow:**
```
Every Minute Check → Current Time: 20:36
↓
checkForSpecificReminderTimes() → Find Clobazam reminder at 20:36
↓
timeDiff = |20:36 - 20:36| = 0 minutes ≤ 5 minutes ✅
↓
Create NotificationReminder object → showNotification()
↓
Browser Notification + In-App Notification + Sound (if enabled)
```

## 📝 **9. Logging and Debugging**

### **Console Logs You'll See:**
```
🔔 Initializing Medicine Notification Service
✅ Medicine Notification Service initialized
🕐 Checking for reminders at 20:36
📡 Fetching user medicines from API
✅ Found 1 active medicines
🔔 Found 1 reminders for 20:36: [Clobazam reminder]
💊 Showing notification for Clobazam at 20:36
```

## 🚨 **10. Troubleshooting Points**

### **If Notifications Don't Show:**
1. **Check browser permission**: `Notification.permission`
2. **Check console logs**: Look for error messages
3. **Verify reminder is active**: Check reminder status
4. **Check time matching**: Ensure current time is within 5 minutes
5. **Check processed times**: May have already been shown today

### **Common Issues:**
- **Permission denied**: Browser notifications disabled
- **Time mismatch**: Reminder time doesn't match current time
- **Already processed**: Notification shown earlier today
- **Inactive reminder**: Reminder was deactivated
- **API errors**: Medicine data not loading

## 🎯 **Summary**

**Your notification system now works as follows:**
1. **Continuous monitoring** every minute
2. **Dual-layer checking** (daily schedule + specific times)
3. **Real medicine data** from your database
4. **Custom reminders** from localStorage
5. **Duplicate prevention** with time tracking
6. **Multi-channel notifications** (browser + in-app)
7. **User preferences** for customization

**For your 8:36 PM Clobazam reminder, the system will trigger notifications every day at 8:36 PM (±5 minutes) as long as the reminder is active and you're logged in.**