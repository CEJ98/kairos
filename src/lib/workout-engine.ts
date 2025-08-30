/**
 * Advanced Workout Engine for Kairos Fitness
 * Handles intelligent workout generation, progression, and analytics
 */

import { prisma } from './db'
import { 
  CreateWorkoutInput, 
  UpdateWorkoutInput,
  CreateWorkoutSessionInput,
  ExerciseFilterInput 
} from './validations'
import { logger } from './logger'

// Types for workout engine
export interface WorkoutRecommendation {
  workoutId: string
  confidence: number
  reason: string
  adaptations: string[]
}

export interface ProgressionSuggestion {
  exerciseId: string
  currentLoad: number
  suggestedLoad: number
  progressionType: 'weight' | 'reps' | 'sets' | 'duration'
  reasoning: string
}

export interface WorkoutAnalytics {
  totalSessions: number
  averageDuration: number
  averageCaloriesBurned: number
  muscleGroupDistribution: Record<string, number>
  difficultyProgression: Array<{ date: string; avgDifficulty: number }>
  consistencyScore: number
  strengthProgression: Record<string, number[]>
}

/**
 * Advanced Workout Engine Class
 */
export class WorkoutEngine {
  private static instance: WorkoutEngine
  
  static getInstance(): WorkoutEngine {
    if (!WorkoutEngine.instance) {
      WorkoutEngine.instance = new WorkoutEngine()
    }
    return WorkoutEngine.instance
  }

  /**
   * Generate personalized workout recommendations
   */
  async generateRecommendations(
    userId: string,
    limit: number = 3
  ): Promise<WorkoutRecommendation[]> {
    try {
      // Get user profile and fitness data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          clientProfiles: true,
          workoutSessions: {
            include: {
              workout: true,
              exercises: {
                include: {
                  exercise: true
                }
              }
            },
            orderBy: {
              startTime: 'desc'
            },
            take: 10 // Last 10 sessions for analysis
          }
        }
      })

      if (!user || !user.clientProfiles[0]) {
        return []
      }

      const profile = user.clientProfiles[0]
      const recentSessions = user.workoutSessions

      // Analyze user preferences and performance
      const preferences = await this.analyzeUserPreferences(recentSessions)
      
      // Get available workouts that match user profile
      const availableWorkouts = await prisma.workout.findMany({
        where: {
          OR: [
            { isPublic: true },
            { creatorId: userId },
            { assignedToId: userId }
          ]
        },
        include: {
          exercises: {
            include: {
              exercise: true
            }
          }
        }
      })

      // Score and rank workouts
      const scoredWorkouts = availableWorkouts.map(workout => {
        const score = this.calculateWorkoutScore(workout, profile, preferences)
        return {
          workout,
          score: score.confidence,
          reason: score.reason,
          adaptations: score.adaptations
        }
      })

      // Sort by score and return top recommendations
      return scoredWorkouts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          workoutId: item.workout.id,
          confidence: item.score,
          reason: item.reason,
          adaptations: item.adaptations
        }))

    } catch (error) {
      logger.error('Error generating workout recommendations:', error)
      return []
    }
  }

  /**
   * Generate progression suggestions for user
   */
  async generateProgressionSuggestions(
    userId: string
  ): Promise<ProgressionSuggestion[]> {
    try {
      // Get user's recent exercise performance
      const recentSessions = await prisma.workoutSession.findMany({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        include: {
          exercises: {
            include: {
              exercise: true
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        },
        take: 20 // Last 20 sessions
      })

      if (recentSessions.length < 3) {
        return [] // Need at least 3 sessions for progression analysis
      }

      const suggestions: ProgressionSuggestion[] = []

      // Group exercises by exercise ID
      const exercisePerformance = new Map<string, any[]>()
      
      recentSessions.forEach(session => {
        session.exercises.forEach(exerciseLog => {
          if (!exercisePerformance.has(exerciseLog.exerciseId)) {
            exercisePerformance.set(exerciseLog.exerciseId, [])
          }
          exercisePerformance.get(exerciseLog.exerciseId)!.push({
            date: session.startTime,
            ...exerciseLog
          })
        })
      })

      // Analyze progression for each exercise
      for (const [exerciseId, performances] of Array.from(exercisePerformance.entries())) {
        if (performances.length < 3) continue

        const suggestion = await this.analyzeExerciseProgression(
          exerciseId, 
          performances
        )
        
        if (suggestion) {
          suggestions.push(suggestion)
        }
      }

      return suggestions.slice(0, 10) // Top 10 suggestions

    } catch (error) {
      logger.error('Error generating progression suggestions:', error)
      return []
    }
  }

  /**
   * Generate comprehensive workout analytics
   */
  async generateWorkoutAnalytics(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<WorkoutAnalytics> {
    try {
      const days = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days[timeframe])

      const sessions = await prisma.workoutSession.findMany({
        where: {
          userId,
          startTime: {
            gte: startDate
          },
          status: 'COMPLETED'
        },
        include: {
          exercises: {
            include: {
              exercise: true
            }
          },
          workout: {
            include: {
              exercises: {
                include: {
                  exercise: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      })

      // Calculate analytics
      const analytics: WorkoutAnalytics = {
        totalSessions: sessions.length,
        averageDuration: this.calculateAverageDuration(sessions),
        averageCaloriesBurned: this.calculateAverageCalories(sessions),
        muscleGroupDistribution: this.calculateMuscleGroupDistribution(sessions),
        difficultyProgression: this.calculateDifficultyProgression(sessions),
        consistencyScore: this.calculateConsistencyScore(sessions, days[timeframe]),
        strengthProgression: this.calculateStrengthProgression(sessions)
      }

      return analytics

    } catch (error) {
      logger.error('Error generating workout analytics:', error)
      return {
        totalSessions: 0,
        averageDuration: 0,
        averageCaloriesBurned: 0,
        muscleGroupDistribution: {},
        difficultyProgression: [],
        consistencyScore: 0,
        strengthProgression: {}
      }
    }
  }

  /**
   * Create adaptive workout based on user performance
   */
  async createAdaptiveWorkout(
    userId: string,
    targetDuration: number = 45,
    focusAreas: string[] = []
  ): Promise<CreateWorkoutInput | null> {
    try {
      // Get user data and preferences
      const recommendations = await this.generateRecommendations(userId, 1)
      const progressions = await this.generateProgressionSuggestions(userId)
      
      // Get available exercises
      const exercises = await prisma.exercise.findMany({
        where: {
          isActive: true
        }
      })
      
      // Filter by focus areas if specified
      const filteredExercises = focusAreas.length > 0 
        ? exercises.filter(exercise => {
            if (!exercise.muscleGroups) return false
            try {
              const muscleGroups = JSON.parse(exercise.muscleGroups)
              return Array.isArray(muscleGroups) && 
                     focusAreas.some(area => muscleGroups.includes(area))
            } catch {
              return false
            }
          })
        : exercises

      if (filteredExercises.length < 3) {
        return null // Need at least 3 exercises
      }

      // Select exercises intelligently
      const selectedExercises = this.selectExercisesForAdaptiveWorkout(
        filteredExercises,
        progressions,
        focusAreas,
        targetDuration
      )

      // Create workout structure
      const adaptiveWorkout: CreateWorkoutInput = {
        name: `Adaptive Workout - ${new Date().toLocaleDateString()}`,
        description: 'Automatically generated workout based on your progress and preferences',
        category: this.determineBestCategory(selectedExercises),
        duration: targetDuration,
        isTemplate: false,
        isPublic: false,
        exercises: selectedExercises.map((exercise, index) => ({
          exerciseId: exercise.id,
          order: index + 1,
          sets: exercise.suggestedSets,
          reps: exercise.suggestedReps,
          weight: exercise.suggestedWeight,
          duration: exercise.suggestedDuration,
          restTime: exercise.suggestedRest,
          notes: exercise.progressionNote
        }))
      }

      return adaptiveWorkout

    } catch (error) {
      logger.error('Error creating adaptive workout:', error)
      return null
    }
  }

  // Private helper methods

  private async analyzeUserPreferences(sessions: any[]): Promise<any> {
    const preferences = {
      preferredCategories: new Map<string, number>(),
      preferredDifficulty: 'INTERMEDIATE',
      preferredDuration: 45,
      consistentMuscleGroups: [],
      averageIntensity: 0
    }

    sessions.forEach(session => {
      if (session.workout?.category) {
        const current = preferences.preferredCategories.get(session.workout.category) || 0
        preferences.preferredCategories.set(session.workout.category, current + 1)
      }
    })

    return preferences
  }

  private calculateWorkoutScore(workout: any, profile: any, preferences: any): any {
    let confidence = 0
    let reason = ''
    let adaptations: string[] = []

    // Base score factors
    const categoryMatch = preferences.preferredCategories.has(workout.category)
    if (categoryMatch) {
      confidence += 0.3
      reason += 'Matches your preferred category. '
    }

    // Difficulty alignment
    const difficultyScore = this.calculateDifficultyAlignment(workout, profile)
    confidence += difficultyScore * 0.2

    // Duration preference
    if (Math.abs((workout.duration || 45) - preferences.preferredDuration) <= 15) {
      confidence += 0.2
      reason += 'Good duration match. '
    }

    // Muscle group balance
    const muscleBalance = this.calculateMuscleGroupBalance(workout)
    confidence += muscleBalance * 0.3

    // Ensure confidence is between 0 and 1
    confidence = Math.min(1, Math.max(0, confidence))

    return { confidence, reason, adaptations }
  }

  private calculateDifficultyAlignment(workout: any, profile: any): number {
    // This would analyze workout difficulty vs user experience level
    // For now, return a neutral score
    return 0.5
  }

  private calculateMuscleGroupBalance(workout: any): number {
    // Analyze if workout has good muscle group distribution
    const muscleGroups = new Set()
    workout.exercises?.forEach((we: any) => {
      const groups = JSON.parse(we.exercise.muscleGroups || '[]')
      groups.forEach((group: string) => muscleGroups.add(group))
    })
    
    // More muscle groups = better balance (up to a point)
    return Math.min(1, muscleGroups.size / 6)
  }

  private async analyzeExerciseProgression(
    exerciseId: string,
    performances: any[]
  ): Promise<ProgressionSuggestion | null> {
    try {
      // Sort by date
      performances.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      const latest = performances[performances.length - 1]
      const previous = performances[performances.length - 2]

      // Analyze weight progression
      const latestWeight = this.parseWeightArray(latest.weightUsed)
      const previousWeight = this.parseWeightArray(previous.weightUsed)

      if (latestWeight && previousWeight) {
        const avgLatest = latestWeight.reduce((a, b) => a + b, 0) / latestWeight.length
        const avgPrevious = previousWeight.reduce((a, b) => a + b, 0) / previousWeight.length

        // If user has been consistent with weight for 3+ sessions, suggest progression
        if (avgLatest === avgPrevious && performances.length >= 3) {
          return {
            exerciseId,
            currentLoad: avgLatest,
            suggestedLoad: avgLatest * 1.05, // 5% increase
            progressionType: 'weight',
            reasoning: 'You\'ve maintained consistent weight. Time to progress!'
          }
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  private parseWeightArray(weightUsed: string | null): number[] | null {
    if (!weightUsed) return null
    try {
      return JSON.parse(weightUsed)
    } catch {
      return null
    }
  }

  private calculateAverageDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    return Math.round(totalDuration / sessions.length / 60) // Convert to minutes
  }

  private calculateAverageCalories(sessions: any[]): number {
    if (sessions.length === 0) return 0
    const totalCalories = sessions.reduce((sum, session) => sum + (session.caloriesBurned || 0), 0)
    return Math.round(totalCalories / sessions.length)
  }

  private calculateMuscleGroupDistribution(sessions: any[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    
    sessions.forEach(session => {
      session.exercises?.forEach((exerciseLog: any) => {
        const muscleGroups = JSON.parse(exerciseLog.exercise?.muscleGroups || '[]')
        muscleGroups.forEach((group: string) => {
          distribution[group] = (distribution[group] || 0) + 1
        })
      })
    })

    return distribution
  }

  private calculateDifficultyProgression(sessions: any[]): Array<{ date: string; avgDifficulty: number }> {
    const progression: Array<{ date: string; avgDifficulty: number }> = []
    
    sessions.forEach(session => {
      const difficulties = session.exercises
        ?.map((ex: any) => ex.difficulty || 5)
        .filter((d: number) => d > 0) || []
      
      if (difficulties.length > 0) {
        const avgDifficulty = difficulties.reduce((sum: number, d: number) => sum + d, 0) / difficulties.length
        progression.push({
          date: session.startTime.toISOString().split('T')[0],
          avgDifficulty: Math.round(avgDifficulty * 10) / 10
        })
      }
    })

    return progression
  }

  private calculateConsistencyScore(sessions: any[], totalDays: number): number {
    if (sessions.length === 0) return 0
    
    // Calculate based on frequency and regularity
    const frequency = sessions.length / (totalDays / 7) // Sessions per week
    const idealFrequency = 3 // 3 sessions per week is ideal
    
    const frequencyScore = Math.min(1, frequency / idealFrequency)
    
    // Calculate regularity (how evenly spaced are the sessions)
    const regularityScore = this.calculateRegularityScore(sessions)
    
    // Combine scores
    const consistencyScore = (frequencyScore * 0.7) + (regularityScore * 0.3)
    
    return Math.round(consistencyScore * 100)
  }

  private calculateRegularityScore(sessions: any[]): number {
    if (sessions.length < 2) return 1

    const intervals = []
    for (let i = 1; i < sessions.length; i++) {
      const interval = new Date(sessions[i].startTime).getTime() - new Date(sessions[i-1].startTime).getTime()
      intervals.push(interval / (1000 * 60 * 60 * 24)) // Convert to days
    }

    // Calculate standard deviation of intervals
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length
    const stdDev = Math.sqrt(variance)

    // Lower standard deviation = higher regularity
    // Normalize to 0-1 scale (assuming max reasonable stdDev is 7 days)
    return Math.max(0, 1 - (stdDev / 7))
  }

  private calculateStrengthProgression(sessions: any[]): Record<string, number[]> {
    const progression: Record<string, number[]> = {}
    
    sessions.forEach(session => {
      session.exercises?.forEach((exerciseLog: any) => {
        const exerciseName = exerciseLog.exercise?.name
        if (exerciseName && exerciseLog.weightUsed) {
          try {
            const weights = JSON.parse(exerciseLog.weightUsed)
            const maxWeight = Math.max(...weights)
            
            if (!progression[exerciseName]) {
              progression[exerciseName] = []
            }
            progression[exerciseName].push(maxWeight)
          } catch (error) {
            // Ignore parsing errors
          }
        }
      })
    })

    return progression
  }

  private selectExercisesForAdaptiveWorkout(
    exercises: any[],
    progressions: ProgressionSuggestion[],
    focusAreas: string[],
    targetDuration: number
  ): any[] {
    // This would implement intelligent exercise selection
    // For now, return a simple selection
    return exercises.slice(0, Math.min(6, exercises.length)).map(exercise => ({
      id: exercise.id,
      suggestedSets: 3,
      suggestedReps: 12,
      suggestedWeight: undefined,
      suggestedDuration: exercise.category === 'CARDIO' ? 180 : undefined,
      suggestedRest: 60,
      progressionNote: 'Standard progression'
    }))
  }

  private determineBestCategory(exercises: any[]): 'STRENGTH' | 'CARDIO' | 'HIIT' | 'YOGA' | 'PILATES' | 'FUNCTIONAL' | 'STRETCHING' {
    // Analyze exercise categories and return most appropriate
    return 'FUNCTIONAL'
  }
}