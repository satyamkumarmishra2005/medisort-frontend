# Authentication Troubleshooting Guide

## Current Issue: 401 Unauthorized Errors

The application is experiencing authentication failures with 401 (Unauthorized) errors when trying to access medicine-related APIs. This guide provides solutions and debugging steps.

## Root Cause Analysis

The errors are occurring because:
1. **No valid authentication token** - User is not logged in
2. **Expired token** - The JWT token has expired and needs refresh
3. **Invalid token format** - Token is corrupted or malformed
4. **Backend authentication issues** - Server-side authentication problems

## Immediate Solutions Implemented

### 1. Enhanced Error Handling in Medicine API

**File: `src/services/medicineApi.ts`**

- Added comprehensive token validation in request interceptor
- Improved response interceptor with better error handling
- Added custom events for authentication failures
- Enhanced logging for debugging

### 2. Authentication Helper Component

**File: `src/components/AuthenticationHelper.tsx`**

- Quick login form for re-authentication
- Token refresh functionality
- Real-time token status monitoring
- Event-driven authentication failure detection

### 3. Authentication Status Banner

**File: `src/components/AuthStatusBanner.tsx`**

- Global authentication status indicator
- Compact display option for different contexts
- Quick refresh and login actions
- Auto-updates on authentication changes

### 4. Authentication Utilities

**File: `src/utils/authUtils.ts`**

- Token expiration checking
- Time remaining calculations
- Auth data management helpers

## How to Use the New Components

### For Users Experiencing Auth Issues

1. **Look for the Authentication Helper** - It appears automatically when authentication fails
2. **Use Quick Login** - Enter your credentials to re-authenticate
3. **Try Token Refresh** - If you have a token, try refreshing it first
4. **Check Token Status** - View detailed token information in debug mode

### For Developers

1. **Monitor Console Logs** - Enhanced logging shows detailed auth flow
2. **Listen for Auth Events** - Components can listen for `auth-failure` events
3. **Use Auth Status Banner** - Add to any page that needs auth status
4. **Implement Auth Helpers** - Use utility functions for token management

## Testing the Fixes

### 1. Test Authentication Flow

```typescript
// In browser console
localStorage.removeItem('medisort_token')
localStorage.removeItem('medisort_user')
// Then try to use medicine features - should show auth helper
```

### 2. Test Token Refresh

```typescript
// In browser console
// Check current token
console.log('Current token:', localStorage.getItem('medisort_token'))
// The system should automatically attempt refresh on 401 errors
```

### 3. Test Event System

```typescript
// In browser console
window.addEventListener('auth-failure', (event) => {
  console.log('Auth failure detected:', event.detail)
})
// Then trigger an auth failure to see the event
```

## Backend Requirements

For the authentication system to work properly, the backend needs:

### 1. Token Refresh Endpoint

```
POST /api/auth/refresh
Headers: Authorization: Bearer <current_token>
Response: { "token": "<new_jwt_token>" }
```

### 2. Proper CORS Configuration

```java
@CrossOrigin(origins = "http://localhost:3000")
```

### 3. JWT Token Structure

Tokens should include:
- `exp` (expiration time)
- `iat` (issued at time)
- `sub` (subject/user ID)
- `username` (user identifier)

## Debugging Steps

### 1. Check Token Status

```typescript
import { isTokenExpired, getTokenTimeRemaining } from '../utils/authUtils'

const token = localStorage.getItem('medisort_token')
console.log('Token expired:', isTokenExpired(token))
console.log('Time remaining:', getTokenTimeRemaining(token))
```

### 2. Verify Backend Connection

```bash
# Test if backend is running
curl http://localhost:8081/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. Check Network Tab

1. Open browser DevTools
2. Go to Network tab
3. Try to perform an action that fails
4. Look for:
   - 401 responses
   - Missing Authorization headers
   - CORS errors

## Common Issues and Solutions

### Issue: "No valid token found"

**Solution:**
1. User needs to log in again
2. Use the AuthenticationHelper component
3. Check if login endpoint is working

### Issue: "Token refresh failed"

**Solution:**
1. Verify backend has refresh endpoint
2. Check if current token is valid for refresh
3. May need to log in again if refresh token is also expired

### Issue: "Network error"

**Solution:**
1. Verify backend is running on port 8081
2. Check CORS configuration
3. Verify API endpoints exist

### Issue: Infinite refresh loops

**Solution:**
1. The `_retry` flag prevents this
2. Check that refresh endpoint doesn't return 401
3. Verify token format is correct

## Monitoring and Alerts

### Console Messages to Watch For

- `🔑 Medicine API - Token found: true/false`
- `🚫 Unauthorized access - token may be expired`
- `✅ Token refreshed successfully`
- `❌ Token refresh failed`
- `🚨 Auth failure detected`

### Custom Events

Listen for these events in your components:

```typescript
window.addEventListener('auth-failure', (event) => {
  const { reason, message } = event.detail
  // Handle auth failure
})
```

## Next Steps

1. **Test the implemented solutions** with the current authentication issues
2. **Monitor console logs** to see if token refresh is working
3. **Verify backend endpoints** are properly configured
4. **Add AuthStatusBanner** to other pages as needed
5. **Consider implementing automatic token refresh** before expiration

## Files Modified

- `src/services/medicineApi.ts` - Enhanced error handling and token management
- `src/components/AuthenticationHelper.tsx` - New component for quick re-auth
- `src/components/AuthStatusBanner.tsx` - New component for auth status display
- `src/components/MedicineReminders.tsx` - Added authentication helper
- `src/pages/RemindersAndNotifications.tsx` - Added auth status banner
- `src/utils/authUtils.ts` - Enhanced utility functions

The authentication system should now be more robust and provide better user experience when authentication issues occur.