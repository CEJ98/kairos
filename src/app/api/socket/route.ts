import { NextRequest } from 'next/server'
import { websocketService } from '@/lib/websocket'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Esta ruta maneja la inicialización del WebSocket
    // El servidor WebSocket se inicializa en el middleware o servidor personalizado
    
    const connectedUsers = websocketService.getConnectedUsers()
    
    return new Response(JSON.stringify({
      status: 'WebSocket service active',
      connectedUsers: connectedUsers.length,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    logger.error('WebSocket status error:', error)
    return new Response(JSON.stringify({
      error: 'WebSocket service unavailable'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}