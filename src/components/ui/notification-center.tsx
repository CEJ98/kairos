/**
 * Advanced Notification Center for Kairos Fitness
 * Real-time notifications with sound, animations, and smart filtering
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Check, Archive, Settings, Filter, Search, Volume2, VolumeX } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Input } from './input'
import { ScrollArea } from './scroll-area'
import { Separator } from './separator'
import { Switch } from './switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Notification types
export interface KairosNotification {
  id: string
  type: 'workout' | 'achievement' | 'reminder' | 'social' | 'system' | 'payment'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  isArchived: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionLabel?: string
  icon?: React.ReactNode
  userId?: string
  metadata?: Record<string, any>
}

// Notification settings
interface NotificationSettings {
  soundEnabled: boolean
  desktopEnabled: boolean
  emailEnabled: boolean
  workoutReminders: boolean
  achievements: boolean
  social: boolean
  system: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

// Mock notification data
const mockNotifications: KairosNotification[] = [
  {
    id: '1',
    type: 'workout',
    title: 'Entrenamiento Programado',
    message: 'Tienes un entrenamiento de piernas programado en 30 minutos',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
    isArchived: false,
    priority: 'medium',
    actionUrl: '/dashboard/workouts/123',
    actionLabel: 'Ver Entrenamiento'
  },
  {
    id: '2',
    type: 'achievement',
    title: '¡Nuevo Record Personal!',
    message: 'Has superado tu record en press de banca: 85kg',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    isArchived: false,
    priority: 'high',
    actionUrl: '/dashboard/progress',
    actionLabel: 'Ver Records'
  },
  {
    id: '3',
    type: 'social',
    title: 'Nuevo Seguidor',
    message: 'María García comenzó a seguirte',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: true,
    isArchived: false,
    priority: 'low'
  },
  {
    id: '4',
    type: 'system',
    title: 'Actualización Disponible',
    message: 'Nueva versión de la app con mejoras de rendimiento',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    isArchived: false,
    priority: 'low'
  }
]

// Notification icons by type
const getNotificationIcon = (type: KairosNotification['type']) => {
  const icons = {
    workout: '🏋️',
    achievement: '🏆',
    reminder: '⏰',
    social: '👥',
    system: '⚙️',
    payment: '💳'
  }
  return icons[type] || '📢'
}

// Priority colors
const getPriorityColor = (priority: KairosNotification['priority']) => {
  const colors = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  }
  return colors[priority]
}

// Individual notification component
function NotificationItem({ 
  notification, 
  onMarkRead, 
  onArchive, 
  onAction 
}: {
  notification: KairosNotification
  onMarkRead: (id: string) => void
  onArchive: (id: string) => void
  onAction: (notification: KairosNotification) => void
}) {
  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `hace ${minutes} min`
    if (hours < 24) return `hace ${hours} h`
    return `hace ${days} días`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "p-4 border-l-4 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer",
        !notification.isRead && "bg-blue-50 dark:bg-blue-950/20 border-l-blue-500",
        notification.priority === 'high' && "border-l-orange-500",
        notification.priority === 'urgent' && "border-l-red-500"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className={cn(
                "font-medium",
                !notification.isRead && "text-gray-900 dark:text-white",
                notification.isRead && "text-gray-600 dark:text-gray-400"
              )}>
                {notification.title}
              </h4>
              <span className="text-xs text-gray-500">
                {formatTime(notification.timestamp)}
              </span>
            </div>
            <p className={cn(
              "text-sm",
              !notification.isRead && "text-gray-700 dark:text-gray-300",
              notification.isRead && "text-gray-500 dark:text-gray-500"
            )}>
              {notification.message}
            </p>
            {notification.actionLabel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(notification)}
                className="mt-2 h-7 px-2 text-xs"
              >
                {notification.actionLabel}
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!notification.isRead && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkRead(notification.id)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onArchive(notification.id)}
            className="h-8 w-8 p-0"
          >
            <Archive className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Main notification center component
export function NotificationCenter() {
  const [notifications, setNotifications] = useState<KairosNotification[]>(mockNotifications)
  const [filteredNotifications, setFilteredNotifications] = useState<KairosNotification[]>(mockNotifications)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    desktopEnabled: true,
    emailEnabled: false,
    workoutReminders: true,
    achievements: true,
    social: true,
    system: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  })

  // Filter notifications based on search and filters
  useEffect(() => {
    let filtered = [...notifications]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType)
    }

    // Status filter
    if (filterStatus === 'unread') {
      filtered = filtered.filter(n => !n.isRead)
    } else if (filterStatus === 'archived') {
      filtered = filtered.filter(n => n.isArchived)
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(n => !n.isArchived)
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, filterType, filterStatus])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }, [])

  // Archive notification
  const archiveNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isArchived: true } : n)
    )
  }, [])

  // Handle notification action
  const handleAction = useCallback((notification: KairosNotification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
    markAsRead(notification.id)
  }, [markAsRead])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }, [])

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length

  // Simulate new notification (for demo)
  const addDemoNotification = useCallback(() => {
    const newNotification: KairosNotification = {
      id: Date.now().toString(),
      type: 'achievement',
      title: '¡Meta Completada!',
      message: 'Has completado tu meta semanal de entrenamientos',
      timestamp: new Date(),
      isRead: false,
      isArchived: false,
      priority: 'high'
    }
    setNotifications(prev => [newNotification, ...prev])
    
    // Play sound if enabled
    if (settings.soundEnabled) {
      // Create notification sound
      const audio = new Audio('/notification-sound.mp3')
      audio.play().catch(() => {}) // Ignore errors if sound file doesn't exist
    }
  }, [settings.soundEnabled])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[400px] p-0" 
        align="end" 
        side="bottom"
        sideOffset={8}
      >
        <Tabs defaultValue="notifications" className="w-full">
          <div className="border-b">
            <TabsList className="grid grid-cols-2 w-full rounded-none h-12">
              <TabsTrigger value="notifications" className="relative">
                Notificaciones
                {unreadCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="mt-0">
            {/* Header */}
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notificaciones</h3>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={markAllAsRead}
                    className="text-xs h-7"
                  >
                    Marcar todas
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addDemoNotification}
                    className="text-xs h-7"
                  >
                    + Demo
                  </Button>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar notificaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="workout">Entrenamientos</SelectItem>
                    <SelectItem value="achievement">Logros</SelectItem>
                    <SelectItem value="social">Sociales</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="unread">No leídas</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="archived">Archivadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
              <AnimatePresence>
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={markAsRead}
                        onArchive={archiveNotification}
                        onAction={handleAction}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Configuración de Notificaciones</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Sonido</label>
                        <p className="text-xs text-gray-500">Reproducir sonido para nuevas notificaciones</p>
                      </div>
                      <Switch
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, soundEnabled: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Notificaciones del navegador</label>
                        <p className="text-xs text-gray-500">Mostrar notificaciones del sistema</p>
                      </div>
                      <Switch
                        checked={settings.desktopEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, desktopEnabled: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3">Tipos de notificación</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Recordatorios de entrenamiento</label>
                          <Switch
                            checked={settings.workoutReminders}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, workoutReminders: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Logros y records</label>
                          <Switch
                            checked={settings.achievements}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, achievements: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Actividad social</label>
                          <Switch
                            checked={settings.social}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, social: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Actualizaciones del sistema</label>
                          <Switch
                            checked={settings.system}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, system: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3">Horario silencioso</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Activar horario silencioso</label>
                          <Switch
                            checked={settings.quietHours.enabled}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ 
                                ...prev, 
                                quietHours: { ...prev.quietHours, enabled: checked }
                              }))
                            }
                          />
                        </div>
                        
                        {settings.quietHours.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">Inicio</label>
                              <Input
                                type="time"
                                value={settings.quietHours.start}
                                onChange={(e) => 
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    quietHours: { ...prev.quietHours, start: e.target.value }
                                  }))
                                }
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Fin</label>
                              <Input
                                type="time"
                                value={settings.quietHours.end}
                                onChange={(e) => 
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    quietHours: { ...prev.quietHours, end: e.target.value }
                                  }))
                                }
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationCenter