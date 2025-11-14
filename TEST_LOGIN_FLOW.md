# MFA Login Flow Test Guide

## Current Status
✅ Backend is running on port 8081
✅ Backend responds to login requests
✅ Fixed the "body stream already read" error
✅ MFA components are integrated into login flow

## Test Steps

### 1. Test Basic Login (No MFA)
1. Open your React app in browser
2. Try logging in with valid credentials
3. Should either:
   - Login directly (if MFA is disabled)
   - Show MFA verification form (if MFA is enabled)

### 2. Test MFA Flow
1. Login with an account that has MFA enabled
2. Should see MFA verification form
3. Enter the 6-digit code from email
4. Should complete login and redirect to dashboard

### 3. Test Error Handling
1. Try invalid credentials
2. Should show appropriate error message
3. Try expired MFA code
4. Should show error and allow retry

## Debug Tools

### Browser Console Test
Open browser console and run:
```javascript
// Test backend connection
fetch('http://localhost:8081/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test' })
})
.then(r => r.text())
.then(console.log)
.catch(console.error)
```

### Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try login
4. Check the request/response details

## Expected Backend Responses

### Direct Login (No MFA)
```
Content-Type: text/plain
Body: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (JWT token)
```

### MFA Required
```
Content-Type: application/json
Body: {
  "requiresMfa": true,
  "tempToken": "temp_token_here"
}
```

### Error Response
```
Status: 401
Body: "Invalid credentials" or error message
```

## Troubleshooting

### If login still fails:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify backend endpoints are working
4. Check CORS configuration in backend

### If MFA doesn't work:
1. Verify MFA is enabled in backend
2. Check email for OTP codes
3. Verify MFA endpoints are accessible
4. Check session/token handling

## Backend Endpoints Used
- `POST /api/auth/login` - Initial login
- `POST /api/auth/verify-mfa-login` - MFA verification
- `GET /api/user/profile` - User profile after login
- `GET /api/user/mfa-status-session` - Check MFA status
- `POST /api/user/enable-mfa-session` - Enable MFA
- `POST /api/user/verify-mfa-setup-session` - Verify MFA setup
- `POST /api/user/disable-mfa-session` - Disable MFA