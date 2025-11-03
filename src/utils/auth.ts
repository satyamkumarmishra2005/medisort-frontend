import { isJWTExpired } from './jwt'

const TOKEN_KEY = 'medisort_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      return null
    }
    
    // Check if token is expired
    if (isJWTExpired(token)) {
      // Token is expired, remove it
      removeAuthToken()
      return null
    }
    
    return token
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('Error setting auth token:', error)
  }
}

export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch (error) {
    console.error('Error removing auth token:', error)
  }
}

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch (error) {
    console.error('Error getting refresh token:', error)
    return null
  }
}

export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } catch (error) {
    console.error('Error setting refresh token:', error)
  }
}

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null
}