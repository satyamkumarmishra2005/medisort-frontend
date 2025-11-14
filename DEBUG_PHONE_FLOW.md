# Debug Phone Number Flow

## 🔍 Debugging Steps

### Step 1: Add Debug Components

Add these components temporarily to your dashboard or any page to debug:

```tsx
import PhoneNumberQuickTest from '../components/PhoneNumberQuickTest'
import UserStateDebugger from '../components/UserStateDebugger'

// In your component JSX
<UserStateDebugger />
<PhoneNumberQuickTest />
```

### Step 2: Check Browser Console

After OAuth login, check the browser console for these logs:

```
🔍 OAuth2 authentication successful, checking if phone number is needed...
🔍 Current token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔍 Current user data in localStorage: {"id":"...","email":"...","phone":""}
🔍 Importing ApiService...
🔍 Making API call to check phone requirement...
🔍 API Base URL: http://localhost:8081
🔍 Endpoint: /needs-phone
📱 Phone check result: {...}
```

### Step 3: Common Issues & Solutions

#### Issue 1: API Call Failing
**Symptoms:** Console shows API errors or network failures
**Check:**
- Is your Spring Boot backend running on `http://localhost:8081`?
- Are the endpoints `/needs-phone` and `/update-phone` accessible?
- Is CORS configured properly?

**Test:** Use the "Test Direct API" button in PhoneNumberQuickTest

#### Issue 2: Backend Returns `needsPhone: false`
**Symptoms:** API succeeds but always returns `needsPhone: false`
**Check:**
- Does the user in your database have a phone number?
- Is the JWT token being decoded correctly to get the user email?
- Is the database query working properly?

**Debug your backend:**
```java
@GetMapping("/needs-phone")
public ResponseEntity<?> checkPhoneNumberStatus(@RequestHeader("Authorization") String authHeader) {
    // Add these debug logs
    String token = authHeader.substring(7);
    String email = jwtUtil.getEmailFromToken(token);
    System.out.println("🔍 Token email: " + email);
    
    Users user = usersRepository.findByEmail(email).orElse(null);
    System.out.println("🔍 Found user: " + (user != null ? user.getEmail() : "null"));
    System.out.println("🔍 User phone: " + (user != null ? user.getPhone() : "null"));
    
    boolean needsPhone = user.getPhone() == null || user.getPhone().trim().isEmpty();
    System.out.println("🔍 Needs phone: " + needsPhone);
    
    return ResponseEntity.ok(Map.of("needsPhone", needsPhone));
}
```

#### Issue 3: User Object Has Phone Number
**Symptoms:** Frontend user object shows phone number when it shouldn't
**Check:**
- Is the phone being set during OAuth profile fetch?
- Is there old data in localStorage?

**Solution:** Clear localStorage and try again:
```javascript
localStorage.removeItem('medisort_user')
localStorage.removeItem('medisort_token')
```

#### Issue 4: Phone Check Not Running
**Symptoms:** No phone check logs in console
**Check:**
- Is the OAuth2Redirect component being reached?
- Is the fetchUserData() promise resolving?
- Are there JavaScript errors preventing execution?

### Step 4: Manual Testing

1. **Clear all data:**
   ```javascript
   localStorage.clear()
   ```

2. **Complete OAuth login**

3. **Check console logs** for the phone check flow

4. **Use debug components** to test API directly

### Step 5: Backend Verification

Test your backend endpoints directly:

```bash
# Get your JWT token from localStorage or console
TOKEN="your_jwt_token_here"

# Test needs-phone endpoint
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:8081/needs-phone

# Should return: {"needsPhone": true} or {"needsPhone": false}
```

### Step 6: Database Check

Check your database directly:

```sql
-- Check if user has phone number
SELECT email, phone FROM users WHERE email = 'your_oauth_email@gmail.com';

-- If phone is NULL or empty, needsPhone should be true
```

## 🎯 Expected Flow

1. **OAuth Login** → `OAuth2Redirect` component
2. **Fetch User Data** → Updates localStorage and context
3. **Check Phone** → API call to `/needs-phone`
4. **If needsPhone: true** → Redirect to `/phone-number-collection`
5. **If needsPhone: false** → Redirect to `/dashboard`

## 🔧 Quick Fixes

### Force Phone Collection (for testing)
Temporarily modify OAuth2Redirect to always show phone collection:

```tsx
// In OAuth2Redirect.tsx, replace the phone check with:
console.log('🧪 FORCING phone collection for testing...')
addToast({
  type: 'success',
  title: 'Google Login Successful!',
  description: 'Please complete your profile by adding your phone number.',
  duration: 4000
})
setTimeout(() => {
  navigate('/phone-number-collection', { replace: true })
}, 1000)
```

### Test Phone Collection Page Directly
Navigate directly to `/phone-number-collection` to test the form:
```
http://localhost:3000/phone-number-collection
```

## 📋 Checklist

- [ ] Backend is running on port 8081
- [ ] Endpoints `/needs-phone` and `/update-phone` exist
- [ ] JWT token is being passed correctly
- [ ] User email is being extracted from JWT
- [ ] Database user lookup is working
- [ ] Phone field check is working correctly
- [ ] Frontend API calls are reaching backend
- [ ] Console shows phone check logs
- [ ] No JavaScript errors in console
- [ ] CORS is configured properly