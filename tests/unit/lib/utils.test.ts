import { describe, it, expect, vi } from 'vitest'
import { cn, formatDate, calculateAge, validateEmail, sanitizeInput, debounce, generateSecureId } from '@/lib/utils'

describe('Utils Library', () => {
  describe('cn (className helper)', () => {
    it('should merge classes correctly', () => {
      expect(cn('base', 'additional')).toBe('base additional')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'ignored')).toBe('base conditional')
    })

    it('should handle tailwind conflicts', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toMatch(/Jan 15, 2024/)
    })

    it('should handle invalid date', () => {
      expect(() => formatDate(new Date('invalid'))).toThrow()
    })
  })

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date('1990-01-01')
      const age = calculateAge(birthDate)
      expect(age).toBeGreaterThan(30)
      expect(age).toBeLessThan(40)
    })

    it('should handle future date', () => {
      const futureDate = new Date('2030-01-01')
      expect(calculateAge(futureDate)).toBe(0)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove XSS attempts', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('')
    })

    it('should preserve safe content', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World')
      expect(sanitizeInput('Safe <b>bold</b> text')).toBe('Safe <b>bold</b> text')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(mockFn).not.toHaveBeenCalled()
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('generateSecureId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateSecureId()
      const id2 = generateSecureId()
      
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(10)
      expect(id2.length).toBeGreaterThan(10)
    })

    it('should generate IDs with specified length', () => {
      const id = generateSecureId(16)
      expect(id.length).toBe(16)
    })
  })
})