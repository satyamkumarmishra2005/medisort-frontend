/**
 * Utility functions for formatting Indian phone numbers
 */

export const formatIndianPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const cleanValue = value.replace(/\D/g, '')
  
  // Handle different input scenarios
  let digitsToFormat = cleanValue
  
  // If starts with 91, remove it for formatting (we'll add +91 prefix)
  if (cleanValue.startsWith('91') && cleanValue.length > 2) {
    digitsToFormat = cleanValue.slice(2)
  }
  
  // If starts with 0, remove it (Indian mobile numbers don't start with 0 when formatted with country code)
  if (digitsToFormat.startsWith('0')) {
    digitsToFormat = digitsToFormat.slice(1)
  }
  
  // Limit to 10 digits for Indian mobile numbers
  digitsToFormat = digitsToFormat.slice(0, 10)
  
  // Format as +91 XXXXX XXXXX (5+5 format which is common for Indian numbers)
  if (digitsToFormat.length >= 6) {
    return `+91 ${digitsToFormat.slice(0, 5)} ${digitsToFormat.slice(5, 10)}`
  } else if (digitsToFormat.length >= 1) {
    return `+91 ${digitsToFormat}`
  } else {
    return '+91 '
  }
}

export const cleanPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const cleanValue = value.replace(/\D/g, '')
  
  // If starts with 91, keep it
  if (cleanValue.startsWith('91') && cleanValue.length > 2) {
    return cleanValue
  }
  
  // If starts with 0, remove it and add 91
  if (cleanValue.startsWith('0')) {
    return '91' + cleanValue.slice(1)
  }
  
  // If it's a 10-digit number, add 91 prefix
  if (cleanValue.length === 10) {
    return '91' + cleanValue
  }
  
  return cleanValue
}

export const validateIndianPhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = cleanPhoneNumber(phoneNumber)
  
  // Should be 12 digits total (91 + 10 digit mobile number)
  if (cleaned.length !== 12) {
    return false
  }
  
  // Should start with 91
  if (!cleaned.startsWith('91')) {
    return false
  }
  
  // The mobile number part (after 91) should start with 6, 7, 8, or 9
  const mobileNumber = cleaned.slice(2)
  const firstDigit = mobileNumber[0]
  
  return ['6', '7', '8', '9'].includes(firstDigit)
}

export const getDisplayPhoneNumber = (phoneNumber: string): string => {
  const cleaned = cleanPhoneNumber(phoneNumber)
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const mobileNumber = cleaned.slice(2)
    return `+91 ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`
  }
  
  return phoneNumber
}