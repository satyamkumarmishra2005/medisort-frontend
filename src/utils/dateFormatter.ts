/**
 * Utility functions for date formatting and conversion
 */

/**
 * Convert a date string from various formats to MM/dd/yyyy format
 * @param dateString - Date string in various formats (YYYY-MM-DD, MM/dd/yyyy, etc.)
 * @returns Date string in MM/dd/yyyy format or empty string if invalid
 */
export const formatToMMDDYYYY = (dateString: string): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

/**
 * Convert MM/dd/yyyy format to YYYY-MM-DD format for HTML date inputs
 * @param mmddyyyy - Date string in MM/dd/yyyy format
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export const convertToYYYYMMDD = (mmddyyyy: string): string => {
  if (!mmddyyyy) return ''
  
  try {
    // Parse MM/dd/yyyy format
    const parts = mmddyyyy.split('/')
    if (parts.length !== 3) return ''
    
    const month = parseInt(parts[0], 10)
    const day = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    
    if (isNaN(month) || isNaN(day) || isNaN(year)) return ''
    if (month < 1 || month > 12) return ''
    if (day < 1 || day > 31) return ''
    if (year < 1900 || year > 2100) return ''
    
    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) return ''
    
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error converting date:', error)
    return ''
  }
}

/**
 * Convert YYYY-MM-DD format to MM/dd/yyyy format
 * @param yyyymmdd - Date string in YYYY-MM-DD format
 * @returns Date string in MM/dd/yyyy format or empty string if invalid
 */
export const convertFromYYYYMMDD = (yyyymmdd: string): string => {
  if (!yyyymmdd) return ''
  
  try {
    const date = new Date(yyyymmdd)
    if (isNaN(date.getTime())) return ''
    
    return formatToMMDDYYYY(date.toISOString())
  } catch (error) {
    console.error('Error converting date from YYYY-MM-DD:', error)
    return ''
  }
}

/**
 * Parse a date string from backend and convert to display format
 * @param backendDate - Date string from backend (could be various formats)
 * @returns Date string in MM/dd/yyyy format for display
 */
export const parseBackendDate = (backendDate: string): string => {
  if (!backendDate) return ''
  
  // If it's already in MM/dd/yyyy format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(backendDate)) {
    return backendDate
  }
  
  // Otherwise, try to parse and convert
  return formatToMMDDYYYY(backendDate)
}

/**
 * Prepare date for backend API (convert to MM/dd/yyyy format)
 * @param dateString - Date string in any format
 * @returns Date string in MM/dd/yyyy format for backend
 */
export const prepareForBackend = (dateString: string): string => {
  return formatToMMDDYYYY(dateString)
}

/**
 * Validate if a date string is in MM/dd/yyyy format
 * @param dateString - Date string to validate
 * @returns true if valid MM/dd/yyyy format, false otherwise
 */
export const isValidMMDDYYYY = (dateString: string): boolean => {
  if (!dateString) return false
  
  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/
  if (!regex.test(dateString)) return false
  
  try {
    const parts = dateString.split('/')
    const month = parseInt(parts[0], 10)
    const day = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    
    const date = new Date(year, month - 1, day)
    return date.getMonth() === month - 1 && 
           date.getDate() === day && 
           date.getFullYear() === year
  } catch {
    return false
  }
}

/**
 * Get age from date of birth
 * @param dateOfBirth - Date of birth in any format
 * @returns Age in years or null if invalid date
 */
export const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null
  
  try {
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) return null
    
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age >= 0 ? age : null
  } catch {
    return null
  }
}