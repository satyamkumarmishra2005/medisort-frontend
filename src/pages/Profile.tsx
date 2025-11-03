import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Calendar, Shield, Edit, Save, Camera, Mail } from 'lucide-react'
import { Layout } from '../components/ui/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { DatePicker } from '../components/ui/date-picker'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/toast'
import ApiService from '../services/api'
import { getDisplayPhoneNumber, formatIndianPhoneNumber, cleanPhoneNumber } from '../utils/phoneFormatter'
import {
  formatToMMDDYYYY,
  convertToYYYYMMDD,
  parseBackendDate,
  prepareForBackend,
  calculateAge
} from '../utils/dateFormatter'
import ContactFeedback from '../components/ContactFeedback'

const Profile: React.FC = () => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    role: 'Patient',
    emergencyContact: '',
    bloodType: '',
    gender: ''
  })

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true)
        console.log('🔍 Fetching user profile from backend...')

        let result = null
        const token = localStorage.getItem('medisort_token')

        // Try session-based authentication first (for OAuth2 users)
        console.log('🔍 Trying session-based authentication...')
        result = await ApiService.getCurrentUserProfile()
        console.log('📡 Session-based result:', result)

        // If session-based worked but doesn't have gender, try the complete profile method
        if (result.success && result.data && (!result.data.gender || result.data.gender === '')) {
          console.log('🔍 Session worked but no gender, trying complete profile...')
          const completeResult = await ApiService.getCompleteUserProfile()
          if (completeResult.success && completeResult.data && completeResult.data.gender) {
            console.log('✅ Got gender from complete profile method')
            result = completeResult
          }
        }

        // If session-based fails and we have a JWT token, try JWT-based authentication
        if (!result.success && token) {
          console.log('🔍 Session failed, trying JWT-based authentication...')
          try {
            // Try multiple endpoints to get complete profile data
            const endpoints = [
              'http://localhost:8081/api/user/profile',
              'http://localhost:8081/api/user/profile/update'
            ]

            for (const endpoint of endpoints) {
              console.log(`🔍 Trying endpoint: ${endpoint}`)

              const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })

              if (response.ok) {
                const profileData = await response.json()
                result = { success: true, data: profileData }
                console.log(`📡 Success with ${endpoint}:`, result)
                console.log('📡 Gender field:', profileData.gender)
                console.log('📡 All fields:', Object.keys(profileData))

                // If we got gender data, break out of the loop
                if (profileData.gender !== undefined && profileData.gender !== null) {
                  console.log('✅ Found gender data, using this endpoint')
                  break
                }
              } else {
                console.log(`❌ Failed with ${endpoint}, status:`, response.status)
              }
            }

            if (!result.success) {
              console.log('❌ All JWT-based endpoints failed')
            }
          } catch (jwtError) {
            console.error('❌ JWT authentication error:', jwtError)
          }
        }

        if (result && result.success && result.data) {
          const profileData = result.data
          console.log('✅ Profile data:', profileData)
          console.log('✅ Phone number from backend:', profileData.phone)
          console.log('✅ Gender from backend:', profileData.gender)
          console.log('✅ All profile fields:', Object.keys(profileData))

          setFormData({
            name: profileData.name || 'User',
            email: profileData.email || 'unknown@example.com',
            phone: profileData.phone || '',
            dateOfBirth: profileData.dateOfBirth ? convertToYYYYMMDD(parseBackendDate(profileData.dateOfBirth)) : '1990-01-15',
            role: profileData.role || 'Patient',
            emergencyContact: profileData.emergencyContact || '',
            bloodType: profileData.bloodType || '',
            gender: profileData.gender || ''
          })
        } else {
          console.log('❌ Both authentication methods failed, using fallback data')
          console.log('❌ User context phone:', user?.phone)
          setFormData({
            name: user?.name || 'User',
            email: user?.email || 'unknown@example.com',
            phone: user?.phone || '',
            dateOfBirth: '1990-01-15',
            role: 'Patient',
            emergencyContact: '',
            bloodType: '',
            gender: ''
          })
        }
      } catch (error) {
        console.error('❌ Profile fetch error:', error)
        setFormData({
          name: user?.name || 'User',
          email: user?.email || 'unknown@example.com',
          phone: user?.phone || '',
          dateOfBirth: '1990-01-15',
          role: 'Patient',
          emergencyContact: '',
          bloodType: '',
          gender: ''
        })
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(fetchUserProfile, 100)
    return () => clearTimeout(timer)
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Clean the phone number and format date for the new API
      const dataToSave = {
        name: formData.name,
        phone: formData.phone ? cleanPhoneNumber(formData.phone) : '',
        dateOfBirth: formData.dateOfBirth ? prepareForBackend(formData.dateOfBirth) : '',
        emergencyContact: formData.emergencyContact,
        bloodType: formData.bloodType,
        gender: formData.gender
      }

      console.log('� Seaving profile data:', dataToSave)

      const token = localStorage.getItem('medisort_token')

      if (!token) {
        addToast({
          type: 'error',
          title: 'Authentication Error',
          description: 'Please log in again to update your profile.',
          duration: 5000
        })
        return
      }

      // Use the new API service method
      const result = await ApiService.updateUserProfileNew(dataToSave)
      console.log('📡 Update result:', result)

      if (result.success && result.data) {
        const updatedData = result.data
        console.log('📡 Updated profile data:', updatedData)

        // Update local form data with the response
        console.log('📡 Updated data gender field:', updatedData.gender)
        setFormData(prev => ({
          ...prev,
          name: updatedData.name || prev.name,
          email: updatedData.email || prev.email,
          phone: updatedData.phone || prev.phone,
          dateOfBirth: updatedData.dateOfBirth ? convertToYYYYMMDD(parseBackendDate(updatedData.dateOfBirth)) : prev.dateOfBirth,
          emergencyContact: updatedData.emergencyContact || prev.emergencyContact,
          bloodType: updatedData.bloodType || prev.bloodType,
          gender: updatedData.gender || prev.gender
        }))

        addToast({
          type: 'success',
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
          duration: 4000
        })
        setIsEditing(false)
      } else {
        console.log('❌ Update failed:', result)

        addToast({
          type: 'error',
          title: 'Update Failed',
          description: result.message || 'Failed to update profile.',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      addToast({
        type: 'error',
        title: 'Update Error',
        description: 'An error occurred while updating your profile.',
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    window.location.reload()
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
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
          className="space-y-8 p-6"
        >
          {/* Enhanced Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-purple-900 to-indigo-900 p-8 text-white shadow-2xl border border-slate-700/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/5 to-purple-400/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                  >
                    <User className="w-8 h-8 text-blue-200" />
                  </motion.div>
                  <div>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-4xl font-bold flex items-center gap-3"
                    >
                      Profile & Settings
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      >
                        ⚙️
                      </motion.div>
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="text-slate-200 mt-2 text-lg"
                    >
                      Manage your personal information and preferences
                    </motion.p>
                  </div>
                </div>
                <div className="flex gap-4">
                  {isEditing ? (
                    <>
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -2 }} 
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                          className="bg-black/60 backdrop-blur-sm border-red-500/30 hover:bg-red-500/10 hover:border-red-400 text-red-300 hover:text-red-200 transition-all duration-300 px-6 py-3 rounded-xl shadow-lg hover:shadow-red-500/20"
                        >
                          Cancel
                        </Button>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -2 }} 
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          onClick={handleSave}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 px-6 py-3 rounded-xl border border-green-400/30"
                        >
                          <Save className="w-5 h-5 mr-2" />
                          Save Changes
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2 }} 
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 px-8 py-3 rounded-xl border border-purple-400/30 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                        <Edit className="w-5 h-5 mr-2 relative z-10" />
                        <span className="relative z-10">Edit Profile</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="border border-purple-500/20 shadow-2xl bg-gradient-to-br from-black/90 via-purple-900/20 to-black/90 overflow-hidden backdrop-blur-xl relative">
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-pink-500/5"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full translate-y-12 -translate-x-12 animate-pulse delay-1000"></div>
              
              <CardHeader className="text-center relative z-10">
                <div className="relative mx-auto">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="w-28 h-28 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-400/30 shadow-lg shadow-purple-500/20 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 animate-pulse"></div>
                    <User className="w-14 h-14 text-purple-300 relative z-10" />
                  </motion.div>
                  {isEditing && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-2 -right-2"
                    >
                      <Button variant="ghost" size="sm" className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-purple-500/30 border border-purple-400/30">
                        <Camera className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  )}
                </div>
                <CardTitle className="text-white text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{formData.name}</CardTitle>
                <CardDescription className="text-gray-300 text-lg">{formData.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <motion.div 
                  whileHover={{ x: 8, scale: 1.02 }}
                  className="flex items-center gap-4 text-sm p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Phone</p>
                    <span className="text-white font-medium">{formData.phone ? getDisplayPhoneNumber(formData.phone) : 'No phone number'}</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 8, scale: 1.02 }}
                  className="flex items-center gap-4 text-sm p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Date of Birth</p>
                    <span className="text-white font-medium">{formData.dateOfBirth ? formatToMMDDYYYY(formData.dateOfBirth) : 'Not provided'}</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 8, scale: 1.02 }}
                  className="flex items-center gap-4 text-sm p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 hover:border-green-400/40 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Status</p>
                    <span className="text-white font-medium flex items-center gap-2">
                      Account Verified
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </span>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="border border-purple-500/20 shadow-2xl bg-gradient-to-br from-black/90 via-purple-900/20 to-black/90 overflow-hidden backdrop-blur-xl relative">
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/10 to-pink-500/5"></div>
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full -translate-y-20 -translate-x-20 animate-pulse delay-500"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Personal Information</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">{isEditing ? 'Update your personal details' : 'Your personal details'}</CardDescription>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-400/30"
                  >
                    <User className="w-6 h-6 text-purple-400" />
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="space-y-3 group"
                  >
                    <label className="text-sm font-semibold text-purple-300 uppercase tracking-wide flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input 
                        value={formData.name} 
                        onChange={(e) => handleInputChange('name', e.target.value)} 
                        className="bg-black/60 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20 h-12 rounded-xl backdrop-blur-sm transition-all duration-300 hover:border-purple-400/50"
                      />
                    ) : (
                      <div className="text-white bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-xl border border-purple-400/20 backdrop-blur-sm group-hover:border-purple-400/40 transition-all duration-300">
                        {formData.name}
                      </div>
                    )}
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="space-y-3 group"
                  >
                    <label className="text-sm font-semibold text-blue-300 uppercase tracking-wide flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    {isEditing ? (
                      <Input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => handleInputChange('email', e.target.value)} 
                        className="bg-black/60 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 rounded-xl backdrop-blur-sm transition-all duration-300 hover:border-blue-400/50"
                      />
                    ) : (
                      <div className="text-white bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-xl border border-blue-400/20 backdrop-blur-sm group-hover:border-blue-400/40 transition-all duration-300">
                        {formData.email}
                      </div>
                    )}
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-slate-300">Phone</label>
                    {isEditing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', formatIndianPhoneNumber(e.target.value))}
                        placeholder="+91 98765 43210"
                        maxLength={17}
                        className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    ) : (
                      <p className="text-white bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">{formData.phone ? getDisplayPhoneNumber(formData.phone) : 'No phone number'}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2 relative" 
                    style={{ zIndex: isEditing ? 50 : 'auto' }}
                  >
                    <label className="text-sm font-medium text-slate-300">Date of Birth</label>
                    {isEditing ? (
                      <div className="relative">
                        <DatePicker
                          value={formData.dateOfBirth}
                          onChange={(date) => handleInputChange('dateOfBirth', date)}
                          placeholder="Select your date of birth"
                          className="w-full bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                          maxDate={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    ) : (
                      <p className="text-white bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                        {formData.dateOfBirth ? formatToMMDDYYYY(formData.dateOfBirth) : 'Not provided'}
                      </p>
                    )}
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-slate-300">Emergency Contact</label>
                    {isEditing ? (
                      <Input
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Emergency contact number"
                        className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    ) : (
                      <p className="text-white bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                        {formData.emergencyContact || 'Not provided'}
                      </p>
                    )}
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-slate-300">Blood Type</label>
                    {isEditing ? (
                      <select
                        value={formData.bloodType}
                        onChange={(e) => handleInputChange('bloodType', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-800/60 text-white"
                      >
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    ) : (
                      <p className="text-white bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                        {formData.bloodType || 'Not provided'}
                      </p>
                    )}
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-slate-300">Gender</label>
                    {isEditing ? (
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-800/60 text-white"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    ) : (
                      <p className="text-white bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                        {formData.gender || 'Not provided'}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Add extra spacing when editing to accommodate date picker */}
                {isEditing && <div className="h-20"></div>}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add extra spacing when editing */}
        {isEditing && <div className="h-24"></div>}



        {/* Enhanced Contact & Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <ContactFeedback />
        </motion.div>

        </motion.div>
      </div>
    </Layout>
  )
}

export default Profile