import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Activity, FileText, Bell, Plus, Pill, Upload, UserPlus, CheckCircle, BookOpen, Stethoscope } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Layout } from '../components/ui/layout'
import { useToast } from '../components/ui/toast'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'


import { MedicineDashboard } from '../components/MedicineDashboard'
import { RefillAlertsDashboard } from '../components/RefillAlertsDashboard'

import { medicineApi, MedicineStats } from '../services/medicineApi'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [medicineStats, setMedicineStats] = useState<MedicineStats | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load dashboard data and check user status
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load medicine statistics
        const stats = await medicineApi.getMedicineStats()
        setMedicineStats(stats)
        
        // Always treat users as returning users - no onboarding process
        setIsNewUser(false)
        
        // Calculate profile completion
        let completion = 0
        const completionStatus = {
          profileComplete: localStorage.getItem('profile_completed') === 'true',
          hasMedicines: stats.totalMedicines > 0,
          hasReminders: stats.activeReminders > 0,
          hasDocuments: false // This would need to be fetched from reports API
        }
        
        // Each step is worth 25%
        if (completionStatus.profileComplete) completion += 25
        if (completionStatus.hasMedicines) completion += 25
        if (completionStatus.hasReminders) completion += 25
        if (completionStatus.hasDocuments) completion += 25
        setProfileCompletion(completion)
        
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadDashboardData()
    }
  }, [user])

  // Show welcome toast on first load
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem('welcomeToastShown')
    if (!hasShownWelcome && user) {
      const welcomeMessage = `Welcome to MediSort, ${user.name || 'User'}! Your healthcare management system is ready.`
      
      addToast({
        type: 'success',
        title: 'Welcome to MediSort!',
        description: welcomeMessage,
        duration: 4000
      })
      sessionStorage.setItem('welcomeToastShown', 'true')
    }
  }, [user, addToast])

  // Navigation handlers
  const handleAddMedicine = () => navigate('/medicines/add')
  const handleViewMedicines = () => navigate('/medicines')
  const handleViewReports = () => navigate('/reports')
  const handleViewReminders = () => navigate('/reminders')
  const handleViewCustomReminders = () => navigate('/custom-reminders')
  const handleCompleteProfile = () => navigate('/profile')
  const handleUploadDocument = () => navigate('/reports')

  // Quick action completion tracker
  const getCompletionStatus = () => {
    const profileCompleted = localStorage.getItem('profile_completed') === 'true'
    return {
      profileComplete: profileCompleted,
      hasMedicines: (medicineStats?.totalMedicines || 0) > 0,
      hasReminders: (medicineStats?.activeReminders || 0) > 0,
      hasDocuments: false // This would need to be fetched from reports API
    }
  }

  const renderReturningUserDashboard = () => (
    <div className="space-y-8">
      {/* Enhanced Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black via-purple-900 to-black p-8 text-white shadow-2xl border border-gray-700/50 mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/5 to-purple-400/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <Activity className="w-8 h-8 text-blue-200" />
            </motion.div>
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl font-bold flex items-center gap-3"
              >
                Dashboard
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  ✨
                </motion.div>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-slate-200 mt-2 text-lg"
              >
                Welcome back, {user?.name || 'User'}! Here's your healthcare overview.
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Medicine Dashboard Integration */}
      <MedicineDashboard 
        onAddMedicine={handleAddMedicine}
        onViewMedicines={handleViewMedicines}
        onViewReminders={handleViewReminders}
        onViewCustomReminders={handleViewCustomReminders}
      />

      {/* Enhanced Medical Reports Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border border-gray-700/50 shadow-xl bg-gradient-to-br from-black/80 via-gray-900/30 to-black/20 overflow-hidden backdrop-blur-sm p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-teal-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold text-white flex items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-2 bg-gradient-to-br from-violet-500 to-teal-600 rounded-xl shadow-lg"
                  >
                    <FileText className="w-6 h-6 text-white" />
                  </motion.div>
                  Medical Reports
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-400 mt-1"
                >
                  Upload and manage your medical documents securely
                </motion.p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-black/60 to-gray-900/60 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 border border-gray-600/50 hover:border-violet-500/50 backdrop-blur-sm" 
                onClick={handleUploadDocument}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">Upload Reports</div>
                  <div className="text-sm text-slate-300">Add new medical documents</div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-black/60 to-gray-900/60 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10 border border-gray-600/50 hover:border-teal-500/50 backdrop-blur-sm" 
                onClick={handleViewReports}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">View All Reports</div>
                  <div className="text-sm text-slate-300">Manage your documents</div>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Refill Alerts - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <RefillAlertsDashboard />
      </motion.div>

      {/* Notification Cleaner - Temporary Debug Tool */}



    </div>
  )

  const renderNewUserExperience = () => (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-12 px-6 bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full mb-6">
          <Stethoscope className="w-10 h-10 text-slate-50" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to MediSort
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your personal healthcare management system. Let's get you started with organizing your medicines, 
          setting up reminders, and keeping track of your health records.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={handleAddMedicine}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Medicine
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleCompleteProfile}
            className="border-blue-500 text-blue-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-slate-50"
          >
            <User className="w-5 h-5 mr-2" />
            Complete Profile
          </Button>
        </div>
      </motion.div>

      {/* 📋 New 4-Step Onboarding Process */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden bg-card backdrop-blur-sm border-border shadow-xl">
          <CardHeader className="bg-secondary backdrop-blur-sm">
            <CardTitle className="flex items-center gap-2 text-lg">
              📋 New 4-Step Onboarding Process
            </CardTitle>
            <CardDescription>
              Complete these essential steps to get started with MediSort
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Step 1: Add Your First Medicine 💊 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl bg-card backdrop-blur-sm ${
                  getCompletionStatus().hasMedicines 
                    ? 'border-emerald-200 shadow-md' 
                    : 'border-primary shadow-lg ring-2 ring-primary/20'
                }`}
              >
                {getCompletionStatus().hasMedicines && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      getCompletionStatus().hasMedicines ? 'bg-emerald-100' : 'bg-violet-100'
                    }`}>
                      💊
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-2 ${
                        getCompletionStatus().hasMedicines ? 'text-emerald-800' : 'text-violet-800'
                      }`}>
                        Add Your First Medicine
                      </h3>
                      <p className={`text-sm mb-4 ${
                        getCompletionStatus().hasMedicines ? 'text-emerald-600' : 'text-violet-600'
                      }`}>
                        Most important first step for medicine management
                      </p>
                      {!getCompletionStatus().hasMedicines && (
                        <Button
                          onClick={handleAddMedicine}
                          className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Start Now
                        </Button>
                      )}
                      {getCompletionStatus().hasMedicines && (
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Completed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2: Complete Your Profile 👤 (NEW) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl bg-card backdrop-blur-sm ${
                  getCompletionStatus().profileComplete 
                    ? 'border-emerald-200 shadow-md' 
                    : 'border-blue-500 shadow-lg'
                }`}
              >
                {getCompletionStatus().profileComplete && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
                    NEW
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      getCompletionStatus().profileComplete ? 'bg-emerald-100' : 'bg-blue-100'
                    }`}>
                      👤
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-2 ${
                        getCompletionStatus().profileComplete ? 'text-emerald-800' : 'text-blue-800'
                      }`}>
                        Complete Your Profile
                      </h3>
                      <p className={`text-sm mb-2 ${
                        getCompletionStatus().profileComplete ? 'text-emerald-600' : 'text-blue-600'
                      }`}>
                        Essential user information and health preferences
                      </p>
                      <p className={`text-xs mb-4 ${
                        getCompletionStatus().profileComplete ? 'text-emerald-500' : 'text-blue-500'
                      }`}>
                        Links to /profile page • Tracked via localStorage when profile is saved
                      </p>
                      {!getCompletionStatus().profileComplete && (
                        <Button
                          onClick={handleCompleteProfile}
                          variant="outline"
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Complete Profile
                        </Button>
                      )}
                      {getCompletionStatus().profileComplete && (
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Completed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3: Set Medicine Reminders 🔔 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl bg-card backdrop-blur-sm ${
                  getCompletionStatus().hasReminders 
                    ? 'border-emerald-200 shadow-md' 
                    : 'border-amber-400 shadow-lg'
                }`}
              >
                {getCompletionStatus().hasReminders && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      getCompletionStatus().hasReminders ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      🔔
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-2 ${
                        getCompletionStatus().hasReminders ? 'text-emerald-800' : 'text-amber-800'
                      }`}>
                        Set Medicine Reminders
                      </h3>
                      <p className={`text-sm mb-4 ${
                        getCompletionStatus().hasReminders ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        Configure notification times for medicines
                      </p>
                      {!getCompletionStatus().hasReminders && (
                        <Button
                          onClick={handleViewReminders}
                          variant="outline"
                          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Set Reminders
                        </Button>
                      )}
                      {getCompletionStatus().hasReminders && (
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Completed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 4: Upload Medical Reports 📄 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl bg-white/60 backdrop-blur-sm ${
                  getCompletionStatus().hasDocuments 
                    ? 'border-emerald-200 shadow-md' 
                    : 'border-indigo-400 shadow-lg'
                }`}
              >
                {getCompletionStatus().hasDocuments && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      getCompletionStatus().hasDocuments ? 'bg-emerald-100' : 'bg-indigo-100'
                    }`}>
                      📄
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-2 ${
                        getCompletionStatus().hasDocuments ? 'text-emerald-800' : 'text-indigo-800'
                      }`}>
                        Upload Medical Reports
                      </h3>
                      <p className={`text-sm mb-4 ${
                        getCompletionStatus().hasDocuments ? 'text-emerald-600' : 'text-indigo-600'
                      }`}>
                        Store important medical documents
                      </p>
                      {!getCompletionStatus().hasDocuments && (
                        <Button
                          onClick={handleUploadDocument}
                          variant="outline"
                          className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Reports
                        </Button>
                      )}
                      {getCompletionStatus().hasDocuments && (
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Completed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Enhanced Progress Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Onboarding Progress</h4>
                  <p className="text-xs text-muted-foreground">Complete all steps to unlock the full MediSort experience</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{profileCompletion}%</span>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${profileCompletion}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                {profileCompletion === 100 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 p-4 bg-card border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        🎉
                      </div>
                      <div>
                        <h5 className="font-semibold text-emerald-800">Congratulations!</h5>
                        <p className="text-sm text-emerald-600">You've completed the onboarding process. Welcome to MediSort!</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card backdrop-blur-sm border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              What You Can Do with MediSort
            </CardTitle>
            <CardDescription>
              Discover the powerful features to manage your healthcare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Pill,
                  title: "Medicine Management",
                  description: "Track your medications, dosages, and refill schedules",
                  color: "text-blue-600"
                },
                {
                  icon: Bell,
                  title: "Smart Reminders",
                  description: "Never miss a dose with customizable notifications",
                  color: "text-green-600"
                },
                {
                  icon: FileText,
                  title: "Document Storage",
                  description: "Securely store prescriptions and medical records",
                  color: "text-purple-600"
                },
                {
                  icon: Activity,
                  title: "Health Insights",
                  description: "View your medication adherence and health trends",
                  color: "text-orange-600"
                },
                {
                  icon: UserPlus,
                  title: "Care Team",
                  description: "Share information with your healthcare providers",
                  color: "text-pink-600"
                },
                {
                  icon: Shield,
                  title: "Secure & Private",
                  description: "Your health data is encrypted and protected",
                  color: "text-red-600"
                }
              ].map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="text-center p-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted/50 mb-3`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 healthcare-gradient rounded-full mb-4 animate-pulse">
              <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
            </div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-6"
        >
          {/* Always render the normal dashboard - no onboarding process */}
          {renderReturningUserDashboard()}
        </motion.div>
      </div>
    </Layout>
  )
}

export default Dashboard