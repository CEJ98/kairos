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

  /**
   * Generate rest recommendations based on workout intensity
   */
  generateRestRecommendations(workout: any): {
    minimumHours: number
    activeRecovery: boolean
    nutritionFocus: string[]
  } {
    const intensity = workout.intensity || 5
    const type = workout.type || 'strength'
    
    let minimumHours = 24
    let activeRecovery = false
    let nutritionFocus = ['hydration']
    
    // High intensity workouts need more rest
    if (intensity >= 8) {
      minimumHours = 48
      activeRecovery = true
      nutritionFocus = ['protein', 'carbohydrates', 'hydration']
    } else if (intensity >= 6) {
      minimumHours = 36
      activeRecovery = true
      nutritionFocus = ['protein', 'hydration']
    } else if (intensity <= 4) {
      minimumHours = 12
      activeRecovery = false
      nutritionFocus = ['hydration']
    }
    
    // Cardio workouts generally need less rest
    if (type === 'cardio' && intensity < 7) {
      minimumHours = Math.max(12, minimumHours - 12)
    }
    
    return {
      minimumHours,
      activeRecovery,
      nutritionFocus
    }
  }

  /**
   * Calculate calories burned during a workout
   */
  calculateCaloriesBurned(workout: any, userProfile: any): number {
    const { weight = 70, age = 30, gender = 'male' } = userProfile
    const { duration = 60, intensity = 'medium', type = 'strength' } = workout
    
    // MET values for different workout types and intensities
    const metValues: { [key: string]: { [key: string]: number } } = {
      strength: { low: 4.0, medium: 6.0, high: 8.0 },
      cardio: { low: 8.0, medium: 12.0, high: 15.0 },
      flexibility: { low: 2.5, medium: 3.0, high: 3.5 }
    }
    
    const met = metValues[type]?.[intensity] || 6.0
    
    // Calories burned = MET * weight (kg) * duration (hours)
    const durationHours = duration / 60
    const caloriesBurned = met * weight * durationHours
    
    return Math.round(caloriesBurned)
  }

  /**
   * Generate workout based on user preferences
   */
  async generateWorkout(preferences: any): Promise<any> {
    const { fitnessLevel, goals, duration, availableTime, equipment, bodyParts } = preferences;
    
    // Handle both duration and availableTime
    const workoutDuration = duration || availableTime;
    
    // Handle goals as array or string
    const primaryGoal = Array.isArray(goals) ? goals[0] : goals;
    
    // Validate preferences
    if (!fitnessLevel || !goals || !workoutDuration) {
      throw new Error('Missing required preferences: fitnessLevel, goals, and duration are required');
    }
    
    if (workoutDuration < 15 || workoutDuration > 180) {
      throw new Error('Duration must be between 15 and 180 minutes');
    }
    
    // Generate basic workout structure
    const workout = {
      id: `workout_${Date.now()}`,
      name: `${primaryGoal} Workout`,
      duration: workoutDuration,
      estimatedDuration: workoutDuration,
      difficulty: fitnessLevel,
      fitnessLevel,
      exercises: this.generateExercisesForGoals(primaryGoal, fitnessLevel, equipment || [], bodyParts || [])
    };
    
    return workout;
  }

  /**
   * Generate exercises based on goals and fitness level
   */
  private generateExercisesForGoals(goals: string, fitnessLevel: string, equipment: string[], bodyParts: string[]): any[] {
    const exercises: any[] = [];
    
    // Basic exercise templates based on goals
    const exerciseTemplates = {
      strength: [
        { name: 'Push-ups', sets: 3, reps: 10, type: 'bodyweight' },
        { name: 'Squats', sets: 3, reps: 12, type: 'bodyweight' },
        { name: 'Plank', sets: 3, reps: 30, type: 'bodyweight' }
      ],
      muscle_gain: [
        { name: 'Push-ups', sets: 4, reps: 8, type: 'bodyweight' },
        { name: 'Squats', sets: 4, reps: 10, type: 'bodyweight' },
        { name: 'Pull-ups', sets: 3, reps: 6, type: 'bodyweight' }
      ],
      general_fitness: [
        { name: 'Jumping Jacks', sets: 3, reps: 15, type: 'bodyweight' },
        { name: 'Push-ups', sets: 2, reps: 8, type: 'bodyweight' },
        { name: 'Squats', sets: 2, reps: 10, type: 'bodyweight' }
      ],
      cardio: [
        { name: 'Jumping Jacks', sets: 3, reps: 20, type: 'bodyweight' },
        { name: 'High Knees', sets: 3, reps: 30, type: 'bodyweight' },
        { name: 'Burpees', sets: 2, reps: 8, type: 'bodyweight' }
      ],
      flexibility: [
        { name: 'Forward Fold', sets: 1, reps: 30, type: 'stretch' },
        { name: 'Cat-Cow', sets: 1, reps: 10, type: 'stretch' },
        { name: 'Child\'s Pose', sets: 1, reps: 60, type: 'stretch' }
      ]
    };
    
    const selectedExercises = exerciseTemplates[goals as keyof typeof exerciseTemplates] || exerciseTemplates.strength;
    
    // Adjust difficulty based on fitness level
    selectedExercises.forEach(exercise => {
      const adjustedExercise = { ...exercise };
      
      if (fitnessLevel === 'beginner') {
        adjustedExercise.sets = Math.max(1, adjustedExercise.sets - 1);
        adjustedExercise.reps = Math.max(8, Math.floor(adjustedExercise.reps * 0.8));
      } else if (fitnessLevel === 'advanced') {
        adjustedExercise.sets += 1;
        adjustedExercise.reps = Math.floor(adjustedExercise.reps * 1.3);
      }
      
      exercises.push(adjustedExercise);
    });
    
    return exercises;
  }

  /**
   * Calculate workout intensity based on exercises and parameters
   */
  calculateWorkoutIntensity(workout: any): number {
    if (!workout.exercises || workout.exercises.length === 0) {
      return 0;
    }
    
    let totalIntensity = 0;
    let exerciseCount = 0;
    const exercises: any[] = workout.exercises;
    
    exercises.forEach((exercise: any) => {
      const { sets = 1, reps = 1, weight = 0, restTime = 60 } = exercise;
      
      // Calculate intensity on a 0-10 scale
      let intensity = 0;
      
      // Base intensity from sets and reps
      intensity += (sets * reps) / 10;
      
      // Add weight factor (normalized)
      if (weight > 0) {
        intensity += Math.min(weight / 50, 3); // Cap weight contribution
      }
      
      // Rest time factor (less rest = higher intensity)
      const restFactor = Math.max(0, (120 - restTime) / 60);
      intensity += restFactor;
      
      totalIntensity += Math.min(intensity, 10); // Cap at 10
      exerciseCount++;
    });
    
    // Return average intensity across all exercises, capped at 10
    return Math.min(exerciseCount > 0 ? totalIntensity / exerciseCount : 0, 10);
  }

  /**
   * Progress workout based on performance data
   */
  progressWorkout(currentWorkout: any, performanceData: any): any {
    const { completedSets, avgRpe, formQuality, completionRate, avgRPE, formScore } = performanceData;
    const adjustedWorkout = JSON.parse(JSON.stringify(currentWorkout)); // Deep copy
    
    // Normalize performance data (support both naming conventions)
    const rpe = avgRpe || avgRPE || 5;
    const form = formQuality || formScore || 5;
    const completion = completionRate || (completedSets ? completedSets / (currentWorkout.exercises?.[0]?.sets || 3) : 1);
    
    // Determine progression factor based on performance
    let progressionFactor = 1.0;
    
    if (completion >= 0.9 && rpe <= 7 && form >= 8) {
      // Good performance - increase difficulty
      progressionFactor = 1.05;
    } else if (completion < 0.7 || rpe >= 9 || form < 6) {
      // Poor performance - decrease difficulty
      progressionFactor = 0.95;
    }
    
    // Apply progression to exercises
    if (adjustedWorkout.exercises) {
      adjustedWorkout.exercises.forEach((exercise: any) => {
        if (exercise.weight) {
          exercise.weight = Math.round(exercise.weight * progressionFactor);
        }
        if (exercise.reps && progressionFactor > 1.0) {
          exercise.reps = Math.min(exercise.reps + 1, 15);
        } else if (exercise.reps && progressionFactor < 1.0) {
          exercise.reps = Math.max(exercise.reps - 1, 5);
        }
      });
    }
    
    return adjustedWorkout;
  }

  /**
   * Validate exercise form based on movement data
   */
  validateExerciseForm(exerciseData: any): {
    isValid: boolean;
    corrections: string[];
    score: number;
  } {
    const { movementPattern, reps, weight, duration, form_cues } = exerciseData
    const corrections: string[] = []
    let score = 8
    
    // Check for form cues
    if (form_cues && Array.isArray(form_cues)) {
      form_cues.forEach((cue: string) => {
        // Positive form cues (good form indicators)
        if (['chest_to_ground', 'straight_body', 'controlled_movement'].includes(cue)) {
          score += 1 // Bonus for good form
        } else {
          // Negative form cues (problems)
          switch (cue) {
            case 'knees_caving':
              corrections.push('Keep knees aligned with toes')
              score -= 3
              break
            case 'forward_lean':
              corrections.push('Maintain upright torso position')
              score -= 2
              break
            case 'incomplete_depth':
              corrections.push('Achieve full range of motion')
              score -= 2
              break
            default:
              corrections.push('Check exercise form')
              score -= 1
          }
        }
      })
    }
    
    // Check for basic form issues
    if (movementPattern && movementPattern.speed > 2.0) {
      corrections.push('Movement too fast - focus on controlled motion')
      score -= 2
    }
    
    if (movementPattern && movementPattern.range < 0.7) {
      corrections.push('Incomplete range of motion')
      score -= 1
    }
    
    if (weight && reps && (weight * reps > 1000)) {
      corrections.push('Weight may be too heavy for proper form')
      score -= 3
    }
    
    const isValid = score >= 5
    
    return {
      isValid,
      corrections,
      score: Math.max(0, score)
    }
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