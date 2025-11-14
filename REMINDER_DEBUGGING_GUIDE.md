# Reminder Debugging Guide

## 🔍 **How to Debug Your Reminder Issue**

### **Step 1: Check Console Logs**
Open your browser's Developer Tools (F12) and go to the Console tab. You should see logs like:

```
🕐 [8:36:45 PM] Checking for reminders at 20:36
📊 Found 1 user medicines: [{id: 123, name: "Clobazam"}]
💊 Medicine "Clobazam" has 1 reminders: [{time: "20:36", active: true}]
⏰ Checking reminder: 20:36 vs current 20:36
   - Time difference: 0 minutes
   - Is active: true
   - Within window (≤5 min): true
   - Will trigger: true
✅ Found 1 matching reminders for Clobazam
🔔 TRIGGERING 1 notifications for 20:36:
   - Clobazam at 20:36
🚀 Showing notification for: Clobazam
🔔 showNotification called for: Clobazam at 20:36
```

### **Step 2: Use the Debug Button**
1. Go to **Reminders & Notifications** page
2. Click the **"🔍 Debug: Check Current Time"** button
3. Watch the console for detailed logs

### **Step 3: Check Common Issues**

#### **Issue 1: Notification Service Not Running**
**Look for:** `🔔 Initializing Medicine Notification Service`
**If missing:** The service didn't start. Check if you're logged in.

#### **Issue 2: No Medicines Found**
**Look for:** `📊 Found 0 user medicines`
**If true:** Your medicines aren't loading from the API.

#### **Issue 3: No Reminders for Medicine**
**Look for:** `💊 Medicine "Clobazam" has 0 reminders`
**If true:** The reminder wasn't saved properly to the backend.

#### **Issue 4: Reminder is Inactive**
**Look for:** `- Is active: false`
**If true:** The reminder was deactivated. Check the toggle button.

#### **Issue 5: Time Mismatch**
**Look for:** `- Time difference: 15 minutes` (or > 5)
**If true:** The current time doesn't match the reminder time.

#### **Issue 6: Already Processed**
**Look for:** `⏭️ Already processed 20:36 today, skipping`
**If true:** The notification was already shown today.

#### **Issue 7: Browser Permission Denied**
**Look for:** `❌ Browser notification skipped - permission: denied`
**If true:** Enable browser notifications in your browser settings.

### **Step 4: Manual Testing**

#### **Test Current Time Matching:**
```javascript
// In browser console:
const now = new Date()
const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
console.log('Current time:', currentTime)
console.log('Your reminder time: 20:36')
console.log('Match?', currentTime === '20:36')
```

#### **Check Processed Times:**
```javascript
// In browser console:
const processed = JSON.parse(localStorage.getItem('processed_reminder_times') || '[]')
console.log('Processed times today:', processed)
```

#### **Clear Processed Times (for re-testing):**
```javascript
// In browser console:
localStorage.removeItem('processed_reminder_times')
console.log('Cleared processed times - can test again')
```

### **Step 5: Check Reminder Data**

#### **Check Medicine Reminders:**
```javascript
// In browser console (replace 123 with your medicine ID):
fetch('/api/medicines/123/reminders', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('medisort_token')}` }
})
.then(r => r.json())
.then(data => console.log('Medicine reminders:', data))
```

#### **Check Custom Reminders:**
```javascript
// In browser console:
const custom = JSON.parse(localStorage.getItem('custom_reminders') || '[]')
console.log('Custom reminders:', custom)
```

## 🛠️ **Quick Fixes**

### **Fix 1: Re-enable Notifications**
1. Go to browser settings
2. Find site permissions for your app
3. Enable notifications

### **Fix 2: Clear Processed Times**
```javascript
localStorage.removeItem('processed_reminder_times')
```

### **Fix 3: Restart Notification Service**
1. Refresh the page
2. Look for initialization logs

### **Fix 4: Check Reminder Status**
1. Go to Reminders page
2. Ensure reminder shows "Active" badge
3. Click "Activate" if needed

## 🎯 **Expected Behavior**

**At 8:36 PM, you should see:**
1. **Console logs** showing the reminder was found and triggered
2. **Browser notification** popup (if permission granted)
3. **In-app notification** with "Mark as Taken" button
4. **Sound alert** (if enabled in preferences)

## 📞 **If Still Not Working**

**Share these details:**
1. **Console logs** from the debug button
2. **Current time** when testing
3. **Reminder time** set in the system
4. **Browser notification permission** status
5. **Any error messages** in console

**Most likely causes:**
- Reminder is inactive
- Time already processed today
- Browser notifications blocked
- Medicine data not loading from API