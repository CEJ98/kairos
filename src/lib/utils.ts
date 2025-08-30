import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import DOMPurify from 'isomorphic-dompurify'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function calculateBMI(weight: number, height: number): number {
  // weight in kg, height in cm
  const heightInMeters = height / 100
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateWorkoutCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  let result = ''
  
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return result
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }
  
  if (password.length > 128) {
    errors.push('La contraseña es demasiado larga')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número')
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial (@$!%*?&)')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// =================== INPUT SANITIZATION ===================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== 'string') return ''
  
  // Server-side: use a more basic approach if DOMPurify isn't available
  if (typeof window === 'undefined') {
    return dirty
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }
  
  // Client-side: use DOMPurify
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize user input for search queries
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .replace(/[^\w\s\-_.]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores, dots
    .slice(0, 100) // Limit length
}

/**
 * Sanitize filename for safe file operations
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''
  
  return filename
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255) // Limit length
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  
  try {
    const parsedUrl = new URL(url.trim())
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null
    }
    
    return parsedUrl.toString()
  } catch {
    return null
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Check if it matches international format
  const phoneRegex = /^\+?[\d]{10,15}$/
  return phoneRegex.test(cleaned)
}

/**
 * Check if string contains only safe characters for database queries
 */
export function isSafeForDb(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  
  // Check for SQL injection patterns
  const dangerousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(;|--|\/\*|\*\/)/,
    /(\bor\s+\d+\s*=\s*\d+)/i,
    /(\band\s+\d+\s*=\s*\d+)/i,
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(input))
}

// =================== DATA VALIDATION ===================

/**
 * Validate workout duration (in minutes)
 */
export function validateWorkoutDuration(duration: number): boolean {
  return typeof duration === 'number' && 
         duration > 0 && 
         duration <= 480 && // Max 8 hours
         Number.isInteger(duration)
}

/**
 * Validate body measurement values
 */
export function validateBodyMeasurement(
  type: 'weight' | 'height' | 'bodyFat',
  value: number
): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false
  
  switch (type) {
    case 'weight':
      return value >= 20 && value <= 500 // kg
    case 'height':
      return value >= 100 && value <= 250 // cm
    case 'bodyFat':
      return value >= 0 && value <= 100 // percentage
    default:
      return false
  }
}

/**
 * Validate exercise sets/reps
 */
export function validateExerciseParams(sets?: number, reps?: number): boolean {
  if (sets !== undefined) {
    if (typeof sets !== 'number' || sets < 1 || sets > 20 || !Number.isInteger(sets)) {
      return false
    }
  }
  
  if (reps !== undefined) {
    if (typeof reps !== 'number' || reps < 1 || reps > 1000 || !Number.isInteger(reps)) {
      return false
    }
  }
  
  return true
}

// =================== ERROR HANDLING ===================

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

/**
 * Create safe error message without exposing sensitive information
 */
export function createSafeErrorMessage(error: unknown, userMessage: string): string {
  // In production, only return the user-friendly message
  if (process.env.NODE_ENV === 'production') {
    return userMessage
  }
  
  // In development, include more details
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  return `${userMessage} (Dev: ${errorMessage})`
}

// =================== RATE LIMITING HELPERS ===================

/**
 * Generate rate limit key for caching
 */
export function generateRateLimitKey(
  identifier: string,
  action: string,
  windowMs: number
): string {
  return `rl:${action}:${identifier}:${windowMs}`
}

/**
 * Calculate retry after time in seconds
 */
export function calculateRetryAfter(resetTime: number): number {
  return Math.ceil((resetTime - Date.now()) / 1000)
}