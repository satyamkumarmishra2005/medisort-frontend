# Backend Integration Guide for Refill Notification System

## Overview
This guide explains how to integrate the frontend refill notification system with the backend RefillController APIs.

## Backend APIs Implemented ✅

Based on the RefillController you provided, the following APIs are available:

### 1. Refill Medicine
```
POST /api/medicines/{id}/refill
Body: { "refillQuantity": number }
Response: {
  "success": true,
  "message": "Medicine refilled successfully",
  "medicine": Medicine,
  "newEndDate": "2024-01-15"
}
```

### 2. Add Refill Reminder
```
POST /api/medicines/{id}/refill-reminders
Body: {
  "reminderDate": "2024-01-15",
  "reminderTimes": ["09:00", "18:00"],
  "daysBeforeEnd": 3
}
Response: {
  "success": true,
  "message": "Refill reminder added successfully",
  "reminder": RefillReminder
}
```

### 3. Get Refill Status
```
GET /api/medicines/{id}/refill-status
Response: {
  "medicineId": number,
  "currentStock": number,
  "daysUntilEmpty": number,
  "needsRefill": boolean,
  "refillAlertLevel": "none" | "warning" | "urgent" | "critical",
  "expectedEndDate": "2024-01-15"
}
```

### 4. Get Refill Reminders
```
GET /api/medicines/{id}/refill-reminders
Response: {
  "success": true,
  "reminders": RefillReminder[]
}
```

### 5. Get Today's Refill Reminders
```
GET /api/medicines/refill-reminders/today
Response: {
  "success": true,
  "reminders": RefillReminder[],
  "count": number
}
```

### 6. Get Medicines Needing Refill
```
GET /api/medicines/refill-needed?daysAhead=3
Response: {
  "success": true,
  "medicines": Medicine[],
  "count": number,
  "daysAhead": number
}
```

### 7. Update Reminder Status
```
PUT /api/medicines/refill-reminders/{reminderId}/status
Body: { "status": "PENDING" | "SENT" | "ACKNOWLEDGED" | "DISMISSED" }
Response: {
  "success": true,
  "message": "Reminder status updated to {status}"
}
```

### 8. Mark Reminder as Sent
```
PUT /api/medicines/refill-reminders/{reminderId}/mark-sent
Response: {
  "success": true,
  "message": "Reminder marked as sent",
  "reminder": RefillReminder
}
```

### 9. Delete Refill Reminder
```
DELETE /api/medicines/refill-reminders/{reminderId}
Response: {
  "success": true,
  "message": "Refill reminder deleted successfully"
}
```

### 10. Schedule Refill Reminders for All Medicines
```
POST /api/medicines/schedule-refill-reminders
Response: {
  "success": true,
  "message": "Refill reminders scheduled for all active medicines"
}
```

## Frontend Integration Status ✅

### Updated Components:
1. **medicineApi.ts** - Added all new API methods
2. **refillNotificationService.ts** - Updated to use backend APIs
3. **RefillAlertsDashboard.tsx** - Dark theme with backend integration
4. **RefillNotificationModal.tsx** - Dark theme with refill confirmation
5. **RefillSystemTester.tsx** - Test component for API validation

### Integration Points:

#### 1. Medicine Refill Flow
```typescript
// Frontend calls backend to refill medicine
const updatedMedicine = await medicineApi.refillMedicine(medicineId, refillQuantity)

// Backend updates stock and recalculates end date
// Frontend removes alert and schedules new reminders
```

#### 2. Refill Alert Detection
```typescript
// Frontend checks backend for medicines needing refill
const medicinesNeedingRefill = await medicineApi.getMedicinesNeedingRefill(3)

// Backend returns medicines with <= 3 days remaining
// Frontend creates local alerts for notification scheduling
```

#### 3. Notification Scheduling
```typescript
// Frontend schedules notifications based on days remaining
// Backend tracks reminder status and sent timestamps
await medicineApi.markRefillReminderAsSent(reminderId)
```

## Testing the Integration

### 1. Use the RefillSystemTester Component
Add the tester to your dashboard or create a test page:

```typescript
import { RefillSystemTester } from '../components/RefillSystemTester'

// In your component
<RefillSystemTester />
```

### 2. Test Scenarios

#### Scenario 1: Medicine Approaching End Date
1. Create a medicine with 3 days remaining
2. Check if it appears in "medicines needing refill"
3. Verify refill alert is created
4. Test refill confirmation

#### Scenario 2: Progressive Notifications
1. Set medicine to 3 days remaining
2. Verify 1 notification per day
3. Advance to 2 days remaining
4. Verify 2 notifications per day
5. Advance to 1 day remaining
6. Verify 3 notifications per day

#### Scenario 3: Refill Confirmation
1. Trigger refill notification
2. Enter refill quantity
3. Confirm refill
4. Verify stock updated
5. Verify new end date calculated
6. Verify alert removed

### 3. API Testing Commands

```bash
# Test get medicines needing refill
curl -X GET "http://localhost:8081/api/medicines/refill-needed?daysAhead=3" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test refill medicine
curl -X POST "http://localhost:8081/api/medicines/1/refill" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"refillQuantity": 30}'

# Test get refill status
curl -X GET "http://localhost:8081/api/medicines/1/refill-status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test today's refill reminders
curl -X GET "http://localhost:8081/api/medicines/refill-reminders/today" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

### Frontend Error Handling
```typescript
try {
  const result = await medicineApi.refillMedicine(medicineId, quantity)
  // Success handling
} catch (error) {
  // Error handling with user feedback
  addToast({
    type: 'error',
    title: 'Refill Failed',
    description: error.message,
    duration: 4000
  })
}
```

### Backend Error Responses
The backend returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Configuration

### Frontend Configuration
```typescript
// In refillNotificationService.ts
const NOTIFICATION_SCHEDULE = {
  warning: { days: 3, frequency: 1, times: ['09:00'] },
  urgent: { days: 2, frequency: 2, times: ['09:00', '18:00'] },
  critical: { days: 1, frequency: 3, times: ['09:00', '14:00', '20:00'] }
}
```

### Backend Configuration
The backend uses the ReminderStatus enum:
- `PENDING` - Reminder created but not sent
- `SENT` - Reminder sent to user
- `ACKNOWLEDGED` - User acknowledged reminder
- `DISMISSED` - User dismissed reminder

## Deployment Checklist

### Frontend Deployment
- [ ] Update API base URL for production
- [ ] Test notification permissions
- [ ] Verify localStorage persistence
- [ ] Test cross-browser compatibility

### Backend Deployment
- [ ] Database migrations for RefillReminder table
- [ ] Configure CORS for frontend domain
- [ ] Set up scheduled jobs for reminder processing
- [ ] Test authentication and authorization

### Integration Testing
- [ ] End-to-end refill flow
- [ ] Progressive notification schedule
- [ ] Error handling scenarios
- [ ] Performance under load
- [ ] Cross-device synchronization

## Monitoring and Analytics

### Frontend Metrics
- Notification delivery success rate
- User refill confirmation rate
- Alert dismissal patterns
- API response times

### Backend Metrics
- Refill API usage
- Reminder creation/deletion rates
- Medicine stock levels
- User engagement with refill system

## Troubleshooting

### Common Issues

#### 1. Notifications Not Appearing
- Check browser notification permissions
- Verify API responses in network tab
- Check console for JavaScript errors
- Ensure refillNotificationService is initialized

#### 2. Refill Confirmation Failing
- Verify authentication token
- Check medicine ID validity
- Ensure refill quantity is positive
- Check backend logs for errors

#### 3. Alerts Not Updating
- Check localStorage for cached data
- Verify API endpoints are accessible
- Test with RefillSystemTester component
- Clear browser cache and localStorage

### Debug Commands

```typescript
// Check refill notification service status
console.log(refillNotificationService.getDebugInfo())

// Check active refill alerts
console.log(refillNotificationService.getActiveRefillAlerts())

// Test API connectivity
await medicineApi.getMedicinesNeedingRefill(3)
```

## Future Enhancements

### Phase 2 Features
- SMS/Email notifications
- Pharmacy integration
- Automatic refill ordering
- Insurance coverage checking
- Smart refill predictions

### Performance Optimizations
- Batch API calls
- Caching strategies
- Background sync
- Offline support

## Support

For issues with the refill notification system:
1. Check the RefillSystemTester for API connectivity
2. Review browser console for errors
3. Verify backend logs for API failures
4. Test with different user accounts and medicines

The system is designed to be resilient and will fallback to local calculations if backend APIs are unavailable.