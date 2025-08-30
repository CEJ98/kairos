import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { logger } from '@/lib/logger'
/**
 * Cron job para limpieza automática de datos
 * Se ejecuta diariamente a las 2:00 AM UTC
 */
export async function GET(request: NextRequest) {
	// Verificar que la request viene de Vercel Cron
	const authHeader = request.headers.get('authorization')
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401 }
		)
	}
	
	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		
		if (!supabaseUrl || !supabaseServiceKey) {
			return NextResponse.json(
				{ error: 'Supabase configuration missing' },
				{ status: 500 }
			)
		}
		
		const supabase = createClient(supabaseUrl, supabaseServiceKey)
		
		const cleanupTasks = []
		
		// Limpiar sesiones expiradas (más de 30 días)
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
		
		const { data: expiredSessions, error: sessionError } = await supabase
			.from('sessions')
			.delete()
			.lt('expires', thirtyDaysAgo.toISOString())
		
		if (sessionError) {
			logger.error('Error cleaning expired sessions:', sessionError, 'API')
		} else {
			cleanupTasks.push(`Cleaned expired sessions`)
		}
		
		// Limpiar logs antiguos (más de 90 días)
		const ninetyDaysAgo = new Date()
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
		
		const { data: oldLogs, error: logsError } = await supabase
			.from('audit_logs')
			.delete()
			.lt('created_at', ninetyDaysAgo.toISOString())
		
		if (logsError) {
			logger.error('Error cleaning old logs:', logsError, 'API')
		} else {
			cleanupTasks.push(`Cleaned old audit logs`)
		}
		
		// Limpiar archivos temporales (más de 7 días)
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
		
		const { data: tempFiles, error: filesError } = await supabase
			.from('temp_files')
			.delete()
			.lt('created_at', sevenDaysAgo.toISOString())
		
		if (filesError) {
			logger.error('Error cleaning temp files:', filesError, 'API')
		} else {
			cleanupTasks.push(`Cleaned temporary files`)
		}
		
		logger.debug('Cleanup completed:', cleanupTasks, 'API')
		
		return NextResponse.json({
			success: true,
			message: 'Cleanup completed successfully',
			tasks: cleanupTasks,
			timestamp: new Date().toISOString()
		})
		
	} catch (error) {
		logger.error('Cleanup cron job failed:', error, 'API')
		
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		)
	}
}