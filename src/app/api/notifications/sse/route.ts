/**
 * Server-Sent Events endpoint for real-time notifications
 * Handles SSE connections and Redis Pub/Sub integration
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getRedisSubscriber } from '@/lib/redis'
import { logger } from '@/lib/logger'

// Notification types
export interface NotificationEvent {
	id: string
	type: 'workout_assigned' | 'progress_updated' | 'achievement' | 'reminder'
	userId: string
	title: string
	message: string
	data?: Record<string, any>
	timestamp: string
	read: boolean
}

// Active SSE connections map
const activeConnections = new Map<string, { controller: ReadableStreamDefaultController; userId: string }>()

/**
 * GET endpoint for SSE subscription
 */
export async function GET(request: NextRequest) {
	try {
		// Authenticate user
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 })
		}

		const userId = session.user.id
		const connectionId = `${userId}-${Date.now()}`

		logger.info(`SSE connection initiated for user: ${userId}`, { connectionId })

		// Create readable stream for SSE
		const stream = new ReadableStream({
			start(controller) {
				// Store connection
				activeConnections.set(connectionId, { controller, userId })

				// Send initial connection message
				const initialMessage = {
					type: 'connection',
					message: 'Connected to notifications stream',
					timestamp: new Date().toISOString()
				}
				controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`)

				// Setup Redis subscriber for this user
				setupRedisSubscription(userId, controller, connectionId)

				// Send keep-alive ping every 30 seconds
				const keepAliveInterval = setInterval(() => {
					try {
						controller.enqueue(`: keep-alive\n\n`)
					} catch (error) {
						// Connection closed, cleanup
						clearInterval(keepAliveInterval)
						activeConnections.delete(connectionId)
						logger.info(`SSE connection closed for user: ${userId}`, { connectionId })
					}
				}, 30000)

				// Store interval for cleanup
				;(controller as any).keepAliveInterval = keepAliveInterval
			},

			cancel() {
				// Cleanup on connection close
				const connection = activeConnections.get(connectionId)
				if (connection) {
					const interval = (connection.controller as any).keepAliveInterval
					if (interval) {
						clearInterval(interval)
					}
					activeConnections.delete(connectionId)
					logger.info(`SSE connection cancelled for user: ${userId}`, { connectionId })
				}
			}
		})

		// Return SSE response
		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Cache-Control'
			}
		})

	} catch (error) {
		logger.error('Error in SSE endpoint:', error)
		return new Response('Internal Server Error', { status: 500 })
	}
}

/**
 * Setup Redis subscription for user notifications
 */
async function setupRedisSubscription(
	userId: string,
	controller: ReadableStreamDefaultController,
	connectionId: string
) {
	try {
		const subscriber = getRedisSubscriber()
		const channel = `notifications:${userId}`

		// Subscribe to user-specific channel
		await subscriber.subscribe(channel)
		logger.info(`Subscribed to Redis channel: ${channel}`, { connectionId })

		// Handle incoming messages
		subscriber.on('message', (receivedChannel: string, message: string) => {
			if (receivedChannel === channel) {
				try {
					const notification: NotificationEvent = JSON.parse(message)
					
					// Send notification to client
					controller.enqueue(`data: ${JSON.stringify(notification)}\n\n`)
					
					logger.info(`Notification sent to user: ${userId}`, {
						connectionId,
						notificationId: notification.id,
						type: notification.type
					})
				} catch (parseError) {
					logger.error('Error parsing notification message:', parseError)
				}
			}
		})

		// Handle Redis connection errors
		subscriber.on('error', (error) => {
			logger.error('Redis subscriber error:', error)
			// Try to reconnect or handle gracefully
		})

	} catch (error) {
		logger.error('Error setting up Redis subscription:', error)
	}
}

/**
 * Get active connections count (for monitoring)
 */
export function getActiveConnectionsCount(): number {
	return activeConnections.size
}

/**
 * Get connections for specific user
 */
export function getUserConnections(userId: string): string[] {
	return Array.from(activeConnections.entries())
		.filter(([_, connection]) => connection.userId === userId)
		.map(([connectionId]) => connectionId)
}

/**
 * Cleanup inactive connections
 */
export function cleanupInactiveConnections(): void {
	const now = Date.now()
	for (const [connectionId, connection] of activeConnections.entries()) {
		try {
			// Test if connection is still active
			connection.controller.enqueue(`: ping\n\n`)
		} catch (error) {
			// Connection is dead, remove it
			activeConnections.delete(connectionId)
			logger.info(`Cleaned up inactive connection: ${connectionId}`)
		}
	}
}

// Cleanup inactive connections every 5 minutes
setInterval(cleanupInactiveConnections, 5 * 60 * 1000)