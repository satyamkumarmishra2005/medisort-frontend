# Medicine Management System - Frontend

A comprehensive React frontend for managing medicines, reminders, and tracking medication schedules.

## Features Implemented

### 1. Medicine List Component (`MedicineList.tsx`)
- **Display**: Shows all medicines in a responsive card format
- **Columns**: Medicine name, dosage, frequency, instructions, expiry date, category
- **Search**: Real-time search functionality across medicine names
- **Filter**: Filter by medicine categories (Prescription, OTC, Supplements, etc.)
- **Pagination**: Handles large medicine lists with pagination (10 items per page)
- **Status Indicators**: Visual badges for expired and expiring medicines
- **Actions**: Edit and delete functionality with confirmation dialogs

### 2. Add Medicine Form (`MedicineForm.tsx`)
- **Form Fields**:
  - Medicine name (required)
  - Dosage (required) - e.g., "500mg", "1 tablet", "5ml"
  - Frequency (required) - dropdown with common options
  - Instructions (optional) - textarea for special notes
  - Expiry date (required) - date picker with validation
  - Category (required) - dropdown with predefined categories
- **Validation**: 
  - Required field validation
  - Expiry date cannot be in the past
  - Real-time error display
- **API Integration**: Submits to `POST /api/medicines` endpoint

### 3. Edit Medicine Component
- **Pre-population**: Automatically loads existing medicine data
- **Update API**: Uses `PUT /api/medicines/{id}` endpoint
- **Delete Functionality**: Includes delete button with confirmation dialog
- **Form Validation**: Same validation rules as add form

### 4. Medicine Reminder Integration (`MedicineReminders.tsx`)
- **Reminder Settings**:
  - Select medicine from dropdown
  - Set reminder time (time picker)
  - Choose frequency (daily, weekly, monthly, as-needed)
  - Toggle active/inactive status
- **API Endpoints**: 
  - `GET /api/medicines-reminder` - fetch reminders
  - `POST /api/medicines-reminder` - create reminder
  - `PUT /api/medicines-reminder/{id}` - update reminder
  - `DELETE /api/medicines-reminder/{id}` - delete reminder
- **Reminder Management**:
  - View all active reminders
  - Edit existing reminders
  - Activate/deactivate reminders
  - Delete reminders with confirmation

### 5. Medicine Dashboard (`MedicineDashboard.tsx`)
- **Statistics Cards**:
  - Total medicines count
  - Medicines expiring this week
  - Medicines expiring this month
  - Active reminders count
- **Recent Medicines**: Shows last 5 added medicines
- **Expiring Soon Widget**: Highlights medicines expiring within 30 days
- **Quick Actions**: Easy access buttons for common tasks
- **Visual Indicators**: Color-coded badges for different statuses

### 6. API Integration (`medicineApi.ts`)
- **Axios Configuration**: 
  - Base URL configuration
  - Request/response interceptors
  - Automatic JWT token inclusion
  - Error handling and retry logic
- **Authentication**: JWT token management with automatic refresh
- **Error Handling**: Comprehensive error messages and user feedback
- **Loading States**: Proper loading indicators throughout the app

### 7. Routing System
- **URL Structure**:
  - `/medicines` - Medicine list page
  - `/medicines/add` - Add new medicine
  - `/medicines/edit/:id` - Edit specific medicine
  - `/medicines/reminders` - Reminder management
- **Navigation**: Seamless navigation between different views
- **URL-based State**: Current view determined by URL path

## Technical Implementation

### Components Architecture
```
src/
├── components/
│   ├── MedicineForm.tsx          # Add/Edit medicine form
│   ├── MedicineList.tsx          # Medicine listing with search/filter
│   ├── MedicineReminders.tsx     # Reminder management
│   └── MedicineDashboard.tsx     # Dashboard with stats
├── services/
│   └── medicineApi.ts            # API service layer
├── utils/
│   └── auth.ts                   # Authentication utilities
└── pages/
    ├── Medicines.tsx             # Main medicine page with routing
    └── Reminders.tsx             # Dedicated reminders page
```

### API Service Features
- **Axios Integration**: Modern HTTP client with interceptors
- **Token Management**: Automatic JWT token handling
- **Error Handling**: Comprehensive error catching and user feedback
- **Type Safety**: Full TypeScript interfaces for all data models
- **Request Interceptors**: Automatic authentication header injection
- **Response Interceptors**: Global error handling and token refresh

### Data Models
```typescript
interface Medicine {
  id?: string
  name: string
  dosage: string
  frequency: string
  instructions: string
  expiryDate: string
  category: string
  createdAt?: string
  updatedAt?: string
}

interface MedicineReminder {
  id?: string
  medicineId: string
  medicineName?: string
  reminderTime: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed'
  isActive: boolean
  nextReminder?: string
  createdAt?: string
}
```

### UI/UX Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Proper loading indicators for all async operations
- **Error Handling**: User-friendly error messages and recovery options
- **Success Feedback**: Toast notifications for successful operations
- **Form Validation**: Real-time validation with helpful error messages
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage Instructions

### Adding a Medicine
1. Navigate to `/medicines/add` or click "Add Medicine" button
2. Fill in required fields (name, dosage, frequency, category, expiry date)
3. Optionally add instructions
4. Click "Add Medicine" to save

### Managing Reminders
1. Go to `/medicines/reminders` or click "Reminders" in navigation
2. Click "Add Reminder" to create new reminder
3. Select medicine, set time and frequency
4. Use toggle buttons to activate/deactivate reminders
5. Edit or delete existing reminders as needed

### Viewing Medicine Statistics
1. Visit the dashboard to see overview statistics
2. View medicines expiring soon
3. Check recent additions
4. Use quick action buttons for common tasks

## API Endpoints Expected

The frontend expects the following backend endpoints:

### Medicine Management
- `GET /api/medicines` - List medicines with pagination and search
- `GET /api/medicines/{id}` - Get specific medicine
- `POST /api/medicines` - Create new medicine
- `PUT /api/medicines/{id}` - Update medicine
- `DELETE /api/medicines/{id}` - Delete medicine
- `GET /api/medicines/stats` - Get dashboard statistics
- `GET /api/medicines/expiring?days=30` - Get expiring medicines

### Reminder Management
- `GET /api/medicines-reminder` - List all reminders
- `POST /api/medicines-reminder` - Create reminder
- `PUT /api/medicines-reminder/{id}` - Update reminder
- `DELETE /api/medicines-reminder/{id}` - Delete reminder

## Environment Configuration

Set the following environment variable:
```
REACT_APP_API_URL=http://localhost:8080
```

## Dependencies Added
- `axios` - HTTP client for API calls
- Existing UI components and utilities from the project

## Best Practices Implemented
- **Component Separation**: Each feature has its own focused component
- **Error Boundaries**: Proper error handling at component level
- **Loading States**: User feedback during async operations
- **Form Validation**: Client-side validation with server-side backup
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliance considerations
- **Type Safety**: Full TypeScript coverage
- **Code Reusability**: Shared utilities and components

This medicine management system provides a complete, production-ready solution for managing medicines and reminders with a modern, user-friendly interface.