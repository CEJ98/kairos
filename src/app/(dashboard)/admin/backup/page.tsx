'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database,
  Download,
  Upload,
  Trash2,
  Calendar,
  HardDrive,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Settings,
  PlayCircle,
  Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BackupInfo {
  filename: string
  size: number
  created: string
  modified: string
  metadata?: {
    version: string
    timestamp: string
    type: 'full' | 'incremental'
    app: string
  }
  tables: string[]
  recordCount: number
  error?: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null)
  
  // Cargar lista de backups
  useEffect(() => {
    loadBackups()
  }, [])
  
  const loadBackups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backup?action=list')
      
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups)
      } else {
        toast.error('Error cargando backups')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }
  
  // Crear nuevo backup
  const createBackup = async (type: 'full' | 'incremental' = 'full') => {
    try {
      setCreating(true)
      
      const requestBody: any = { type }
      
      if (type === 'incremental') {
        // Backup incremental desde hace 24 horas
        const since = new Date()
        since.setHours(since.getHours() - 24)
        requestBody.since = since.toISOString()
      }
      
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Backup ${type} creado exitosamente`)
        await loadBackups()
      } else {
        toast.error(data.error || 'Error creando backup')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setCreating(false)
    }
  }
  
  // Restaurar backup
  const restoreBackup = async (filename: string, options: {
    dryRun?: boolean
    dropExisting?: boolean
  } = {}) => {
    if (!options.dryRun && !confirm('¿Estás seguro de restaurar este backup? Esta acción no se puede deshacer.')) {
      return
    }
    
    try {
      setRestoring(filename)
      
      const response = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename,
          ...options
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Error en la restauración')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setRestoring(null)
    }
  }
  
  // Eliminar backup
  const deleteBackup = async (filename: string) => {
    if (!confirm(`¿Eliminar el backup ${filename}?`)) return
    
    try {
      const response = await fetch(`/api/admin/backup?filename=${filename}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Backup eliminado')
        await loadBackups()
      } else {
        toast.error('Error eliminando backup')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }
  
  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Backups</h1>
          <p className="text-gray-600 mt-1">
            Administra copias de seguridad y restauración de datos
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => loadBackups()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => createBackup('incremental')}
            disabled={creating}
          >
            <Database className="h-4 w-4 mr-2" />
            Backup Incremental
          </Button>
          
          <Button
            variant="gradient"
            onClick={() => createBackup('full')}
            disabled={creating}
          >
            <Download className={`h-4 w-4 mr-2 ${creating ? 'animate-spin' : ''}`} />
            {creating ? 'Creando...' : 'Backup Completo'}
          </Button>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {backups.length}
            </div>
            <p className="text-sm text-gray-600">Backups Disponibles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <HardDrive className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatFileSize(backups.reduce((acc, backup) => acc + (backup.size || 0), 0))}
            </div>
            <p className="text-sm text-gray-600">Tamaño Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {backups.length > 0 ? formatDate(backups[0].created).split(' ')[0] : '-'}
            </div>
            <p className="text-sm text-gray-600">Último Backup</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {backups.filter(b => !b.error).length}
            </div>
            <p className="text-sm text-gray-600">Backups Válidos</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Disponibles</CardTitle>
          <CardDescription>
            Gestiona las copias de seguridad de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Cargando backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay backups disponibles
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primer backup para comenzar
              </p>
              <Button variant="gradient" onClick={() => createBackup('full')}>
                <Download className="h-5 w-5 mr-2" />
                Crear Primer Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.filename}
                  className={`border rounded-lg p-4 ${
                    backup.error ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{backup.filename}</h3>
                        
                        {backup.metadata && (
                          <Badge 
                            variant={backup.metadata.type === 'full' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {backup.metadata.type === 'full' ? 'Completo' : 'Incremental'}
                          </Badge>
                        )}
                        
                        {backup.error && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                      
                      {backup.error ? (
                        <p className="text-red-600 text-sm">{backup.error}</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(backup.created)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            <span>{formatFileSize(backup.size)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            <span>{backup.tables.length} tablas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>{backup.recordCount.toLocaleString()} registros</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBackup(backup)}
                        disabled={!!backup.error}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreBackup(backup.filename, { dryRun: true })}
                        disabled={restoring === backup.filename || !!backup.error}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.filename)}
                        disabled={restoring === backup.filename || !!backup.error}
                      >
                        {restoring === backup.filename ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBackup(backup.filename)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de información detallada */}
      {selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Información del Backup</CardTitle>
              <CardDescription>{selectedBackup.filename}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedBackup.metadata && (
                  <div>
                    <h4 className="font-semibold mb-2">Metadatos</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Versión:</span>
                        <span className="ml-2">{selectedBackup.metadata.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <span className="ml-2">{selectedBackup.metadata.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Aplicación:</span>
                        <span className="ml-2">{selectedBackup.metadata.app}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Timestamp:</span>
                        <span className="ml-2">{formatDate(selectedBackup.metadata.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2">Estadísticas</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tamaño:</span>
                      <span className="ml-2">{formatFileSize(selectedBackup.size)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Registros:</span>
                      <span className="ml-2">{selectedBackup.recordCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Creado:</span>
                      <span className="ml-2">{formatDate(selectedBackup.created)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Modificado:</span>
                      <span className="ml-2">{formatDate(selectedBackup.modified)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Tablas Incluidas ({selectedBackup.tables.length})</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {selectedBackup.tables.map((table) => (
                      <Badge key={table} variant="outline" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBackup(null)}
                >
                  Cerrar
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => {
                    restoreBackup(selectedBackup.filename)
                    setSelectedBackup(null)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}