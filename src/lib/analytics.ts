/**
 * Advanced Analytics System for Kairos Fitness
 * Tracks user behavior, performance metrics, and business KPIs
 */

import { prisma } from './db'
import { logger } from './logger'

// Types for analytics
export interface UserAnalytics {
  userId: string
  totalWorkouts: number
  totalWorkoutTime: number // in minutes
  averageWorkoutDuration: number
  favoriteWorkoutCategory: string
  longestStreak: number
  currentStreak: number
  totalCaloriesBurned: number
  strengthProgressionScore: number
  consistencyScore: number
  engagementLevel: 'low' | 'medium' | 'high'
}

export interface WorkoutAnalytics {
  workoutId: string
  totalCompletions: number
  averageRating: number
  averageDuration: number
  completionRate: number // percentage of users who complete vs start
  popularityScore: number
  difficultyRating: number
  userRetentionRate: number
}

export interface TrainerAnalytics {
  trainerId: string
  totalClients: number
  activeClients: number
  clientRetentionRate: number
  averageClientProgress: number
  workoutsCreated: number
  averageClientRating: number
  revenueGenerated: number
  responseTime: number // average response time to client messages
}

export interface BusinessMetrics {
  totalUsers: number
  activeUsers: number
  churnRate: number
  monthlyRecurringRevenue: number
  averageRevenuePerUser: number
  customerLifetimeValue: number
  conversionRate: number // free to paid
  dailyActiveUsers: number
  workoutCompletionRate: number
  supportTicketResolutionTime: number
}

export interface EngagementMetrics {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  averageSessionDuration: number
  bounceRate: number
  featureAdoptionRates: Record<string, number>
  userFlowDropoffs: Record<string, number>
}

/**
 * Analytics Engine Class
 */
export class AnalyticsEngine {
  private static instance: AnalyticsEngine

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine()
    }
    return AnalyticsEngine.instance
  }

  /**
   * Generate comprehensive user analytics
   */
  async generateUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          workoutSessions: {
            where: { status: 'COMPLETED' },
            orderBy: { startTime: 'desc' },
            include: {
              workout: true,
              exercises: true
            }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const sessions = user.workoutSessions
      const analytics: UserAnalytics = {
        userId,
        totalWorkouts: sessions.length,
        totalWorkoutTime: this.calculateTotalWorkoutTime(sessions),
        averageWorkoutDuration: this.calculateAverageWorkoutDuration(sessions),
        favoriteWorkoutCategory: this.calculateFavoriteCategory(sessions),
        longestStreak: await this.calculateLongestStreak(userId),
        currentStreak: await this.calculateCurrentStreak(userId),
        totalCaloriesBurned: this.calculateTotalCalories(sessions),
        strengthProgressionScore: await this.calculateStrengthProgression(userId),
        consistencyScore: this.calculateConsistencyScore(sessions),
        engagementLevel: this.determineEngagementLevel(sessions)
      }

      return analytics

    } catch (error) {
      logger.error('Error generating user analytics', error, 'ANALYTICS')
      throw error
    }
  }

  /**
   * Generate workout analytics
   */
  async generateWorkoutAnalytics(workoutId: string): Promise<WorkoutAnalytics> {
    try {
      const sessions = await prisma.workoutSession.findMany({
        where: { workoutId },
        include: {
          workout: true
        }
      })

      const completedSessions = sessions.filter(s => s.status === 'COMPLETED')
      const startedSessions = sessions.length

      const analytics: WorkoutAnalytics = {
        workoutId,
        totalCompletions: completedSessions.length,
        averageRating: this.calculateAverageRating(completedSessions),
        averageDuration: this.calculateAverageDuration(completedSessions),
        completionRate: startedSessions > 0 ? (completedSessions.length / startedSessions) * 100 : 0,
        popularityScore: this.calculatePopularityScore(sessions),
        difficultyRating: this.calculateDifficultyRating(completedSessions),
        userRetentionRate: await this.calculateWorkoutRetentionRate(workoutId)
      }

      return analytics

    } catch (error) {
      logger.error('Error generating workout analytics', error, 'ANALYTICS')
      throw error
    }
  }

  /**
   * Generate trainer analytics
   */
  async generateTrainerAnalytics(trainerId: string): Promise<TrainerAnalytics> {
    try {
      // Get trainer profile and related data
      const trainer = await prisma.user.findUnique({
        where: { id: trainerId, role: 'TRAINER' },
        include: {
          trainerProfile: {
            include: {
              clients: {
                include: {
                  user: {
                    include: {
                      workoutSessions: {
                        where: { status: 'COMPLETED' },
                        orderBy: { startTime: 'desc' },
                        take: 30 // Last 30 sessions for analysis
                      }
                    }
                  }
                }
              }
            }
          },
          createdWorkouts: true,
          subscriptions: {
            where: { status: 'ACTIVE' }
          }
        }
      })

      if (!trainer?.trainerProfile) {
        throw new Error('Trainer not found')
      }

      const clients = trainer.trainerProfile.clients
      const activeClients = clients.filter(client => 
        this.isClientActive(client.user.workoutSessions)
      )

      const analytics: TrainerAnalytics = {
        trainerId,
        totalClients: clients.length,
        activeClients: activeClients.length,
        clientRetentionRate: this.calculateClientRetentionRate(clients),
        averageClientProgress: this.calculateAverageClientProgress(clients),
        workoutsCreated: trainer.createdWorkouts.length,
        averageClientRating: await this.calculateTrainerRating(trainerId),
        revenueGenerated: this.calculateTrainerRevenue(trainer.subscriptions),
        responseTime: await this.calculateTrainerResponseTime(trainerId)
      }

      return analytics

    } catch (error) {
      logger.error('Error generating trainer analytics', error, 'ANALYTICS')
      throw error
    }
  }

  /**
   * Generate business metrics dashboard
   */
  async generateBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const totalUsers = await prisma.user.count()
      const activeUsers = await this.countActiveUsers()
      const subscriptions = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' }
      })

      const metrics: BusinessMetrics = {
        totalUsers,
        activeUsers,
        churnRate: await this.calculateChurnRate(),
        monthlyRecurringRevenue: this.calculateMRR(subscriptions),
        averageRevenuePerUser: this.calculateARPU(subscriptions, activeUsers),
        customerLifetimeValue: await this.calculateCLV(),
        conversionRate: await this.calculateConversionRate(),
        dailyActiveUsers: await this.countDailyActiveUsers(),
        workoutCompletionRate: await this.calculateWorkoutCompletionRate(),
        supportTicketResolutionTime: await this.calculateSupportMetrics()
      }

      return metrics

    } catch (error) {
      logger.error('Error generating business metrics', error, 'ANALYTICS')
      throw error
    }
  }

  /**
   * Track user event for analytics
   */
  async trackEvent(
    userId: string,
    eventName: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Store event in analytics database
      // 2. Send to analytics service (Mixpanel, Amplitude, etc.)
      // 3. Update user behavior segments
      
      const event = {
        userId,
        eventName,
        properties: JSON.stringify(properties),
        timestamp: new Date(),
        sessionId: properties.sessionId || null,
        userAgent: properties.userAgent || null,
        ipAddress: properties.ipAddress || null,
      }

      // await prisma.analyticsEvent.create({ data: event })

      logger.debug(`Event tracked: ${eventName}`, { userId, data })

    } catch (error) {
      logger.error('Error tracking event', error, 'ANALYTICS')
    }
  }

  /**
   * Generate engagement funnel analysis
   */
  async generateEngagementFunnel(): Promise<Record<string, number>> {
    try {
      // Define funnel steps
      const funnelSteps = {
        'user_registered': await prisma.user.count(),
        'profile_completed': await prisma.clientProfile.count(),
        'first_workout_started': await this.countUsersWithWorkouts(),
        'first_workout_completed': await this.countUsersWithCompletedWorkouts(),
        'weekly_active': await this.countWeeklyActiveUsers(),
        'subscription_converted': await prisma.subscription.count({
          where: { 
            status: 'ACTIVE',
            planType: { not: 'FREE' }
          }
        })
      }

      return funnelSteps

    } catch (error) {
      logger.error('Error generating engagement funnel', error, 'ANALYTICS')
      return {}
    }
  }

  /**
   * Generate cohort retention analysis
   */
  async generateCohortRetention(
    cohortPeriod: 'week' | 'month' = 'month'
  ): Promise<Record<string, any>> {
    try {
      const cohorts: Record<string, any> = {}
      
      // This would be a complex query to analyze user retention by registration cohort
      // For now, return sample structure
      
      return {
        cohort_2025_01: {
          size: 150,
          retention: {
            week_1: 0.85,
            week_2: 0.72,
            week_4: 0.58,
            week_8: 0.45,
            week_12: 0.38
          }
        },
        cohort_2025_02: {
          size: 200,
          retention: {
            week_1: 0.88,
            week_2: 0.75,
            week_4: 0.62,
            week_8: 0.48
          }
        }
      }

    } catch (error) {
      logger.error('Error generating cohort retention', error, 'ANALYTICS')
      return {}
    }
  }

  // Private helper methods

  private calculateTotalWorkoutTime(sessions: any[]): number {
    return sessions.reduce((total, session) => {
      return total + (session.duration || 0)
    }, 0) / 60 // Convert to minutes
  }

  private calculateAverageWorkoutDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0
    const totalTime = this.calculateTotalWorkoutTime(sessions)
    return Math.round(totalTime / sessions.length)
  }

  private calculateFavoriteCategory(sessions: any[]): string {
    const categories: Record<string, number> = {}
    
    sessions.forEach(session => {
      const category = session.workout?.category || 'UNKNOWN'
      categories[category] = (categories[category] || 0) + 1
    })

    return Object.entries(categories).reduce((a, b) => 
      categories[a[0]] > categories[b[0]] ? a : b
    )?.[0] || 'STRENGTH'
  }

  private async calculateLongestStreak(userId: string): Promise<number> {
    // Complex calculation of consecutive workout days
    // For now, return sample value
    return 15
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    // Calculate current consecutive workout days
    const sessions = await prisma.workoutSession.findMany({
      where: { 
        userId,
        status: 'COMPLETED'
      },
      orderBy: { startTime: 'desc' },
      take: 30
    })

    let streak = 0
    let lastWorkoutDate: Date | null = null

    for (const session of sessions) {
      const sessionDate = new Date(session.startTime)
      sessionDate.setHours(0, 0, 0, 0)

      if (!lastWorkoutDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 1) {
          streak = 1
          lastWorkoutDate = sessionDate
        } else {
          break
        }
      } else {
        const daysDiff = Math.floor((lastWorkoutDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 1) {
          streak++
          lastWorkoutDate = sessionDate
        } else if (daysDiff === 0) {
          // Same day, continue
          continue
        } else {
          break
        }
      }
    }

    return streak
  }

  private calculateTotalCalories(sessions: any[]): number {
    return sessions.reduce((total, session) => {
      return total + (session.caloriesBurned || 0)
    }, 0)
  }

  private async calculateStrengthProgression(userId: string): Promise<number> {
    // Analyze strength progression across exercises
    // Return score from 0-100
    return 75
  }

  private calculateConsistencyScore(sessions: any[]): number {
    if (sessions.length === 0) return 0
    
    // Calculate based on workout frequency and regularity
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    
    const recentSessions = sessions.filter(session => 
      new Date(session.startTime) >= last30Days
    )
    
    const frequency = recentSessions.length / 4.3 // Approximate weeks in 30 days
    const idealFrequency = 3 // 3 workouts per week
    
    const consistencyScore = Math.min(100, (frequency / idealFrequency) * 100)
    return Math.round(consistencyScore)
  }

  private determineEngagementLevel(sessions: any[]): 'low' | 'medium' | 'high' {
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    const recentSessions = sessions.filter(session => 
      new Date(session.startTime) >= last7Days
    ).length

    if (recentSessions >= 3) return 'high'
    if (recentSessions >= 1) return 'medium'
    return 'low'
  }

  private calculateAverageRating(sessions: any[]): number {
    const ratedSessions = sessions.filter(s => s.rating && s.rating > 0)
    if (ratedSessions.length === 0) return 0
    
    const totalRating = ratedSessions.reduce((sum, session) => sum + session.rating, 0)
    return Math.round((totalRating / ratedSessions.length) * 10) / 10
  }

  private calculateAverageDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0
    
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    return Math.round(totalDuration / sessions.length / 60) // Convert to minutes
  }

  private calculatePopularityScore(sessions: any[]): number {
    // Score based on number of sessions and recency
    const now = Date.now()
    const score = sessions.reduce((acc, session) => {
      const daysOld = (now - new Date(session.startTime).getTime()) / (1000 * 60 * 60 * 24)
      const recencyWeight = Math.max(0, 1 - (daysOld / 365)) // Weight decreases over a year
      return acc + recencyWeight
    }, 0)
    
    return Math.min(100, Math.round(score * 2))
  }

  private calculateDifficultyRating(sessions: any[]): number {
    // Calculate perceived difficulty based on user ratings and completion data
    const avgRating = this.calculateAverageRating(sessions)
    const completionRate = sessions.length > 0 ? (sessions.filter(s => s.status === 'COMPLETED').length / sessions.length) * 100 : 0
    
    // Lower completion rate and rating might indicate higher difficulty
    const difficultyScore = Math.max(1, Math.min(10, 11 - ((completionRate / 10) + avgRating)))
    
    return Math.round(difficultyScore * 10) / 10
  }

  private async calculateWorkoutRetentionRate(workoutId: string): Promise<number> {
    // Calculate how many users return to do this workout again
    const uniqueUsers = await prisma.workoutSession.groupBy({
      by: ['userId'],
      where: { workoutId },
      _count: { userId: true }
    })

    const repeatUsers = uniqueUsers.filter(user => user._count.userId > 1).length
    const totalUsers = uniqueUsers.length

    return totalUsers > 0 ? Math.round((repeatUsers / totalUsers) * 100) : 0
  }

  private isClientActive(sessions: any[]): boolean {
    if (sessions.length === 0) return false
    
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    
    return sessions.some(session => new Date(session.startTime) >= last30Days)
  }

  private calculateClientRetentionRate(clients: any[]): number {
    if (clients.length === 0) return 0
    
    const activeClients = clients.filter(client => 
      this.isClientActive(client.user.workoutSessions)
    ).length
    
    return Math.round((activeClients / clients.length) * 100)
  }

  private calculateAverageClientProgress(clients: any[]): number {
    // Calculate average progress score across all clients
    // This would involve complex calculations of client improvements
    return 78 // Sample value
  }

  private async calculateTrainerRating(trainerId: string): Promise<number> {
    // Calculate average rating based on client feedback
    // This would require a trainer rating system in the database
    return 4.5
  }

  private calculateTrainerRevenue(subscriptions: any[]): number {
    // Calculate revenue generated by trainer's clients
    const trainerPlans = subscriptions.filter(sub => 
      sub.planType === 'TRAINER' || sub.planType === 'PRO'
    )
    
    // This would involve actual pricing calculations
    return trainerPlans.length * 49.99 // Sample calculation
  }

  private async calculateTrainerResponseTime(trainerId: string): Promise<number> {
    // Calculate average response time to client messages
    // This would require a messaging system in the database
    return 2.5 // Sample value in hours
  }

  private async countActiveUsers(): Promise<number> {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    
    return await prisma.user.count({
      where: {
        workoutSessions: {
          some: {
            startTime: { gte: last30Days }
          }
        }
      }
    })
  }

  private async calculateChurnRate(): Promise<number> {
    // Calculate monthly churn rate
    // This would involve complex subscription analysis
    return 5.2 // Sample percentage
  }

  private calculateMRR(subscriptions: any[]): number {
    // Calculate Monthly Recurring Revenue
    const paidPlans = subscriptions.filter(sub => sub.planType !== 'FREE')
    
    // This would use actual pricing data
    const pricing = {
      'BASIC': 9.99,
      'PRO': 19.99,
      'TRAINER': 49.99,
      'ENTERPRISE': 99.99
    }
    
    return paidPlans.reduce((mrr, sub) => {
      return mrr + (pricing[sub.planType as keyof typeof pricing] || 0)
    }, 0)
  }

  private calculateARPU(subscriptions: any[], totalUsers: number): number {
    if (totalUsers === 0) return 0
    const mrr = this.calculateMRR(subscriptions)
    return Math.round((mrr / totalUsers) * 100) / 100
  }

  private async calculateCLV(): Promise<number> {
    // Calculate Customer Lifetime Value
    // Complex calculation involving churn rate, ARPU, etc.
    return 180 // Sample value
  }

  private async calculateConversionRate(): Promise<number> {
    const totalUsers = await prisma.user.count()
    const paidUsers = await prisma.subscription.count({
      where: { 
        status: 'ACTIVE',
        planType: { not: 'FREE' }
      }
    })
    
    return totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100 * 100) / 100 : 0
  }

  private async countDailyActiveUsers(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return await prisma.user.count({
      where: {
        workoutSessions: {
          some: {
            startTime: {
              gte: today,
              lt: tomorrow
            }
          }
        }
      }
    })
  }

  private async calculateWorkoutCompletionRate(): Promise<number> {
    const totalSessions = await prisma.workoutSession.count()
    const completedSessions = await prisma.workoutSession.count({
      where: { status: 'COMPLETED' }
    })
    
    return totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100 * 100) / 100 : 0
  }

  private async calculateSupportMetrics(): Promise<number> {
    // Calculate average support ticket resolution time
    // This would require a support ticket system
    return 24 // Sample value in hours
  }

  private async countUsersWithWorkouts(): Promise<number> {
    return await prisma.user.count({
      where: {
        workoutSessions: {
          some: {}
        }
      }
    })
  }

  private async countUsersWithCompletedWorkouts(): Promise<number> {
    return await prisma.user.count({
      where: {
        workoutSessions: {
          some: {
            status: 'COMPLETED'
          }
        }
      }
    })
  }

  private async countWeeklyActiveUsers(): Promise<number> {
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    return await prisma.user.count({
      where: {
        workoutSessions: {
          some: {
            startTime: { gte: last7Days }
          }
        }
      }
    })
  }
}