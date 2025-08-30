import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BackupManager } from '@/lib/backup'
import { 
  validateBackupFilename, 
  createSafeFilePath, 
  getSafeBackupDirectory,
  logFileOperation
} from '@/lib/path-sanitizer'
import { logger } from '@/lib/logger'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

// GET /api/admin/backup - Listar backups disponibles
export async function GET(req: NextRequest) {
  // Apply rate limiting for admin operations
  const rateLimitResponse = await withRateLimit(RATE_LIMIT_CONFIGS.api)()
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    
    // Solo administradores pueden acceder
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const filename = searchParams.get('filename')
    
    const backupManager = BackupManager.getInstance()
    
    if (action === 'list') {
      // Listar todos los backups
      const backups = await backupManager.listBackups()
      
      // Obtener información detallada de cada backup
      const backupDetails = await Promise.all(
        backups.map(async (backup) => {
          try {
            return await backupManager.getBackupInfo(backup)
          } catch (error) {
            return {
              filename: backup,
              error: 'No se pudo leer la información'
            }
          }
        })
      )
      
      return NextResponse.json({
        backups: backupDetails,
        count: backups.length
      })
    }
    
    if (action === 'info' && filename) {
      // Validate and sanitize filename
      const validation = validateBackupFilename(filename)
      if (!validation.isValid) {
        logFileOperation('read', filename, session.user.id, false, validation.error)
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // Obtener información de un backup específico
      try {
        const info = await backupManager.getBackupInfo(validation.sanitizedFilename!)
        logFileOperation('read', validation.sanitizedFilename!, session.user.id, true)
        return NextResponse.json(info)
      } catch (error) {
        logFileOperation('read', validation.sanitizedFilename!, session.user.id, false, 'Backup not found')
        return NextResponse.json(
          { error: 'Backup no encontrado o corrupto' },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    
  } catch (error) {
    logger.error('Error en API de backup:', error, 'API')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/backup - Crear nuevo backup
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    
    const body = await req.json()
    const { type, since } = body
    
    const backupManager = BackupManager.getInstance()
    
    let result
    
    if (type === 'incremental' && since) {
      // Backup incremental
      const sinceDate = new Date(since)
      result = await backupManager.createIncrementalBackup(sinceDate)
    } else {
      // Backup completo (por defecto)
      result = await backupManager.createFullBackup()
    }
    
    if (result.success) {
      return NextResponse.json({
        message: 'Backup creado exitosamente',
        backup: result
      }, { status: 201 })
    } else {
      return NextResponse.json({
        error: 'Error creando backup',
        details: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    logger.error('Error creando backup:', error, 'API')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/backup - Restaurar desde backup
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    
    const body = await req.json()
    const { 
      filename, 
      dropExisting = false, 
      tables, 
      dryRun = false 
    } = body
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Nombre de archivo requerido' },
        { status: 400 }
      )
    }
    
    const backupManager = BackupManager.getInstance()
    
    const result = await backupManager.restoreFromBackup(filename, {
      dropExisting,
      tables,
      dryRun
    })
    
    if (result.success) {
      return NextResponse.json({
        message: dryRun 
          ? 'Dry run completado - no se realizaron cambios'
          : 'Restauración completada exitosamente',
        restored: result.restored
      })
    } else {
      return NextResponse.json({
        error: 'Error en la restauración',
        details: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    logger.error('Error en restauración:', error, 'API')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/backup - Eliminar backup
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Nombre de archivo requerido' },
        { status: 400 }
      )
    }
    
    // Validate and sanitize filename
    const validation = validateBackupFilename(filename)
    if (!validation.isValid) {
      logFileOperation('delete', filename, session.user.id, false, validation.error)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Create safe file path
    try {
      const backupDir = getSafeBackupDirectory()
      const safeFilepath = createSafeFilePath(backupDir, validation.sanitizedFilename!)
      
      const fs = require('fs/promises')
      await fs.unlink(safeFilepath)
      
      logFileOperation('delete', validation.sanitizedFilename!, session.user.id, true)
      return NextResponse.json({
        message: 'Backup eliminado exitosamente',
        filename: validation.sanitizedFilename
      })
    } catch (error) {
      logFileOperation('delete', validation.sanitizedFilename!, session.user.id, false, 'File not found or access denied')
      return NextResponse.json(
        { error: 'Backup no encontrado o no se pudo eliminar' },
        { status: 404 }
      )
    }
    
  } catch (error) {
    logger.error('Error eliminando backup:', error, 'API')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}