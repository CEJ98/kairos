/**
 * Comprehensive Notification System for Kairos Fitness
 * Handles push notifications, emails, SMS, and in-app notifications
 */

import { prisma } from './db'

import { logger } from './logger'
// Types for notification system
export interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  data?: Record<string, any>
  icon?: string
  badge?: string
  image?: string
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export type NotificationType = 
  | 'workout_reminder'
  | 'workout_completed'
  | 'progress_milestone'
  | 'new_workout_assigned'
  | 'trainer_message'
  | 'subscription_expiring'
  | 'achievement_unlocked'
  | 'consistency_streak'
  | 'rest_day_reminder'
  | 'form_feedback'

export interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  workoutReminders: boolean
  progressUpdates: boolean
  trainerMessages: boolean
  achievements: boolean
  weeklyReports: boolean
}

/**
 * Notification Manager Class
 */
export class NotificationManager {
  private static instance: NotificationManager

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's notification settings and push subscription
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          // Add push subscription model to Prisma schema
          // pushSubscriptions: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if user has enabled this type of notification
      const settings = await this.getUserNotificationSettings(userId)
      if (!settings.pushNotifications) {
        logger.debug('Push notifications disabled for user ${userId}')
        return false
      }

      if (!this.shouldSendNotification(payload.type, settings)) {
        logger.debug('Notification type ${payload.type} disabled for user ${userId}')
        return false
      }

      // In a real implementation, you would:
      // 1. Get user's push subscription from database
      // 2. Use Web Push API to send notification
      // 3. Handle retries and failures

      // For now, we'll simulate successful delivery
      await this.logNotification(userId, payload, 'push', true)
      
      logger.debug('Push notification sent to user ${userId}:', payload.title)
      return true

    } catch (error) {
      logger.error('Failed to send push notification:', error)
      await this.logNotification(userId, payload, 'push', false)
      return false
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user?.email) {
        throw new Error('User email not found')
      }

      const settings = await this.getUserNotificationSettings(userId)
      if (!settings.emailNotifications) {
        return false
      }

      if (!this.shouldSendNotification(payload.type, settings)) {
        return false
      }

      // In a real implementation, you would:
      // 1. Use email service (SendGrid, AWS SES, etc.)
      // 2. Apply email templates
      // 3. Handle bounces and unsubscribes

      await this.logNotification(userId, payload, 'email', true)
      
      logger.debug('Email notification sent to ${user.email}:', payload.title)
      return true

    } catch (error) {
      logger.error('Failed to send email notification:', error)
      await this.logNotification(userId, payload, 'email', false)
      return false
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user phone number from profile
      const profile = await prisma.clientProfile.findFirst({
        where: { userId },
        include: { user: true }
      })

      // Note: Phone number would need to be added to the schema
      // const phoneNumber = profile?.phoneNumber

      const settings = await this.getUserNotificationSettings(userId)
      if (!settings.smsNotifications) {
        return false
      }

      // In a real implementation, you would:
      // 1. Use SMS service (Twilio, AWS SNS, etc.)
      // 2. Format message for SMS length limits
      // 3. Handle opt-outs and rate limits

      await this.logNotification(userId, payload, 'sms', true)
      
      logger.debug('SMS notification sent to user ${userId}:', payload.title)
      return true

    } catch (error) {
      logger.error('Failed to send SMS notification:', error)
      await this.logNotification(userId, payload, 'sms', false)
      return false
    }
  }

  /**
   * Create in-app notification
   */
  async createInAppNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Store notification in database for in-app display
      // Note: This would require adding a notifications table to Prisma schema
      
      const notification = {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: JSON.stringify(payload.data || {}),
        read: false,
        createdAt: new Date(),
      }

      // await prisma.notification.create({ data: notification })

      logger.debug('In-app notification created for user ${userId}:', payload.title)
      return true

    } catch (error) {
      logger.error('Failed to create in-app notification:', error)
      return false
    }
  }

  /**
   * Send notification using all enabled channels
   */
  async sendNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<{ push: boolean; email: boolean; sms: boolean; inApp: boolean }> {
    const results = {
      push: false,
      email: false,
      sms: false,
      inApp: false
    }

    // Send in parallel for better performance
    const promises = [
      this.sendPushNotification(userId, payload).then(success => {
        results.push = success
      }),
      this.sendEmailNotification(userId, payload).then(success => {
        results.email = success
      }),
      this.sendSMSNotification(userId, payload).then(success => {
        results.sms = success
      }),
      this.createInAppNotification(userId, payload).then(success => {
        results.inApp = success
      })
    ]

    await Promise.allSettled(promises)
    return results
  }

  /**
   * Schedule a notification for later delivery
   */
  async scheduleNotification(
    userId: string,
    payload: NotificationPayload,
    scheduleTime: Date
  ): Promise<string> {
    try {
      // In a real implementation, you would:
      // 1. Store scheduled notification in database
      // 2. Use job queue (Bull, Agenda, etc.) for delivery
      // 3. Return job ID for cancellation

      const scheduledNotification = {
        id: `scheduled_${Date.now()}_${userId}`,
        userId,
        payload: JSON.stringify(payload),
        scheduleTime,
        status: 'pending',
        createdAt: new Date(),
      }

      // await prisma.scheduledNotification.create({ data: scheduledNotification })

      logger.debug('Notification scheduled for ${scheduleTime}:', payload.title)
      return scheduledNotification.id

    } catch (error) {
      logger.error('Failed to schedule notification:', error)
      throw error
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      // await prisma.scheduledNotification.update({
      //   where: { id: notificationId },
      //   data: { status: 'cancelled' }
      // })

      logger.debug('Scheduled notification cancelled: ${notificationId}')
      return true

    } catch (error) {
      logger.error('Failed to cancel scheduled notification:', error)
      return false
    }
  }

  /**
   * Get user notification settings
   */
  async getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      // In a real implementation, this would come from user preferences in database
      // For now, return default settings
      return {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        workoutReminders: true,
        progressUpdates: true,
        trainerMessages: true,
        achievements: true,
        weeklyReports: true,
      }

    } catch (error) {
      logger.error('Failed to get notification settings:', error)
      // Return conservative defaults
      return {
        pushNotifications: false,
        emailNotifications: false,
        smsNotifications: false,
        workoutReminders: false,
        progressUpdates: false,
        trainerMessages: true, // Always allow important messages
        achievements: false,
        weeklyReports: false,
      }
    }
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<boolean> {
    try {
      // In a real implementation, update user preferences in database
      // await prisma.userNotificationSettings.upsert({
      //   where: { userId },
      //   update: settings,
      //   create: { userId, ...settings }
      // })

      logger.debug('Notification settings updated for user ${userId}')
      return true

    } catch (error) {
      logger.error('Failed to update notification settings:', error)
      return false
    }
  }

  // Predefined notification templates
  
  /**
   * Send workout reminder notification
   */
  async sendWorkoutReminder(
    userId: string,
    workoutName: string,
    scheduledTime: Date
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'workout_reminder',
      title: '🏋️‍♂️ Workout Reminder',
      body: `Time for your ${workoutName} workout!`,
      data: {
        workoutName,
        scheduledTime: scheduledTime.toISOString(),
        action: 'start_workout'
      },
      icon: '/icons/workout-reminder.png',
      actions: [
        {
          action: 'start_now',
          title: 'Start Now',
          icon: '/icons/play.png'
        },
        {
          action: 'snooze',
          title: 'Remind in 15min',
          icon: '/icons/snooze.png'
        }
      ]
    }

    await this.sendNotification(userId, payload)
  }

  /**
   * Send progress milestone notification
   */
  async sendProgressMilestone(
    userId: string,
    milestone: string,
    details: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'progress_milestone',
      title: '🎉 Milestone Achieved!',
      body: `Congratulations! ${milestone}`,
      data: {
        milestone,
        details,
        action: 'view_progress'
      },
      icon: '/icons/achievement.png',
      actions: [
        {
          action: 'view_progress',
          title: 'View Progress',
          icon: '/icons/chart.png'
        },
        {
          action: 'share',
          title: 'Share Achievement',
          icon: '/icons/share.png'
        }
      ]
    }

    await this.sendNotification(userId, payload)
  }

  /**
   * Send trainer message notification
   */
  async sendTrainerMessage(
    userId: string,
    trainerName: string,
    messagePreview: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'trainer_message',
      title: `💬 Message from ${trainerName}`,
      body: messagePreview,
      data: {
        trainerName,
        action: 'view_message'
      },
      icon: '/icons/message.png',
      actions: [
        {
          action: 'view_message',
          title: 'View Message',
          icon: '/icons/open.png'
        },
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply.png'
        }
      ]
    }

    await this.sendNotification(userId, payload)
  }

  /**
   * Send weekly progress report
   */
  async sendWeeklyReport(
    userId: string,
    workoutsCompleted: number,
    totalMinutes: number
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'consistency_streak',
      title: '📊 Your Weekly Report',
      body: `This week: ${workoutsCompleted} workouts, ${totalMinutes} minutes of training!`,
      data: {
        workoutsCompleted,
        totalMinutes,
        action: 'view_report'
      },
      icon: '/icons/report.png',
      actions: [
        {
          action: 'view_report',
          title: 'View Full Report',
          icon: '/icons/chart.png'
        }
      ]
    }

    await this.sendNotification(userId, payload)
  }

  // Private helper methods

  private shouldSendNotification(
    type: NotificationType,
    settings: NotificationSettings
  ): boolean {
    switch (type) {
      case 'workout_reminder':
        return settings.workoutReminders
      case 'progress_milestone':
      case 'achievement_unlocked':
        return settings.achievements
      case 'trainer_message':
      case 'new_workout_assigned':
        return settings.trainerMessages
      case 'workout_completed':
      case 'consistency_streak':
        return settings.progressUpdates
      default:
        return true
    }
  }

  private async logNotification(
    userId: string,
    payload: NotificationPayload,
    channel: 'push' | 'email' | 'sms',
    success: boolean
  ): Promise<void> {
    try {
      // In a real implementation, log to database for analytics
      const log = {
        userId,
        type: payload.type,
        channel,
        success,
        title: payload.title,
        timestamp: new Date(),
      }

      // await prisma.notificationLog.create({ data: log })

    } catch (error) {
      logger.error('Failed to log notification:', error)
    }
  }
}