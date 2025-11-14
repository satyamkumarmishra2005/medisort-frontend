import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Calendar, Shield, Edit, Save, Camera, Lock } from 'lucide-react'
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
              'https://api.medisort.app/api/user/profile',
              'https://api.medisort.app/api/user/profile/update'
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile & Settings</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button variant="healthcare-gradient" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />Save Changes
                </Button>
              </>
            ) : (
              <Button variant="healthcare" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="elevated" className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="relative mx-auto">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
                {isEditing && (
                  <Button variant="ghost" size="sm" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground">
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardTitle>{formData.name}</CardTitle>
              <CardDescription>{formData.email}</CardDescription>
              <Badge variant="success" className="mx-auto mt-2">{formData.role}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{formData.phone ? getDisplayPhoneNumber(formData.phone) : 'No phone number'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{formData.dateOfBirth ? formatToMMDDYYYY(formData.dateOfBirth) : 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Account Verified</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>{isEditing ? 'Update your personal details' : 'Your personal details'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  {isEditing ? (
                    <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                  ) : (
                    <p className="text-foreground bg-muted/50 p-3 rounded-md">{formData.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  {isEditing ? (
                    <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                  ) : (
                    <p className="text-foreground bg-muted/50 p-3 rounded-md">{formData.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', formatIndianPhoneNumber(e.target.value))}
                      placeholder="+91 98765 43210"
                      maxLength={17}
                    />
                  ) : (
                    <p className="text-foreground bg-muted/50 p-3 rounded-md">{formData.phone ? getDisplayPhoneNumber(formData.phone) : 'No phone number'}</p>
                  )}
                </div>

                <div className="space-y-2 relative" style={{ zIndex: isEditing ? 50 : 'auto' }}>
                  <label className="text-sm font-medium text-foreground">Date of Birth</label>
                  {isEditing ? (
                    <div className="relative">
                      <DatePicker
                        value={formData.dateOfBirth}
                        onChange={(date) => handleInputChange('dateOfBirth', date)}
                        placeholder="Select your date of birth"
                        className="w-full"
                        maxDate={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  ) : (
                    <p className="text-foreground bg-muted/50 p-3 rounded-md">
                      {formData.dateOfBirth ? formatToMMDDYYYY(formData.dateOfBirth) : 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Emergency Contact</label>
                  {isEditing ? (
                    <Input
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      placeholder="Emergency contact number"
                    />
                  ) : (
                    <p className="text-foreground bg-muted/50 p-3 rounded-md">{formData.emergencyContact || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Blood Type</label>
                  {isEditing ? (
                    <select
                      value={formData.bloodType}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                      className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    >
                      <option value="">Select Blood Type</option>
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
                    <p className="text-foreground bg-muted/50 p-3 rounded-md">{formData.bloodType || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Gender</label>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="text-foreground bg-muted/50 p-3 rounded-md">{formData.gender || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {/* Add extra spacing when editing to accommodate date picker */}
              {isEditing && <div className="h-20"></div>}
            </CardContent>
          </Card>
        </div>

        {/* Add extra spacing when editing */}
        {isEditing && <div className="h-24"></div>}

        <Card variant="elevated" className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />Password Security
            </CardTitle>
            <CardDescription>Manage your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Password</h3>
                <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Profile Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Information */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Health Information
              </CardTitle>
              <CardDescription>Your medical profile summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Blood Type</div>
                  <div className="text-lg font-bold text-green-800">{formData.bloodType || 'Not Set'}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Age</div>
                  <div className="text-lg font-bold text-blue-800">
                    {formData.dateOfBirth ? calculateAge(formData.dateOfBirth) || 'N/A' : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-sm text-orange-600 font-medium">Gender</div>
                <div className="text-sm text-orange-800 mt-1">{formData.gender || 'Not specified'}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600 font-medium">Emergency Contact</div>
                <div className="text-sm text-purple-800 mt-1">{formData.emergencyContact || 'Not provided'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Account Activity */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Account Activity
              </CardTitle>
              <CardDescription>Recent account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-600">
                <div>
                  <div className="font-medium text-white">Last Login</div>
                  <div className="text-sm text-slate-300">Today at 2:30 PM</div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-600">
                <div>
                  <div className="font-medium text-white">Profile Updated</div>
                  <div className="text-sm text-slate-300">2 days ago</div>
                </div>
                <Badge variant="secondary">Recent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-600">
                <div>
                  <div className="font-medium text-white">Account Created</div>
                  <div className="text-sm text-slate-300">January 15, 2024</div>
                </div>
                <Badge variant="outline">Verified</Badge>
              </div>
            </CardContent>
          </Card>
        </div>


      </motion.div>
    </Layout>
  )
}

export default Profile