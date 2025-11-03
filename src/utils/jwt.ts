// JWT utility functions
export interface JWTPayload {
  sub: string // Subject (user ID)
  email?: string
  name?: string
  iat?: number // Issued at
  exp?: number // Expiration
  [key: string]: any // Allow other claims
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    // Decode the payload (middle part)
    const payload = parts[1]
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
    
    // Decode base64
    const decodedPayload = atob(paddedPayload)
    
    // Parse JSON
    const parsedPayload = JSON.parse(decodedPayload)
    
    return parsedPayload
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

export const isJWTExpired = (token: string): boolean => {
  try {
    const payload = decodeJWT(token)
    if (!payload || !payload.exp) {
      return true // Consider expired if no expiration or invalid token
    }
    
    // Check if current time is past expiration (exp is in seconds, Date.now() is in milliseconds)
    return Date.now() >= payload.exp * 1000
  } catch (error) {
    console.error('Error checking JWT expiration:', error)
    return true // Consider expired on error
  }
}

export const getJWTClaims = (token: string): { [key: string]: any } | null => {
  const payload = decodeJWT(token)
  return payload || null
}