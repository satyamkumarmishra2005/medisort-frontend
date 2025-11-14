import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/toast'
import { NotificationManager } from './components/NotificationManager'
import { useNotifications } from './hooks/useNotifications'
import './styles/notifications.css'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OAuth2Redirect from './pages/OAuth2Redirect'
import PhoneNumberCollection from './pages/PhoneNumberCollection'

import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Medicines from './pages/Medicines'
import RemindersAndNotifications from './pages/RemindersAndNotifications'
import CustomReminders from './pages/CustomReminders'
import CustomRemindersTest from './pages/CustomRemindersTest'
import ReminderDebug from './pages/ReminderDebug'
import NotificationTest from './pages/NotificationTest'
// @ts-ignore
import Profile from './pages/Profile'
import { MedicineUploadPage } from './components/MedicineUploadPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 healthcare-gradient rounded-full mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 healthcare-gradient rounded-full mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppRoutes: React.FC = () => {
  // Initialize notifications for authenticated users
  useNotifications()

  return (
    <>
      <NotificationManager />
      <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/oauth2/redirect"
        element={<OAuth2Redirect />}
      />
      <Route
        path="/phone-number-collection"
        element={
          <ProtectedRoute>
            <PhoneNumberCollection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines"
        element={
          <ProtectedRoute>
            <Medicines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/add"
        element={
          <ProtectedRoute>
            <Medicines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/edit/:id"
        element={
          <ProtectedRoute>
            <Medicines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/upload-ocr"
        element={
          <ProtectedRoute>
            <MedicineUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/reminders"
        element={
          <ProtectedRoute>
            <RemindersAndNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reminders"
        element={
          <ProtectedRoute>
            <RemindersAndNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <RemindersAndNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/custom-reminders"
        element={
          <ProtectedRoute>
            <CustomReminders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/custom-reminders-test"
        element={
          <ProtectedRoute>
            <CustomRemindersTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reminder-debug"
        element={
          <ProtectedRoute>
            <ReminderDebug />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notification-test"
        element={
          <ProtectedRoute>
            <NotificationTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
