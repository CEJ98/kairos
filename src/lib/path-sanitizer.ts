/**
 * Path Sanitization Utilities for Kairos Fitness
 * Prevents directory traversal attacks and ensures safe file operations
 */

import path from 'path'
import { logger } from './logger'

/**
 * Sanitize filename to prevent directory traversal and invalid characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename provided')
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove Windows invalid characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .trim()

  // Ensure filename is not empty after sanitization
  if (!sanitized) {
    throw new Error('Filename becomes empty after sanitization')
  }

  // Check for reserved Windows filenames
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ]

  const nameWithoutExtension = path.parse(sanitized).name.toUpperCase()
  if (reservedNames.includes(nameWithoutExtension)) {
    throw new Error('Filename uses reserved name')
  }

  return sanitized
}

/**
 * Validate and sanitize a directory path
 */
export function sanitizeDirectoryPath(dirPath: string): string {
  if (!dirPath || typeof dirPath !== 'string') {
    throw new Error('Invalid directory path provided')
  }

  // Resolve and normalize the path
  const resolved = path.resolve(dirPath)
  const normalized = path.normalize(resolved)

  // Ensure the path doesn't contain any traversal attempts
  if (normalized.includes('..')) {
    throw new Error('Directory traversal detected in path')
  }

  return normalized
}

/**
 * Create a safe file path by joining a base directory with a sanitized filename
 */
export function createSafeFilePath(baseDir: string, filename: string): string {
  const sanitizedFilename = sanitizeFilename(filename)
  const sanitizedBaseDir = sanitizeDirectoryPath(baseDir)
  
  const fullPath = path.join(sanitizedBaseDir, sanitizedFilename)
  
  // Ensure the resulting path is still within the base directory
  const resolvedPath = path.resolve(fullPath)
  const resolvedBaseDir = path.resolve(sanitizedBaseDir)
  
  if (!resolvedPath.startsWith(resolvedBaseDir + path.sep) && resolvedPath !== resolvedBaseDir) {
    throw new Error('Path traversal attempt detected')
  }
  
  return fullPath
}

/**
 * Validate that a path is within allowed directories
 */
export function validatePathWithinAllowedDirs(
  filePath: string, 
  allowedDirs: string[]
): boolean {
  const resolvedPath = path.resolve(filePath)
  
  return allowedDirs.some(dir => {
    const resolvedAllowedDir = path.resolve(dir)
    return resolvedPath.startsWith(resolvedAllowedDir + path.sep) || 
           resolvedPath === resolvedAllowedDir
  })
}

/**
 * Backup-specific filename validation
 */
export function validateBackupFilename(filename: string): {
  isValid: boolean
  sanitizedFilename?: string
  error?: string
} {
  try {
    // Check if filename matches expected backup pattern
    const backupPattern = /^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/
    
    if (!backupPattern.test(filename)) {
      return {
        isValid: false,
        error: 'Invalid backup filename format. Expected: backup_YYYY-MM-DD_HH-MM-SS.sql'
      }
    }

    const sanitizedFilename = sanitizeFilename(filename)
    
    return {
      isValid: true,
      sanitizedFilename
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    }
  }
}

/**
 * File extension whitelist validation
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = path.extname(filename).toLowerCase()
  return allowedExtensions.includes(extension)
}

/**
 * Get safe backup directory path
 */
export function getSafeBackupDirectory(): string {
  const backupDir = process.env.BACKUP_DIR || './backups'
  
  try {
    return sanitizeDirectoryPath(backupDir)
  } catch (error) {
    // Fallback to a safe default
    return path.resolve(process.cwd(), 'backups')
  }
}

/**
 * Security audit log for file operations
 */
export function logFileOperation(
  operation: 'read' | 'write' | 'delete',
  filepath: string,
  userId: string,
  success: boolean,
  error?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    filepath: path.basename(filepath), // Only log filename, not full path
    userId,
    success,
    error,
    ip: process.env.REQUEST_IP || 'unknown'
  }
  
  // In production, send to proper logging service
  logger.info('File operation', logEntry, 'FILE_SYSTEM')
}