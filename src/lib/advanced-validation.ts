/**
 * Advanced Input Validation System for Kairos Fitness
 * Comprehensive validation with security checks and sanitization
 */

import { z } from 'zod'
import { sanitizeHtml, isSafeForDb } from '@/lib/utils'
import { logSecurityEvent } from '@/lib/security-audit'

// Security patterns to detect malicious input
const SECURITY_PATTERNS = {
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ],
  sqlInjection: [
    /(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from|drop\s+table|create\s+table|alter\s+table)\s/gi,
    /(;\s*--)|(--\s*$)/g,
    /(\bor\s+\d+\s*=\s*\d+\s+--)/gi,
    /(\band\s+\d+\s*=\s*\d+\s+--)/gi,
    /('\s*(or|and)\s+.*\s*=\s*.*')/gi
  ],
  pathTraversal: [
    /\.\.\/|\.\.\\/g,
    /\.\.%2f|\.\.%5c/gi,
    /\.\.\\|\.\.\\\\/g
  ],
  commandInjection: [
    /;\s*(rm|cat|ls|pwd|whoami|id|uname|curl|wget)/gi,
    /\$\(\s*(rm|cat|ls|pwd|whoami|id|uname|curl|wget)/gi,
    /`\s*(rm|cat|ls|pwd|whoami|id|uname|curl|wget)/gi,
    /\|\s*(rm|cat|ls|pwd|whoami|id|uname|curl|wget)/gi
  ]
}

interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
  securityIssues?: string[]
  sanitized?: boolean
}

interface ValidationOptions {
  sanitize?: boolean
  allowHtml?: boolean
  maxLength?: number
  required?: boolean
  logSecurity?: boolean
  userId?: string
}

/**
 * Advanced validation class with security checks
 */
export class AdvancedValidator {
  private userId?: string
  private logSecurity: boolean

  constructor(userId?: string, logSecurity = true) {
    this.userId = userId
    this.logSecurity = logSecurity
  }

  /**
   * Validate and sanitize string input
   */
  validateString(
    input: unknown,
    options: ValidationOptions = {}
  ): ValidationResult<string> {
    const {
      sanitize = true,
      allowHtml = false,
      maxLength = 1000,
      required = false
    } = options

    // Type check
    if (typeof input !== 'string') {
      if (required) {
        return { success: false, error: 'String input is required' }
      }
      return { success: true, data: '' }
    }

    let value = input.trim()
    const securityIssues: string[] = []
    let wasSanitized = false

    // Skip security checks for valid emails
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    
    // Check for security threats only if not an email
    if (!isEmail) {
      const threats = this.detectSecurityThreats(value)
      if (threats.length > 0) {
        securityIssues.push(...threats)
        
        if (this.logSecurity) {
          logSecurityEvent(
            this.getSecurityEventType(threats),
            'HIGH',
            {
              input: value.substring(0, 100) + '...', // Log partial input
              threats,
              sanitized: sanitize
            },
            this.userId
          )
        }

        if (!allowHtml && sanitize) {
          value = sanitizeHtml(value)
          wasSanitized = true
        }
      }
    }

    // Length validation
    if (value.length > maxLength) {
      return {
        success: false,
        error: `Input too long. Maximum ${maxLength} characters allowed`
      }
    }

    // Database safety check (skip for emails and safe patterns)
    if (!isSafeForDb(value)) {
      if (this.logSecurity) {
        logSecurityEvent(
          'SQL_INJECTION_ATTEMPT',
          'CRITICAL',
          {
            input: value.substring(0, 100) + '...',
            reason: 'Unsafe database input detected'
          },
          this.userId
        )
      }
      return {
        success: false,
        error: 'Input contains potentially dangerous content',
        securityIssues: ['SQL_INJECTION']
      }
    }

    return {
      success: true,
      data: value,
      securityIssues: securityIssues.length > 0 ? securityIssues : undefined,
      sanitized: wasSanitized
    }
  }

  /**
   * Validate email with security checks
   */
  validateEmail(input: unknown): ValidationResult<string> {
    // Type check
    if (typeof input !== 'string') {
      return { success: false, error: 'Email must be a string' }
    }

    let email = input.trim().toLowerCase()
    
    // Length validation
    if (email.length > 255) {
      return {
        success: false,
        error: 'Email too long. Maximum 255 characters allowed'
      }
    }

    if (email.length === 0) {
      return { success: false, error: 'Email is required' }
    }
    
    // Enhanced email validation
    const emailSchema = z.string()
      .email('Invalid email format')
      .refine(
        (email) => {
          // Check for suspicious patterns in email
          const suspiciousPatterns = [
            /\+.*script/i,
            /javascript/i,
            /[<>"']/,
            /\s/
          ]
          return !suspiciousPatterns.some(pattern => pattern.test(email))
        },
        'Email contains suspicious characters'
      )

    const result = emailSchema.safeParse(email)
    
    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0]?.message || 'Invalid email'
      }
    }

    return {
      success: true,
      data: result.data,
      securityIssues: [],
      sanitized: false
    }
  }

  /**
   * Validate password with security requirements
   */
  validatePassword(input: unknown): ValidationResult<string> {
    if (typeof input !== 'string') {
      return { success: false, error: 'Password must be a string' }
    }

    const password = input
    const issues: string[] = []

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ]

    if (weakPasswords.includes(password.toLowerCase())) {
      if (this.logSecurity) {
        logSecurityEvent(
          'AUTH_FAILURE',
          'MEDIUM',
          {
            reason: 'Weak password attempt',
            passwordLength: password.length
          },
          this.userId
        )
      }
      return {
        success: false,
        error: 'Password is too common and weak'
      }
    }

    // Strength validation
    const passwordSchema = z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )

    const result = passwordSchema.safeParse(password)
    
    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0]?.message || 'Invalid password'
      }
    }

    return { success: true, data: result.data }
  }

  /**
   * Validate file upload
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number
      allowedTypes?: string[]
      allowedExtensions?: string[]
    } = {}
  ): ValidationResult<File> {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    } = options

    const issues: string[] = []

    // Size check
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
      }
    }

    // Type check
    if (!allowedTypes.includes(file.type)) {
      if (this.logSecurity) {
        logSecurityEvent(
          'MALICIOUS_FILE_UPLOAD',
          'HIGH',
          {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            reason: 'Disallowed file type'
          },
          this.userId
        )
      }
      return {
        success: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    // Extension check
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      return {
        success: false,
        error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
      }
    }

    // Filename security check
    const filenameResult = this.validateString(file.name, {
      maxLength: 255,
      sanitize: true
    })

    if (!filenameResult.success) {
      return {
        success: false,
        error: 'Invalid filename: ' + filenameResult.error
      }
    }

    return { success: true, data: file }
  }

  /**
   * Validate JSON input
   */
  validateJSON<T>(
    input: unknown,
    schema: z.ZodSchema<T>
  ): ValidationResult<T> {
    try {
      const result = schema.safeParse(input)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error.errors[0]?.message || 'Invalid data format'
        }
      }

      return { success: true, data: result.data }
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON data'
      }
    }
  }

  /**
   * Detect security threats in input
   */
  private detectSecurityThreats(input: string): string[] {
    const threats: string[] = []

    // Skip security checks for valid emails
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
    if (isEmail) {
      return threats
    }

    // Check for XSS
    if (SECURITY_PATTERNS.xss.some(pattern => pattern.test(input))) {
      threats.push('XSS_ATTEMPT')
    }

    // Check for SQL injection
    if (SECURITY_PATTERNS.sqlInjection.some(pattern => pattern.test(input))) {
      threats.push('SQL_INJECTION_ATTEMPT')
    }

    // Check for path traversal
    if (SECURITY_PATTERNS.pathTraversal.some(pattern => pattern.test(input))) {
      threats.push('PATH_TRAVERSAL_ATTEMPT')
    }

    // Check for command injection
    if (SECURITY_PATTERNS.commandInjection.some(pattern => pattern.test(input))) {
      threats.push('COMMAND_INJECTION_ATTEMPT')
    }

    return threats
  }

  /**
   * Get appropriate security event type based on threats
   */
  private getSecurityEventType(threats: string[]): any {
    if (threats.includes('SQL_INJECTION_ATTEMPT')) return 'SQL_INJECTION_ATTEMPT'
    if (threats.includes('XSS_ATTEMPT')) return 'XSS_ATTEMPT'
    if (threats.includes('PATH_TRAVERSAL_ATTEMPT')) return 'PATH_TRAVERSAL_ATTEMPT'
    if (threats.includes('COMMAND_INJECTION_ATTEMPT')) return 'SUSPICIOUS_REQUEST'
    return 'SUSPICIOUS_REQUEST'
  }
}

/**
 * Create validator instance
 */
export function createValidator(userId?: string): AdvancedValidator {
  return new AdvancedValidator(userId)
}

/**
 * Middleware for request validation
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
  userId?: string
): ValidationResult<T> {
  const validator = createValidator(userId)
  return validator.validateJSON(body, schema)
}

/**
 * Batch validation for multiple fields
 */
export function validateFields(
  fields: Record<string, unknown>,
  validations: Record<string, (value: unknown) => ValidationResult<any>>
): { success: boolean; data?: Record<string, any>; errors?: Record<string, string> } {
  const data: Record<string, any> = {}
  const errors: Record<string, string> = {}
  let hasErrors = false

  for (const [field, value] of Object.entries(fields)) {
    const validation = validations[field]
    if (validation) {
      const result = validation(value)
      if (result.success) {
        data[field] = result.data
      } else {
        errors[field] = result.error || 'Validation failed'
        hasErrors = true
      }
    } else {
      data[field] = value // No validation specified, pass through
    }
  }

  return hasErrors ? { success: false, errors } : { success: true, data }
}

/**
 * Common validation schemas
 */
export const commonValidations = {
  email: (validator: AdvancedValidator) => (value: unknown) => validator.validateEmail(value),
  password: (validator: AdvancedValidator) => (value: unknown) => validator.validatePassword(value),
  name: (validator: AdvancedValidator) => (value: unknown) => 
    validator.validateString(value, { maxLength: 100, required: true }),
  description: (validator: AdvancedValidator) => (value: unknown) => 
    validator.validateString(value, { maxLength: 1000, allowHtml: false }),
  url: (validator: AdvancedValidator) => (value: unknown) => {
    const stringResult = validator.validateString(value, { maxLength: 2000 })
    if (!stringResult.success) return stringResult
    
    try {
      new URL(stringResult.data!)
      return { success: true, data: stringResult.data }
    } catch {
      return { success: false, error: 'Invalid URL format' }
    }
  }
}