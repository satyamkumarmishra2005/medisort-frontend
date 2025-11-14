# Medicine Refill Notification System

## Overview
This document describes the comprehensive medicine refill notification system that automatically tracks medicine stock levels and sends progressive notifications to users when medicines are running low.

## System Flow

### Important: Two Separate Notification Systems

#### 1. Medicine Reminders (Custom Times Only)
- **User-controlled**: Only shows reminders that users manually set
- **Custom times**: Users choose specific times to take medicines
- **No automatic defaults**: System does NOT create automatic reminders based on dosesPerDay
- **Purpose**: Help users remember to take medicines at their chosen times

#### 2. Refill Notifications (Automatic Stock Monitoring)
- **System-controlled**: Automatically monitors medicine stock levels
- **Progressive schedule**: 3-2-1 day notification progression
- **Stock-based**: Triggered by remaining medicine quantity
- **Purpose**: Alert users when medicines need refilling

### Medicine End Date Calculation
When a user adds a medicine, the system calculates the expected end date:
```
Expected End Date = Start Date + (Total Quantity / Doses Per Day)
```

### Refill Alert Triggers
The system monitors medicines and creates refill alerts when:
- **3 days before end date**: Warning level alert
- **2 days before end date**: Urgent level alert  
- **1 day before end date**: Critical level alert
- **After end date**: Medicine marked as "Finished"

### 3. Progressive Notification Schedule

#### Day 3 (Warning)
- **1 notification per day** at 9:00 AM
- Message: "Your medicine [Name] will finish in 3 days. Please refill it soon."

#### Day 2 (Urgent)  
- **2 notifications per day** at 9:00 AM and 6:00 PM
- Message: "Your medicine [Name] will finish in 2 days. Please refill it soon."

#### Day 1 (Critical)
- **3 notifications per day** at 9:00 AM, 2:00 PM, and 8:00 PM
- Message: "Your medicine [Name] will finish tomorrow. Please refill it today."

#### Day 0+ (Finished)
- **3 notifications per day** (continues until refilled)
- Message: "Your medicine [Name] has finished. Please refill it immediately."

### 4. User Actions

#### Refill Confirmation
When user confirms refill:
1. User enters refill quantity
2. System updates medicine stock
3. Recalculates new expected end date
4. Removes current refill alert
5. Schedules future alerts based on new end date

#### Dismiss Alert
When user dismisses alert:
1. Stops notifications for current day only
2. Resumes normal schedule next day
3. Does not affect medicine status

## Frontend Implementation

### Core Services

#### RefillNotificationService (`src/services/refillNotificationService.ts`)
- Monitors all user medicines for refill needs
- Calculates days remaining and alert levels
- Manages notification scheduling and frequency
- Handles refill confirmations and dismissals

#### NotificationService Integration
- Extended existing notification service to include refill alerts
- Unified notification permission handling
- Consistent browser and in-app notification display

### UI Components

#### RefillAlertsDashboard (`src/components/RefillAlertsDashboard.tsx`)
- Displays all active refill alerts on dashboard
- Shows urgency levels with color coding
- Allows quick access to refill actions

#### RefillNotificationModal (`src/components/RefillNotificationModal.tsx`)
- Modal for handling refill confirmations
- Input for refill quantity
- Options to confirm refill or dismiss alert

#### RefillNotificationHandler (`src/components/RefillNotificationHandler.tsx`)
- Global handler for refill notification events
- Manages modal display for notifications
- Integrated into main Layout component

### Dashboard Integration
- Added RefillAlertsDashboard to main Dashboard page
- Replaces empty TodaysReminders section
- Shows real-time refill status for all medicines

## Backend API Requirements

### Existing APIs (Already Available)
✅ `GET /api/medicines/user/active` - Get user's active medicines
✅ `GET /api/medicines/{id}` - Get specific medicine details  
✅ `POST /api/medicines/{id}/refill` - Refill medicine stock
✅ `PUT /api/medicines/{id}/stock` - Update medicine stock

### Required New APIs

#### 1. Refill Status Endpoint
```
GET /api/medicines/{id}/refill-status
Response: {
  medicineId: number,
  currentStock: number,
  daysUntilEmpty: number,
  needsRefill: boolean,
  refillAlertLevel: 'none' | 'warning' | 'urgent' | 'critical',
  expectedEndDate: string
}
```

#### 2. Bulk Refill Status
```
GET /api/medicines/refill-status/all
Response: RefillStatus[]
```

#### 3. Refill Reminders Management
```
POST /api/medicines/{id}/refill-reminders
Body: {
  reminderDate: string,
  reminderTimes: string[],
  daysBeforeEnd: number
}

GET /api/medicines/{id}/refill-reminders
Response: RefillReminder[]

GET /api/medicines/refill-reminders/today
Response: RefillReminder[]
```

#### 4. Medicine Stock History
```
GET /api/medicines/{id}/stock-history
Response: {
  medicineId: number,
  stockHistory: [{
    date: string,
    stockLevel: number,
    action: 'refill' | 'consumption' | 'adjustment',
    quantity: number,
    notes?: string
  }]
}
```

## Database Schema Updates

### RefillReminders Table
```sql
CREATE TABLE refill_reminders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  medicine_id BIGINT NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_times JSON NOT NULL,
  days_before_end INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);
```

### StockHistory Table
```sql
CREATE TABLE stock_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  medicine_id BIGINT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  action_type ENUM('refill', 'consumption', 'adjustment') NOT NULL,
  quantity_changed INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);
```

### Medicine Table Updates
```sql
ALTER TABLE medicines 
ADD COLUMN expected_end_date DATE,
ADD COLUMN last_refill_date DATE,
ADD COLUMN refill_alert_level ENUM('none', 'warning', 'urgent', 'critical') DEFAULT 'none';
```

## Configuration Options

### Notification Timing
```typescript
const NOTIFICATION_SCHEDULE = {
  warning: { days: 3, frequency: 1, times: ['09:00'] },
  urgent: { days: 2, frequency: 2, times: ['09:00', '18:00'] },
  critical: { days: 1, frequency: 3, times: ['09:00', '14:00', '20:00'] }
}
```

### Alert Thresholds
```typescript
const ALERT_THRESHOLDS = {
  warningDays: 3,
  urgentDays: 2, 
  criticalDays: 1,
  checkIntervalHours: 1
}
```

## Testing Scenarios

### Test Case 1: New Medicine Added
1. Add medicine with 30 days supply
2. Verify expected end date calculation
3. Verify no immediate alerts (>3 days remaining)

### Test Case 2: Medicine Approaching End
1. Set medicine to have 3 days remaining
2. Verify warning alert created
3. Verify 1 notification sent at 9 AM

### Test Case 3: Progressive Notifications
1. Medicine with 2 days remaining
2. Verify 2 notifications sent (9 AM, 6 PM)
3. Advance to 1 day remaining
4. Verify 3 notifications sent (9 AM, 2 PM, 8 PM)

### Test Case 4: Refill Confirmation
1. User confirms refill with quantity
2. Verify stock updated
3. Verify new end date calculated
4. Verify alerts cleared

### Test Case 5: Medicine Finished
1. Medicine reaches 0 stock
2. Verify marked as "Finished" 
3. Verify continued critical notifications
4. Verify appears in "Finished" category

## Error Handling

### Network Failures
- Retry API calls with exponential backoff
- Cache refill alerts locally
- Show offline indicators when appropriate

### Invalid Data
- Validate refill quantities (positive numbers)
- Handle missing medicine data gracefully
- Provide clear error messages to users

### Permission Issues
- Handle notification permission denial
- Provide alternative in-app notifications
- Guide users to enable permissions

## Performance Considerations

### Efficient Checking
- Check refill status every hour (not every minute)
- Use bulk APIs when possible
- Cache frequently accessed data

### Storage Management
- Clean up old notification flags
- Limit localStorage usage
- Implement data retention policies

## Future Enhancements

### Smart Predictions
- Learn user consumption patterns
- Predict refill needs more accurately
- Suggest optimal refill quantities

### Integration Options
- Pharmacy API integration
- Automatic refill ordering
- Insurance coverage checking

### Advanced Notifications
- SMS/Email notifications
- Push notifications for mobile app
- Calendar integration for refill reminders

## Implementation Status

### ✅ Completed
- RefillNotificationService implementation
- UI components for refill management
- Dashboard integration
- Progressive notification logic
- Local storage persistence

### ⏳ Pending Backend APIs
- Refill status endpoints
- Refill reminders management
- Stock history tracking
- Database schema updates

### 🔄 Next Steps
1. Implement required backend APIs
2. Test end-to-end refill flow
3. Add comprehensive error handling
4. Implement performance optimizations
5. Add user preference settings