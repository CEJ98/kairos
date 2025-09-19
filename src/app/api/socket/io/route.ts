import { NextRequest } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Extend NextApiResponse to include socket server
interface NextApiResponseServerIO extends Response {
	socket: {
		server: NetServer & {
			io?: SocketIOServer
		}
	}
}

/**
 * Socket.IO Handler for Next.js App Router
 * Maneja la inicialización y configuración de Socket.IO
 */
export async function GET(req: NextRequest) {
	try {
		// En el App Router, Socket.IO se maneja a través del servidor personalizado
		// Este endpoint proporciona información sobre el estado del WebSocket
		
		const session = await getServerSession(authOptions)
		
		return new Response(JSON.stringify({
			status: 'Socket.IO endpoint active',
			path: '/api/socket',
			authenticated: !!session,
			userId: session?.user?.id || null,
			timestamp: new Date().toISOString(),
			message: 'WebSocket connections are handled by the custom server'
		}), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization'
			}
		})
	} catch (error) {
		logger.error('Socket.IO endpoint error:', error)
		return new Response(JSON.stringify({
			error: 'Socket.IO endpoint error',
			message: error instanceof Error ? error.message : 'Unknown error'
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return new Response(JSON.stringify({
				error: 'No autorizado'
			}), {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		const body = await req.json()
		
		return new Response(JSON.stringify({
			status: 'Socket.IO POST received',
			data: body,
			userId: session.user.id
		}), {
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		logger.error('Socket.IO POST error:', error)
		return new Response(JSON.stringify({
			error: 'Socket.IO POST error'
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

export async function OPTIONS(req: NextRequest) {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		}
	})
}