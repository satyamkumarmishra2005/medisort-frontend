/**
 * Authentication utilities for handling token issues
 */

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true
  
  try {
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) return true
    
    const payload = JSON.parse(atob(tokenParts[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    return payload.exp && payload.exp < currentTime
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}

export const getTokenTimeRemaining = (token: string | null): number => {
  if (!token) return 0
  
  try {
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) return 0
    
    const payload = JSON.parse(atob(tokenParts[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (payload.exp) {
      return Math.max(0, payload.exp - currentTime)
    }
    
    return 0
  } catch (error) {
    console.error('Error getting token time remaining:', error)
    return 0
  }
}

export const shouldRefreshToken = (token: string | null, bufferMinutes: number = 5): boolean => {
  const timeRemaining = getTokenTimeRemaining(token)
  const bufferSeconds = bufferMinutes * 60
  
  return timeRemaining > 0 && timeRemaining < bufferSeconds
}

export const clearAuthData = (): void => {
  localStorage.removeItem('medisort_token')
  localStorage.removeItem('medisort_user')
}

export const getStoredAuthData = (): { token: string | null; user: any | null } => {
  const token = localStorage.getItem('medisort_token')
  const userStr = localStorage.getItem('medisort_user')
  
  let user = null
  if (userStr) {
    try {
      user = JSON.parse(userStr)
    } catch (error) {
      console.error('Error parsing stored user data:', error)
    }
  }
  
  return { token, user }
}