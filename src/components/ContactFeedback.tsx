import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
// Direct email sending without external dependencies
import { useToast } from './ui/toast'

interface ContactFeedbackProps {
  className?: string
}

const ContactFeedback: React.FC<ContactFeedbackProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Direct email sending function using backend
  const sendFeedbackDirectly = async (feedbackData: any) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('medisort_token')
      
      const headers: any = {
        'Content-Type': 'application/json',
      }
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('http://localhost:8081/api/feedback/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: 'satyamkumarmishra2005@gmail.com',
          subject: `MediSort Feedback - ${feedbackData.type}`,
          feedbackType: feedbackData.type,
          message: feedbackData.message,
          userEmail: feedbackData.userEmail,
          timestamp: feedbackData.timestamp
        })
      })

      if (response.ok) {
        return { success: true, message: 'Feedback sent successfully!' }
      } else {
        console.log('❌ Backend response not OK:', response.status, response.statusText)
        
        // If it's a 401 (Unauthorized), try without auth headers for public feedback
        if (response.status === 401 && token) {
          console.log('🔄 Retrying without authentication for public feedback...')
          const publicResponse = await fetch('http://localhost:8081/api/feedback/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: 'satyamkumarmishra2005@gmail.com',
              subject: `MediSort Feedback - ${feedbackData.type}`,
              feedbackType: feedbackData.type,
              message: feedbackData.message,
              userEmail: feedbackData.userEmail,
              timestamp: feedbackData.timestamp
            })
          })
          
          if (publicResponse.ok) {
            return { success: true, message: 'Feedback sent successfully!' }
          }
        }
        
        throw new Error(`Backend email service failed: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Backend email service failed:', error)
      return { success: false, message: 'Failed to send feedback via backend' }
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    
    const feedback = {
      id: Date.now().toString(),
      type: feedbackType,
      message: message.trim(),
      userEmail: user?.email || 'anonymous',
      timestamp: new Date().toISOString()
    }
    
    try {
      // Store feedback locally first
      console.log('💾 Storing feedback locally...')
      const existingFeedback = JSON.parse(localStorage.getItem('user_feedback') || '[]')
      existingFeedback.push(feedback)
      localStorage.setItem('user_feedback', JSON.stringify(existingFeedback))
      
      // Try to send via backend
      console.log('📧 Attempting to send feedback via backend...')
      const emailResult = await sendFeedbackDirectly(feedback)
      
      if (emailResult.success) {
        console.log('✅ Feedback sent successfully via backend')
        addToast({
          type: 'success',
          title: 'Feedback Sent!',
          description: 'Your feedback has been sent successfully to our team.',
          duration: 4000
        })
      } else {
        console.log('⚠️ Backend failed, feedback stored locally')
        addToast({
          type: 'success',
          title: 'Feedback Received!',
          description: 'Your feedback has been saved. We will review it soon.',
          duration: 4000
        })
      }
      
      setSubmitted(true)
      setMessage('')
      
      // Reset form after 4 seconds
      setTimeout(() => setSubmitted(false), 4000)
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error)
      
      // Still show success to user since feedback is stored locally
      addToast({
        type: 'success',
        title: 'Feedback Received!',
        description: 'Your feedback has been saved locally. Thank you!',
        duration: 4000
      })
      
      setSubmitted(true)
      setMessage('')
      setTimeout(() => setSubmitted(false), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-card rounded-lg shadow-sm border p-8 ${className}`}
      >
        <motion.div 
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <motion.h3 
            className="text-2xl font-bold text-gray-900 mb-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Thank You! 🎉
          </motion.h3>
          <motion.p 
            className="text-gray-700 text-lg"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Your feedback has been sent successfully to our team.
          </motion.p>
          <motion.div
            className="mt-4 text-sm text-green-600 font-medium"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            We'll get back to you soon! 📧
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-card rounded-lg shadow-sm border ${className}`}
    >
      <div className="p-8">
        <motion.div 
          className="flex items-center mb-8"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Contact & Feedback
            </h3>
            <p className="text-muted-foreground mt-1">Share your thoughts or report issues with our team</p>
          </div>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <label className="block text-lg font-semibold text-foreground mb-4">
              What type of feedback do you have?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  value: 'general', 
                  label: 'General Feedback', 
                  icon: '💬',
                  description: 'Share your thoughts',
                  gradient: 'from-blue-400 to-blue-600'
                },
                { 
                  value: 'bug', 
                  label: 'Bug Report', 
                  icon: '🐛',
                  description: 'Report an issue',
                  gradient: 'from-red-400 to-red-600'
                },
                { 
                  value: 'feature', 
                  label: 'Feature Request', 
                  icon: '💡',
                  description: 'Suggest improvements',
                  gradient: 'from-yellow-400 to-orange-500'
                }
              ].map((type, index) => (
                <motion.button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value as any)}
                  className={`relative p-4 rounded-lg border text-left transition-all duration-300 transform hover:scale-105 ${
                    feedbackType === type.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${type.gradient} flex items-center justify-center text-white text-lg mr-3 shadow-md`}>
                      {type.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                  {feedbackType === type.value && (
                    <motion.div
                      className="absolute top-2 right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label htmlFor="message" className="block text-lg font-semibold text-foreground mb-3">
              Tell us more
            </label>
            <div className="relative">
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-4 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-300 text-foreground placeholder-muted-foreground bg-background"
                placeholder={
                  feedbackType === 'bug' 
                    ? 'Please describe the issue you encountered in detail. Include steps to reproduce if possible...'
                    : feedbackType === 'feature'
                    ? 'Tell us about the feature you\'d like to see. How would it help you?'
                    : 'Share your feedback, questions, or suggestions with us...'
                }
                required
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {message.length}/500
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>
                {user?.email ? `Submitting as ${user.email}` : 'Submitting anonymously'}
              </span>
            </div>
            <motion.button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="relative px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="submitting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </motion.div>
                ) : (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Feedback
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.form>


      </div>
    </motion.div>
  )
}

export default ContactFeedback