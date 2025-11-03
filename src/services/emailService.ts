import emailjs from '@emailjs/browser'

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_cfcc05g'
const EMAILJS_TEMPLATE_ID = 'template_y4xaqx8'
const EMAILJS_PUBLIC_KEY = 'AGqzpCn_FM9noDx4X'

interface FeedbackData {
  type: 'bug' | 'feature' | 'general'
  message: string
  userEmail: string
  timestamp: string
}

export const sendFeedbackEmail = async (feedbackData: FeedbackData): Promise<{ success: boolean; message?: string }> => {
  try {
    // Initialize EmailJS (you only need to do this once)
    emailjs.init(EMAILJS_PUBLIC_KEY)

    const templateParams = {
      to_email: 'satyamkumarmishra2005@gmail.com',
      from_name: feedbackData.userEmail || 'Anonymous User',
      feedback_type: feedbackData.type.toUpperCase(),
      message: feedbackData.message,
      user_email: feedbackData.userEmail,
      timestamp: new Date(feedbackData.timestamp).toLocaleString(),
      subject: `MediSort Feedback - ${feedbackData.type.charAt(0).toUpperCase() + feedbackData.type.slice(1)}`
    }

    console.log('📧 Sending email with params:', templateParams)

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )

    console.log('✅ Email sent successfully:', response)
    return { success: true, message: 'Feedback sent successfully!' }

  } catch (error) {
    console.error('❌ Email sending failed:', error)
    
    // Fallback: Use a simple mailto link approach
    const subject = encodeURIComponent(`MediSort Feedback - ${feedbackData.type}`)
    const body = encodeURIComponent(
      `Feedback Type: ${feedbackData.type.toUpperCase()}\n` +
      `From: ${feedbackData.userEmail || 'Anonymous'}\n` +
      `Time: ${new Date(feedbackData.timestamp).toLocaleString()}\n\n` +
      `Message:\n${feedbackData.message}`
    )
    
    // Open default email client as fallback
    window.open(`mailto:satyamkumarmishra2005@gmail.com?subject=${subject}&body=${body}`)
    
    return { 
      success: false, 
      message: 'Email service unavailable. Your default email client has been opened to send the feedback manually.' 
    }
  }
}

// Alternative simple email service using a backend endpoint
export const sendFeedbackViaBackend = async (feedbackData: FeedbackData): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch('http://localhost:8081/api/feedback/send', {
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

    if (response.ok) {
      return { success: true, message: 'Feedback sent successfully!' }
    } else {
      throw new Error('Backend email service failed')
    }
  } catch (error) {
    console.error('❌ Backend email service failed:', error)
    return { success: false, message: 'Failed to send feedback via backend' }
  }
}