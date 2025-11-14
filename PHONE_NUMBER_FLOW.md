# Phone Number Collection Flow

This document explains how the phone number collection flow works after Google OAuth login.

## Overview

After a successful Google OAuth login, the system checks if the user has a phone number in the database. If not, it shows a phone number collection form before redirecting to the main dashboard.

## Flow Diagram

```
Google OAuth Login
        ↓
OAuth2Redirect Component
        ↓
Check /api/user/needs-phone
        ↓
    needsPhone?
   ↙         ↘
 Yes          No
  ↓            ↓
Phone Number   Dashboard
Collection
  ↓
Submit Phone
  ↓
Dashboard
```

## API Endpoints

### GET /needs-phone
Checks if the current user needs to provide a phone number.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "needsPhone": boolean
}
```

### POST /update-phone
Updates the user's phone number.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "phoneNumber": "1234567890"
}
```

**Response:**
- Success: HTTP 200 with `{"message": "Phone number updated successfully"}`
- Error: HTTP 4xx/5xx with `{"error": "error message"}`

## Components

### PhoneNumberModal
A reusable modal component for collecting phone numbers.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Called when modal should close
- `onSubmit: (phoneNumber: string) => Promise<void>` - Called when form is submitted
- `isLoading?: boolean` - Shows loading state

**Usage:**
```tsx
import PhoneNumberModal from '../components/PhoneNumberModal'
import { usePhoneNumberCollection } from '../hooks/usePhoneNumberCollection'

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isLoading, submitPhoneNumber } = usePhoneNumberCollection()

  const handlePhoneSubmit = async (phoneNumber: string) => {
    const success = await submitPhoneNumber(phoneNumber)
    if (success) {
      setIsModalOpen(false)
    }
  }

  return (
    <PhoneNumberModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handlePhoneSubmit}
      isLoading={isLoading}
    />
  )
}
```

### PhoneNumberCollection Page
A full-page component for collecting phone numbers, used in the OAuth flow.

**Route:** `/phone-number-collection`

### usePhoneNumberCollection Hook
A custom hook that provides phone number collection functionality.

**Returns:**
- `isLoading: boolean` - Loading state
- `checkAndRedirectIfNeeded: () => Promise<boolean>` - Checks if phone is needed and redirects
- `submitPhoneNumber: (phoneNumber: string) => Promise<boolean>` - Submits phone number

## Phone Number Validation

The system validates phone numbers with the following rules:
- Must be exactly 10 digits (US format)
- Automatically formats as (XXX) XXX-XXXX for display
- Strips formatting before API submission

## Error Handling

The system includes comprehensive error handling:
- Network errors
- API validation errors
- User-friendly error messages via toast notifications
- Graceful fallbacks if phone check fails

## Integration Points

### OAuth2Redirect Component
After successful OAuth login, the component:
1. Fetches user data
2. Calls `ApiService.checkNeedsPhone()`
3. Redirects to `/phone-number-collection` if needed
4. Otherwise redirects to `/dashboard`

### AuthContext
The AuthContext includes methods for:
- `checkNeedsPhone()` - Check if phone is required
- `updatePhoneNumber(phoneNumber)` - Update user's phone number

### ApiService
The ApiService includes methods for:
- `checkNeedsPhone()` - API call to check phone requirement
- `updatePhoneNumber(phoneNumber)` - API call to update phone

## Customization

### Styling
The components use Tailwind CSS classes and can be customized by:
- Modifying the component styles
- Updating the theme configuration
- Using CSS custom properties

### Validation
Phone number validation can be customized by modifying the `validatePhoneNumber` function in the components.

### Flow Behavior
The flow behavior can be customized by:
- Modifying the redirect logic in `OAuth2Redirect`
- Changing the "Skip for Now" behavior
- Adding additional validation steps

## Backend Integration ✅

Your backend endpoints are already implemented and ready to use:

- `GET /needs-phone` - Returns `{"needsPhone": boolean}`
- `POST /update-phone` - Accepts `{"phoneNumber": "1234567890"}`

Both endpoints require `Authorization: Bearer <token>` header and handle all error cases properly.

## Testing

### Quick Integration Test

Add this component temporarily to test the complete flow:

```tsx
import PhoneNumberIntegrationTest from '../components/PhoneNumberIntegrationTest'

// Add to any page for testing
<PhoneNumberIntegrationTest />
```

### Manual Testing Steps

1. **Complete Google OAuth login**
2. **Backend checks** `/needs-phone` endpoint
3. **If phone needed** → Redirect to `/phone-number-collection`
4. **Enter phone number** → Submit to `/update-phone`
5. **Success** → Redirect to `/dashboard`

### Test Scenarios

- ✅ User with no phone number (should show collection form)
- ✅ User with existing phone number (should skip to dashboard)
- ✅ Network errors during phone check
- ✅ Invalid phone number formats
- ✅ API errors during submission
- ✅ User skipping phone number entry

## Security Considerations

- Phone numbers are validated on both client and server
- API endpoints require authentication tokens
- Phone numbers are stored securely in the database
- No sensitive data is logged in console outputs

## Future Enhancements

Potential improvements to consider:
- International phone number support
- SMS verification of phone numbers
- Phone number change notifications
- Bulk phone number updates for admin users