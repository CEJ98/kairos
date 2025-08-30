import { prisma } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'
import { createWriteStream, createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import { createGzip, createGunzip } from 'zlib'

import { logger } from './logger'
// Configuración de backup
const BACKUP_CONFIG = {
  // Directorio base para backups
  backupDir: process.env.BACKUP_DIR || './backups',
  
  // Retención de backups (días)
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  
  // Compresión
  compression: true,
  
  // Configuración de AWS S3 (opcional)
  s3Config: {
    bucket: process.env.AWS_BACKUP_BUCKET,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  // Configuración de notificaciones
  notifications: {
    email: process.env.BACKUP_NOTIFICATION_EMAIL,
    webhook: process.env.BACKUP_NOTIFICATION_WEBHOOK
  }
}

// Interfaz para resultados de backup
interface BackupResult {
  success: boolean
  filename: string
  size: number
  duration: number
  error?: string
  tables: string[]
  recordCount: number
}

// Clase principal para gestión de backups
export class BackupManager {
  private static instance: BackupManager
  
  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager()
    }
    return BackupManager.instance
  }
  
  // Crear backup completo de la base de datos
  async createFullBackup(): Promise<BackupResult> {
    const startTime = Date.now()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `kairos-backup-${timestamp}.json${BACKUP_CONFIG.compression ? '.gz' : ''}`
    const filepath = path.join(BACKUP_CONFIG.backupDir, filename)
    
    try {
      logger.debug('Iniciando backup completo...', 'BACKUP')
      
      // Asegurar que el directorio existe
      await this.ensureBackupDirectory()
      
      // Recopilar datos de todas las tablas
      const backupData = await this.gatherAllData()
      
      // Escribir datos al archivo
      await this.writeBackupFile(filepath, backupData)
      
      // Obtener estadísticas del archivo
      const stats = await fs.stat(filepath)
      const duration = Date.now() - startTime
      
      const result: BackupResult = {
        success: true,
        filename,
        size: stats.size,
        duration,
        tables: Object.keys(backupData.tables),
        recordCount: this.countRecords(backupData)
      }
      
      logger.debug('Backup completo exitoso: ${filename} (${this.formatFileSize(stats.size)})', 'BACKUP')
      
      // Subir a S3 si está configurado
      if (BACKUP_CONFIG.s3Config.bucket) {
        await this.uploadToS3(filepath, filename)
      }
      
      // Limpiar backups antiguos
      await this.cleanOldBackups()
      
      // Notificar éxito
      await this.sendNotification('success', result)
      
      return result
      
    } catch (error) {
      logger.error('Error creando backup:', error, 'BACKUP')
      
      const duration = Date.now() - startTime
      const result: BackupResult = {
        success: false,
        filename,
        size: 0,
        duration,
        error: error instanceof Error ? error.message : 'Error desconocido',
        tables: [],
        recordCount: 0
      }
      
      // Notificar error
      await this.sendNotification('error', result)
      
      return result
    }
  }
  
  // Crear backup incremental (solo cambios)
  async createIncrementalBackup(lastBackupDate: Date): Promise<BackupResult> {
    const startTime = Date.now()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `kairos-incremental-${timestamp}.json${BACKUP_CONFIG.compression ? '.gz' : ''}`
    const filepath = path.join(BACKUP_CONFIG.backupDir, filename)
    
    try {
      logger.debug('Iniciando backup incremental...', 'BACKUP')
      
      await this.ensureBackupDirectory()
      
      // Recopilar solo datos modificados
      const backupData = await this.gatherIncrementalData(lastBackupDate)
      
      if (this.countRecords(backupData) === 0) {
        logger.debug('No hay cambios desde el último backup', 'BACKUP')
        return {
          success: true,
          filename: '',
          size: 0,
          duration: Date.now() - startTime,
          tables: [],
          recordCount: 0
        }
      }
      
      await this.writeBackupFile(filepath, backupData)
      
      const stats = await fs.stat(filepath)
      const duration = Date.now() - startTime
      
      const result: BackupResult = {
        success: true,
        filename,
        size: stats.size,
        duration,
        tables: Object.keys(backupData.tables),
        recordCount: this.countRecords(backupData)
      }
      
      logger.debug('Backup incremental exitoso: ${filename}', 'BACKUP')
      
      return result
      
    } catch (error) {
      logger.error('Error creando backup incremental:', error, 'BACKUP')
      
      return {
        success: false,
        filename,
        size: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Error desconocido',
        tables: [],
        recordCount: 0
      }
    }
  }
  
  // Restaurar desde backup
  async restoreFromBackup(filename: string, options: {
    dropExisting?: boolean
    tables?: string[]
    dryRun?: boolean
  } = {}): Promise<{ success: boolean; error?: string; restored: number }> {
    const filepath = path.join(BACKUP_CONFIG.backupDir, filename)
    
    try {
      logger.debug('Iniciando restauración desde: ${filename}', 'BACKUP')
      
      // Verificar que el archivo existe
      await fs.access(filepath)
      
      // Leer datos del backup
      const backupData = await this.readBackupFile(filepath)
      
      if (options.dryRun) {
        logger.debug('Dry run - no se realizarán cambios', 'BACKUP')
        return {
          success: true,
          restored: this.countRecords(backupData)
        }
      }
      
      // Comenzar transacción
      let restoredCount = 0
      
      await prisma.$transaction(async (tx) => {
        // Si se especifica, eliminar datos existentes
        if (options.dropExisting) {
          await this.truncateTables(tx, options.tables)
        }
        
        // Restaurar datos tabla por tabla
        for (const [tableName, records] of Object.entries(backupData.tables)) {
          if (options.tables && !options.tables.includes(tableName)) {
            continue
          }
          
          if (Array.isArray(records) && records.length > 0) {
            await this.restoreTableData(tx, tableName, records)
            restoredCount += records.length
          }
        }
      })
      
      logger.debug('Restauración exitosa: ${restoredCount} registros', 'BACKUP')
      
      return {
        success: true,
        restored: restoredCount
      }
      
    } catch (error) {
      logger.error('Error en restauración:', error, 'BACKUP')
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        restored: 0
      }
    }
  }
  
  // Recopilar todos los datos
  private async gatherAllData() {
    const metadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      type: 'full',
      app: 'kairos-fitness'
    }
    
    const tables = {
      // Usuarios y autenticación
      users: await prisma.user.findMany(),
      // accounts: await prisma.account.findMany(),
      // sessions: await prisma.session.findMany(),
      
      // Ejercicios y entrenamientos
      exercises: await prisma.exercise.findMany(),
      workouts: await prisma.workout.findMany(),
      workoutExercises: await prisma.workoutExercise.findMany(),
      workoutSessions: await prisma.workoutSession.findMany(),
      // exerciseSets: await prisma.exerciseSet.findMany(),
      
      // Progreso y mediciones
      // progressRecords: await prisma.progressRecord.findMany(),
      bodyMeasurements: await prisma.bodyMeasurement.findMany(),
      // weightRecords: await prisma.weightRecord.findMany(),
      
      // Nutrición
      // foods: await prisma.food.findMany(),
      // mealPlans: await prisma.mealPlan.findMany(),
      // mealPlanFoods: await prisma.mealPlanFood.findMany(),
      // nutritionLogs: await prisma.nutritionLog.findMany(),
      
      // Social y comunidad
      // socialPosts: await prisma.socialPost.findMany(),
      // socialLikes: await prisma.socialLike.findMany(),
      // socialComments: await prisma.socialComment.findMany(),
      // userFollows: await prisma.userFollow.findMany(),
      
      // Suscripciones y pagos
      subscriptions: await prisma.subscription.findMany(),
      
      // Notificaciones
      // notifications: await prisma.notification.findMany(),
      
      // Entrenadores y clientes
      // trainerClients: await prisma.trainerClient.findMany(),
      // trainingSessions: await prisma.trainingSession.findMany()
    }
    
    return { metadata, tables }
  }
  
  // Recopilar datos incrementales
  private async gatherIncrementalData(since: Date) {
    const metadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      type: 'incremental',
      since: since.toISOString(),
      app: 'kairos-fitness'
    }
    
    const tables = {
      users: await prisma.user.findMany({
        where: { updatedAt: { gte: since } }
      }),
      workouts: await prisma.workout.findMany({
        where: { updatedAt: { gte: since } }
      }),
      workoutSessions: await prisma.workoutSession.findMany({
        where: { startTime: { gte: since } }
      }),
      // progressRecords: await prisma.progressRecord.findMany({
      //   where: { createdAt: { gte: since } }
      // }),
      bodyMeasurements: await prisma.bodyMeasurement.findMany({
        where: { measuredAt: { gte: since } }
      }),
      // socialPosts: await prisma.socialPost.findMany({
      //   where: { createdAt: { gte: since } }
      // }),
      // notifications: await prisma.notification.findMany({
      //   where: { createdAt: { gte: since } }
      // })
    }
    
    return { metadata, tables }
  }
  
  // Escribir archivo de backup
  private async writeBackupFile(filepath: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2)
    
    if (BACKUP_CONFIG.compression) {
      // Comprimir con gzip
      const writeStream = createWriteStream(filepath)
      const gzipStream = createGzip({ level: 9 })
      
      await pipeline(
        async function* () {
          yield jsonData
        },
        gzipStream,
        writeStream
      )
    } else {
      // Escribir sin comprimir
      await fs.writeFile(filepath, jsonData, 'utf8')
    }
  }
  
  // Leer archivo de backup
  private async readBackupFile(filepath: string): Promise<any> {
    if (BACKUP_CONFIG.compression && filepath.endsWith('.gz')) {
      // Leer archivo comprimido
      const readStream = createReadStream(filepath)
      const gunzipStream = createGunzip()
      
      let data = ''
      
      await pipeline(
        readStream,
        gunzipStream,
        async function* (source) {
          for await (const chunk of source) {
            data += chunk.toString()
          }
        }
      )
      
      return JSON.parse(data)
    } else {
      // Leer archivo sin comprimir
      const data = await fs.readFile(filepath, 'utf8')
      return JSON.parse(data)
    }
  }
  
  // Restaurar datos de tabla específica
  private async restoreTableData(tx: any, tableName: string, records: any[]): Promise<void> {
    // Mapeo de nombres de tabla a modelos de Prisma
    const tableMap: Record<string, any> = {
      users: tx.user,
      exercises: tx.exercise,
      workouts: tx.workout,
      workoutSessions: tx.workoutSession,
      // ... mapear todas las tablas
    }
    
    const model = tableMap[tableName]
    if (!model) {
      logger.warn('Tabla no reconocida: ${tableName}', 'BACKUP')
      return
    }
    
    // Insertar registros en lotes
    const batchSize = 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      await model.createMany({
        data: batch,
        skipDuplicates: true
      })
    }
  }
  
  // Limpiar backups antiguos
  private async cleanOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(BACKUP_CONFIG.backupDir)
      const backupFiles = files.filter(file => file.startsWith('kairos-backup-'))
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays)
      
      for (const file of backupFiles) {
        const filepath = path.join(BACKUP_CONFIG.backupDir, file)
        const stats = await fs.stat(filepath)
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath)
          logger.debug('Backup antiguo eliminado: ${file}', 'BACKUP')
        }
      }
    } catch (error) {
      logger.error('Error limpiando backups antiguos:', error, 'BACKUP')
    }
  }
  
  // Subir a AWS S3
  private async uploadToS3(filepath: string, filename: string): Promise<void> {
    // Implementar upload a S3
    logger.debug('TODO: Subir ${filename} a S3', 'BACKUP')
  }
  
  // Enviar notificaciones
  private async sendNotification(type: 'success' | 'error', result: BackupResult): Promise<void> {
    const message = type === 'success' 
      ? `Backup exitoso: ${result.filename} (${this.formatFileSize(result.size)})`
      : `Error en backup: ${result.error}`
    
    logger.debug('Notificación: ${message}', 'BACKUP')
    
    // Implementar envío de email/webhook si está configurado
  }
  
  // Utilitarias
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(BACKUP_CONFIG.backupDir)
    } catch {
      await fs.mkdir(BACKUP_CONFIG.backupDir, { recursive: true })
    }
  }
  
  private countRecords(backupData: any): number {
    let count = 0
    for (const records of Object.values(backupData.tables)) {
      if (Array.isArray(records)) {
        count += records.length
      }
    }
    return count
  }
  
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  private async truncateTables(tx: any, tables?: string[]): Promise<void> {
    // Implementar truncate de tablas específicas si es necesario
    logger.debug('TODO: Implementar truncate de tablas', 'BACKUP')
  }
  
  // API pública
  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(BACKUP_CONFIG.backupDir)
      return files.filter(file => file.startsWith('kairos-backup-'))
        .sort((a, b) => b.localeCompare(a)) // Ordenar por fecha descendente
    } catch (error) {
      logger.error('Error listando backups:', error, 'BACKUP')
      return []
    }
  }
  
  async getBackupInfo(filename: string): Promise<any> {
    const filepath = path.join(BACKUP_CONFIG.backupDir, filename)
    
    try {
      const stats = await fs.stat(filepath)
      const data = await this.readBackupFile(filepath)
      
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        metadata: data.metadata,
        tables: Object.keys(data.tables),
        recordCount: this.countRecords(data)
      }
    } catch (error) {
      throw new Error(`Error leyendo backup: ${error}`)
    }
  }
}

// Scheduler para backups automáticos
export class BackupScheduler {
  private intervals: NodeJS.Timeout[] = []
  private backupManager = BackupManager.getInstance()
  
  // Programar backups automáticos
  startSchedule(config: {
    fullBackupInterval: number // en horas
    incrementalInterval: number // en horas
  }) {
    // Backup completo
    const fullInterval = setInterval(() => {
      this.backupManager.createFullBackup()
        .catch(error => logger.error('Error en backup programado:', error, 'BACKUP'))
    }, config.fullBackupInterval * 60 * 60 * 1000)
    
    // Backup incremental
    const incrementalInterval = setInterval(() => {
      const lastBackup = new Date()
      lastBackup.setHours(lastBackup.getHours() - config.incrementalInterval)
      
      this.backupManager.createIncrementalBackup(lastBackup)
        .catch(error => logger.error('Error en backup incremental:', error, 'BACKUP'))
    }, config.incrementalInterval * 60 * 60 * 1000)
    
    this.intervals.push(fullInterval, incrementalInterval)
    
    logger.debug('Backup scheduler iniciado', 'BACKUP')
  }
  
  stopSchedule() {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
    logger.debug('Backup scheduler detenido', 'BACKUP')
  }
}