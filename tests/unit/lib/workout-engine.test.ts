import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkoutEngine } from '@/lib/workout-engine'

// Mock external dependencies
vi.mock('@/lib/supabase-client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: null, error: null })),
      update: vi.fn(() => ({ data: null, error: null })),
      delete: vi.fn(() => ({ data: null, error: null }))
    }))
  }))
}))

describe('WorkoutEngine', () => {
  let workoutEngine: WorkoutEngine
  
  beforeEach(() => {
    workoutEngine = new WorkoutEngine()
  })

  describe('generateWorkout', () => {
    it('should generate workout based on user preferences', async () => {
      const userPreferences = {
        fitnessLevel: 'intermediate',
        goals: ['strength', 'muscle_gain'],
        availableTime: 45,
        equipment: ['dumbbells', 'barbell'],
        bodyParts: ['chest', 'back', 'shoulders']
      }
      
      const workout = await workoutEngine.generateWorkout(userPreferences)
      
      expect(workout).toBeDefined()
      expect(workout.exercises.length).toBeGreaterThan(0)
      expect(workout.estimatedDuration).toBeLessThanOrEqual(userPreferences.availableTime)
      expect(workout.difficulty).toBe(userPreferences.fitnessLevel)
    })

    it('should adapt workout for beginner level', async () => {
      const beginnerPreferences = {
        fitnessLevel: 'beginner',
        goals: ['general_fitness'],
        availableTime: 30,
        equipment: ['bodyweight']
      }
      
      const workout = await workoutEngine.generateWorkout(beginnerPreferences)
      
      expect(workout.exercises.every(ex => ex.sets <= 3)).toBe(true)
      expect(workout.exercises.every(ex => ex.reps >= 8)).toBe(true)
      expect(workout.difficulty).toBe('beginner')
    })

    it('should throw error for invalid preferences', async () => {
      const invalidPreferences = {
        fitnessLevel: 'invalid_level',
        availableTime: -10
      }
      
      await expect(workoutEngine.generateWorkout(invalidPreferences)).rejects.toThrow()
    })
  })

  describe('calculateWorkoutIntensity', () => {
    it('should calculate intensity correctly', () => {
      const workout = {
        exercises: [
          { sets: 3, reps: 8, weight: 100, restTime: 60 },
          { sets: 4, reps: 10, weight: 80, restTime: 45 },
          { sets: 2, reps: 12, weight: 60, restTime: 30 }
        ],
        totalTime: 45
      }
      
      const intensity = workoutEngine.calculateWorkoutIntensity(workout)
      
      expect(intensity).toBeGreaterThan(0)
      expect(intensity).toBeLessThanOrEqual(10)
    })

    it('should handle workout with no exercises', () => {
      const emptyWorkout = { exercises: [], totalTime: 0 }
      
      const intensity = workoutEngine.calculateWorkoutIntensity(emptyWorkout)
      
      expect(intensity).toBe(0)
    })
  })

  describe('progressWorkout', () => {
    it('should progress workout based on performance', () => {
      const currentWorkout = {
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 8, weight: 100 }
        ]
      }
      
      const performance = {
        completedSets: 3,
        avgRpe: 7, // Rate of Perceived Exertion
        formQuality: 8
      }
      
      const progressedWorkout = workoutEngine.progressWorkout(currentWorkout, performance)
      
      expect(progressedWorkout.exercises[0].weight).toBeGreaterThan(100)
    })

    it('should regress workout if performance is poor', () => {
      const currentWorkout = {
        exercises: [
          { name: 'Squat', sets: 4, reps: 6, weight: 150 }
        ]
      }
      
      const poorPerformance = {
        completedSets: 2, // Only completed 2 out of 4 sets
        avgRpe: 10, // Maximum exertion
        formQuality: 4 // Poor form
      }
      
      const adjustedWorkout = workoutEngine.progressWorkout(currentWorkout, poorPerformance)
      
      expect(adjustedWorkout.exercises[0].weight).toBeLessThanOrEqual(150)
    })
  })

  describe('validateExerciseForm', () => {
    it('should validate correct exercise form', () => {
      const exerciseData = {
        name: 'Push-up',
        sets: 3,
        reps: 10,
        form_cues: ['chest_to_ground', 'straight_body', 'controlled_movement']
      }
      
      const formValidation = workoutEngine.validateExerciseForm(exerciseData)
      
      expect(formValidation.isValid).toBe(true)
      expect(formValidation.score).toBeGreaterThan(7)
    })

    it('should detect poor exercise form', () => {
      const exerciseData = {
        name: 'Squat',
        sets: 3,
        reps: 8,
        form_cues: ['knees_caving', 'forward_lean', 'incomplete_depth']
      }
      
      const formValidation = workoutEngine.validateExerciseForm(exerciseData)
      
      expect(formValidation.isValid).toBe(false)
      expect(formValidation.score).toBeLessThan(5)
      expect(formValidation.corrections.length).toBeGreaterThan(0)
    })
  })

  describe('calculateCaloriesBurned', () => {
    it('should calculate calories for strength training', () => {
      const workout = {
        type: 'strength',
        duration: 45,
        exercises: [
          { sets: 3, reps: 8, weight: 100 },
          { sets: 4, reps: 10, weight: 80 }
        ]
      }
      
      const userProfile = {
        weight: 75, // kg
        age: 30,
        gender: 'male',
        fitnessLevel: 'intermediate'
      }
      
      const calories = workoutEngine.calculateCaloriesBurned(workout, userProfile)
      
      expect(calories).toBeGreaterThan(200)
      expect(calories).toBeLessThan(800)
    })

    it('should calculate calories for cardio workout', () => {
      const cardioWorkout = {
        type: 'cardio',
        duration: 30,
        avgHeartRate: 150,
        intensity: 'medium'
      }
      
      const userProfile = {
        weight: 70,
        age: 25,
        gender: 'female'
      }
      
      const calories = workoutEngine.calculateCaloriesBurned(cardioWorkout, userProfile)
      
      expect(calories).toBeGreaterThan(250)
      expect(calories).toBeLessThan(500)
    })
  })

  describe('generateRestRecommendations', () => {
    it('should recommend appropriate rest based on workout intensity', () => {
      const highIntensityWorkout = {
        intensity: 9,
        type: 'strength',
        totalVolume: 12000 // kg * reps
      }
      
      const restRecommendation = workoutEngine.generateRestRecommendations(highIntensityWorkout)
      
      expect(restRecommendation.minimumHours).toBeGreaterThanOrEqual(48)
      expect(restRecommendation.activeRecovery).toBe(true)
      expect(restRecommendation.nutritionFocus).toContain('protein')
    })

    it('should recommend less rest for low intensity workout', () => {
      const lowIntensityWorkout = {
        intensity: 4,
        type: 'cardio',
        duration: 20
      }
      
      const restRecommendation = workoutEngine.generateRestRecommendations(lowIntensityWorkout)
      
      expect(restRecommendation.minimumHours).toBeLessThanOrEqual(24)
      expect(restRecommendation.activeRecovery).toBe(false)
    })
  })
})