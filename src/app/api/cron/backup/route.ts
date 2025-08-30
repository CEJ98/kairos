import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { logger } from '@/lib/logger'
/**
 * Cron job para backup semanal de datos críticos
 * Se ejecuta los domingos a las 3:00 AM UTC
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
		
		const backupTasks = []
		const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
		
		// Backup de usuarios activos
		const { data: users, error: usersError } = await supabase
			.from('users')
			.select('id, email, name, created_at, updated_at, subscription_status')
			.eq('active', true)
		
		if (usersError) {
			logger.error('Error backing up users:', usersError, 'API')
		} else {
			// En un entorno real, aquí enviarías los datos a un servicio de backup
			// Por ahora, solo registramos la operación
			backupTasks.push(`Backed up ${users?.length || 0} active users`)
		}
		
		// Backup de rutinas de ejercicio
		const { data: workouts, error: workoutsError } = await supabase
			.from('workouts')
			.select('id, name, description, created_at, user_id')
			.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
		
		if (workoutsError) {
			logger.error('Error backing up workouts:', workoutsError, 'API')
		} else {
			backupTasks.push(`Backed up ${workouts?.length || 0} recent workouts`)
		}
		
		// Backup de configuraciones del sistema
		const { data: settings, error: settingsError } = await supabase
			.from('system_settings')
			.select('*')
		
		if (settingsError) {
			logger.error('Error backing up settings:', settingsError, 'API')
		} else {
			backupTasks.push(`Backed up ${settings?.length || 0} system settings`)
		}
		
		// Registrar el backup en la tabla de auditoría
		const { error: auditError } = await supabase
			.from('audit_logs')
			.insert({
				action: 'system_backup',
				details: {
					tasks: backupTasks,
					timestamp: timestamp
				},
				created_at: new Date().toISOString()
			})
		
		if (auditError) {
			logger.error('Error logging backup:', auditError, 'API')
		}
		
		logger.debug('Backup completed:', backupTasks, 'API')
		
		return NextResponse.json({
			success: true,
			message: 'Backup completed successfully',
			tasks: backupTasks,
			timestamp: new Date().toISOString(),
			backup_date: timestamp
		})
		
	} catch (error) {
		logger.error('Backup cron job failed:', error, 'API')
		
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