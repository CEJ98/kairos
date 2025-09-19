import { describe, it, expect } from 'vitest'
import { 
  validateWorkout, 
  validateExercise, 
  validateUserProfile, 
  validateMeasurement,
  sanitizeWorkoutData,
  validatePassword,
  validateEmailFormat
} from '@/lib/validation'

describe('Validation Library', () => {
  describe('validateWorkout', () => {
    it('should validate valid workout data', () => {
      const validWorkout = {
        name: 'Morning Routine',
        description: 'A comprehensive morning workout',
        exercises: [
          {
            id: 'ex1',
            name: 'Push-ups',
            sets: 3,
            reps: 10,
            weight: 0
          }
        ],
        duration: 30,
        difficulty: 'intermediate'
      }
      
      expect(() => validateWorkout(validWorkout)).not.toThrow()
    })

    it('should reject workout with missing required fields', () => {
      const invalidWorkout = {
        description: 'Missing name',
        exercises: []
      }
      
      expect(() => validateWorkout(invalidWorkout)).toThrow()
    })

    it('should reject workout with invalid exercises', () => {
      const workoutWithInvalidExercise = {
        name: 'Test Workout',
        exercises: [
          {
            name: 'Invalid Exercise',
            sets: -1, // Invalid negative sets
            reps: 0,
            weight: 'invalid' // Invalid weight type
          }
        ]
      }
      
      expect(() => validateWorkout(workoutWithInvalidExercise)).toThrow()
    })
  })

  describe('validateExercise', () => {
    it('should validate valid exercise data', () => {
      const validExercise = {
        name: 'Bench Press',
        sets: 3,
        reps: 8,
        weight: 135,
        restTime: 60,
        category: 'strength'
      }
      
      expect(() => validateExercise(validExercise)).not.toThrow()
    })

    it('should reject exercise with invalid numeric values', () => {
      const invalidExercise = {
        name: 'Test Exercise',
        sets: 0, // Should be > 0
        reps: -5, // Should be > 0
        weight: -10 // Should be >= 0
      }
      
      expect(() => validateExercise(invalidExercise)).toThrow()
    })
  })

  describe('validateUserProfile', () => {
    it('should validate complete user profile', () => {
      const validProfile = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        height: 180,
        weight: 75,
        fitnessLevel: 'intermediate',
        goals: ['weight_loss', 'strength']
      }
      
      expect(() => validateUserProfile(validProfile)).not.toThrow()
    })

    it('should reject profile with invalid email', () => {
      const invalidProfile = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe'
      }
      
      expect(() => validateUserProfile(invalidProfile)).toThrow()
    })

    it('should reject profile with invalid age', () => {
      const invalidProfile = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 150 // Unrealistic age
      }
      
      expect(() => validateUserProfile(invalidProfile)).toThrow()
    })
  })

  describe('validateMeasurement', () => {
    it('should validate valid measurement data', () => {
      const validMeasurement = {
        type: 'weight',
        value: 75.5,
        unit: 'kg',
        date: new Date().toISOString(),
        userId: 'user123'
      }
      
      expect(() => validateMeasurement(validMeasurement)).not.toThrow()
    })

    it('should reject measurement with invalid value', () => {
      const invalidMeasurement = {
        type: 'weight',
        value: -5, // Negative weight
        unit: 'kg',
        date: new Date().toISOString()
      }
      
      expect(() => validateMeasurement(invalidMeasurement)).toThrow()
    })

    it('should reject measurement with future date', () => {
      const futureMeasurement = {
        type: 'weight',
        value: 75,
        unit: 'kg',
        date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      }
      
      expect(() => validateMeasurement(futureMeasurement)).toThrow()
    })
  })

  describe('sanitizeWorkoutData', () => {
    it('should sanitize workout input data', () => {
      const unsafeWorkout = {
        name: '<script>alert("xss")</script>Morning Workout',
        description: 'Safe description with <b>bold</b> text',
        exercises: [
          {
            name: '<img src="x" onerror="alert(1)">Push-ups',
            notes: 'Clean notes'
          }
        ]
      }
      
      const sanitized = sanitizeWorkoutData(unsafeWorkout)
      
      expect(sanitized.name).not.toContain('<script>')
      expect(sanitized.description).toContain('<b>bold</b>')
      expect(sanitized.exercises[0].name).not.toContain('<img')
    })
  })

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongP@ssw0rd123'
      expect(validatePassword(strongPassword)).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false)
      expect(validatePassword('12345678')).toBe(false)
      expect(validatePassword('password')).toBe(false)
      expect(validatePassword('PASSWORD')).toBe(false)
    })

    it('should require minimum length', () => {
      expect(validatePassword('Sh0rt!')).toBe(false)
      expect(validatePassword('LongEnough123!')).toBe(true)
    })
  })

  describe('validateEmailFormat', () => {
    it('should validate proper email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]
      
      validEmails.forEach(email => {
        expect(validateEmailFormat(email)).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plaintext',
        '@domain.com',
        'user@',
        'user..double.dot@example.com',
        'user@domain.',
        'user name@domain.com'
      ]
      
      invalidEmails.forEach(email => {
        expect(validateEmailFormat(email)).toBe(false)
      })
    })
  })
})