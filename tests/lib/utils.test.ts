/**
 * Utils Library Tests
 */

import { cn, formatDuration, formatDate, generateId } from '@/lib/utils'

describe('Utils Library', () => {
  describe('cn function', () => {
    it('combines class names correctly', () => {
      const result = cn('btn', 'btn-primary')
      expect(result).toBe('btn btn-primary')
    })

    it('handles conditional classes', () => {
      const result = cn('btn', true && 'active', false && 'disabled')
      expect(result).toBe('btn active')
    })

    it('handles undefined and null values', () => {
      const result = cn('btn', undefined, null, 'active')
      expect(result).toBe('btn active')
    })
  })

  describe('formatDuration function', () => {
    it('formats minutes correctly', () => {
      expect(formatDuration(30)).toBe('30m')
      expect(formatDuration(5)).toBe('5m')
    })

    it('formats hours and minutes correctly', () => {
      expect(formatDuration(90)).toBe('1h 30m')
      expect(formatDuration(120)).toBe('2h')
      expect(formatDuration(135)).toBe('2h 15m')
    })

    it('handles zero duration', () => {
      expect(formatDuration(0)).toBe('0m')
    })
  })

  describe('formatDate function', () => {
    it('formats date with default format', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15, 2024/) // Basic format check
    })

    it('formats date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDate(date, 'yyyy-MM-dd')
      expect(result).toBe('2024-01-15')
    })
  })

  describe('generateId function', () => {
    it('generates unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })

    it('generates IDs with specified length', () => {
      const id = generateId(10)
      expect(id.length).toBe(10)
    })
  })
})