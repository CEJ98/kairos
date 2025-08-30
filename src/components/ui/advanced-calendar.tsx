/**
 * Advanced Calendar Component for Kairos Fitness
 * Interactive calendar with workout scheduling, progress tracking, and analytics
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, Clock, Target, Trophy, AlertCircle } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Input } from './input'
import { Textarea } from './textarea'
import { Label } from './label'
import { Switch } from './switch'
import { Separator } from './separator'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Event types
export interface CalendarEvent {
  id: string
  title: string
  type: 'workout' | 'rest' | 'assessment' | 'appointment' | 'meal_prep'
  date: Date
  startTime?: string
  endTime?: string
  description?: string
  status: 'planned' | 'completed' | 'missed' | 'rescheduled'
  priority: 'low' | 'medium' | 'high'
  workoutId?: string
  trainerId?: string
  clientId?: string
  category?: string
  duration?: number
  calories?: number
  exercises?: number
  notes?: string
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  recurringEndDate?: Date
  reminder?: boolean
  reminderTime?: number // minutes before
}

// Mock events data
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Entrenamiento de Piernas',
    type: 'workout',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:30',
    status: 'planned',
    priority: 'high',
    category: 'Strength',
    duration: 90,
    exercises: 8,
    reminder: true,
    reminderTime: 30
  },
  {
    id: '2',
    title: 'Cardio HIIT',
    type: 'workout',
    date: addDays(new Date(), 1),
    startTime: '07:00',
    endTime: '07:45',
    status: 'planned',
    priority: 'medium',
    category: 'Cardio',
    duration: 45,
    exercises: 6
  },
  {
    id: '3',
    title: 'Día de Descanso',
    type: 'rest',
    date: addDays(new Date(), 2),
    status: 'planned',
    priority: 'low',
    description: 'Recuperación activa - caminar 30 min'
  },
  {
    id: '4',
    title: 'Entrenamiento Completado',
    type: 'workout',
    date: addDays(new Date(), -1),
    startTime: '18:00',
    endTime: '19:30',
    status: 'completed',
    priority: 'high',
    category: 'Upper Body',
    duration: 85,
    calories: 420,
    exercises: 10
  }
]

// Event type colors and icons
const eventTypeConfig = {
  workout: {
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '🏋️',
    label: 'Entrenamiento'
  },
  rest: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '🧘',
    label: 'Descanso'
  },
  assessment: {
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '📊',
    label: 'Evaluación'
  },
  appointment: {
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: '👨‍⚕️',
    label: 'Cita'
  },
  meal_prep: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '🍽️',
    label: 'Comida'
  }
}

const statusConfig = {
  planned: { icon: '⏳', color: 'text-blue-600', bg: 'bg-blue-50' },
  completed: { icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
  missed: { icon: '❌', color: 'text-red-600', bg: 'bg-red-50' },
  rescheduled: { icon: '🔄', color: 'text-yellow-600', bg: 'bg-yellow-50' }
}

// Event component
function EventItem({ 
  event, 
  onEdit, 
  onDelete, 
  onClick,
  isCompact = false
}: { 
  event: CalendarEvent
  onEdit: (event: CalendarEvent) => void
  onDelete: (id: string) => void
  onClick: (event: CalendarEvent) => void
  isCompact?: boolean
}) {
  const config = eventTypeConfig[event.type]
  const statusInfo = statusConfig[event.status]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(event)}
      className={cn(
        "p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
        config.bgColor,
        config.textColor,
        "border-opacity-50",
        isCompact && "p-1 text-xs"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm">{config.icon}</span>
            <span className={cn(
              "font-medium truncate",
              isCompact ? "text-xs" : "text-sm"
            )}>
              {event.title}
            </span>
            <span className="text-xs">{statusInfo.icon}</span>
          </div>
          
          {!isCompact && (
            <>
              {event.startTime && (
                <div className="flex items-center gap-1 text-xs opacity-75">
                  <Clock className="h-3 w-3" />
                  <span>{event.startTime}</span>
                  {event.endTime && <span>- {event.endTime}</span>}
                </div>
              )}
              
              {event.category && (
                <Badge variant="outline" className="mt-1 text-xs h-4 px-1">
                  {event.category}
                </Badge>
              )}
            </>
          )}
        </div>
        
        {event.priority === 'high' && (
          <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
        )}
      </div>
    </motion.div>
  )
}

// Main calendar component
export function AdvancedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>(mockEvents)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Filter events
  useEffect(() => {
    let filtered = [...events]

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(event => event.status === filterStatus)
    }

    setFilteredEvents(filtered)
  }, [events, filterType, filterStatus])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { locale: es })
    const end = endOfWeek(endOfMonth(currentMonth), { locale: es })
    const days = []
    let day = start

    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }, [currentMonth])

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event => 
      isSameDay(event.date, date)
    ).sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime)
      }
      return 0
    })
  }

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  // Event handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventDialogOpen(true)
    setIsEditing(false)
  }

  const handleAddEvent = (date?: Date) => {
    setSelectedEvent({
      id: '',
      title: '',
      type: 'workout',
      date: date || selectedDate || new Date(),
      status: 'planned',
      priority: 'medium'
    })
    setIsEventDialogOpen(true)
    setIsEditing(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventDialogOpen(true)
    setIsEditing(true)
  }

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setIsEventDialogOpen(false)
  }

  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    if (selectedEvent?.id) {
      // Update existing event
      setEvents(prev => prev.map(e => 
        e.id === selectedEvent.id 
          ? { ...e, ...eventData } 
          : e
      ))
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventData.title || '',
        type: eventData.type || 'workout',
        date: eventData.date || new Date(),
        status: eventData.status || 'planned',
        priority: eventData.priority || 'medium',
        ...eventData
      }
      setEvents(prev => [...prev, newEvent])
    }
    setIsEventDialogOpen(false)
  }

  // Get calendar statistics
  const calendarStats = useMemo(() => {
    const monthEvents = filteredEvents.filter(event =>
      isSameMonth(event.date, currentMonth)
    )

    return {
      totalEvents: monthEvents.length,
      completedWorkouts: monthEvents.filter(e => e.type === 'workout' && e.status === 'completed').length,
      plannedWorkouts: monthEvents.filter(e => e.type === 'workout' && e.status === 'planned').length,
      restDays: monthEvents.filter(e => e.type === 'rest').length,
      totalCalories: monthEvents.reduce((sum, e) => sum + (e.calories || 0), 0),
      averageDuration: monthEvents.filter(e => e.duration).length > 0 
        ? Math.round(monthEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / monthEvents.filter(e => e.duration).length)
        : 0
    }
  }, [filteredEvents, currentMonth])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario de Entrenamientos
            </CardTitle>
            <Button onClick={() => handleAddEvent()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Evento
            </Button>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToToday}
              >
                Hoy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-4">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  <SelectItem value="workout">Entrenamientos</SelectItem>
                  <SelectItem value="rest">Descanso</SelectItem>
                  <SelectItem value="assessment">Evaluaciones</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="planned">Planificados</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="missed">Perdidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{calendarStats.totalEvents}</div>
            <div className="text-xs text-gray-600">Eventos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{calendarStats.completedWorkouts}</div>
            <div className="text-xs text-gray-600">Completados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{calendarStats.plannedWorkouts}</div>
            <div className="text-xs text-gray-600">Planificados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{calendarStats.restDays}</div>
            <div className="text-xs text-gray-600">Descansos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{calendarStats.totalCalories}</div>
            <div className="text-xs text-gray-600">Calorías</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{calendarStats.averageDuration}min</div>
            <div className="text-xs text-gray-600">Duración</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="p-2 text-center font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isTodayDate = isToday(day)

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "min-h-[120px] p-2 border border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                    !isCurrentMonth && "bg-gray-50 dark:bg-gray-900 text-gray-400",
                    isSelected && "ring-2 ring-blue-500",
                    isTodayDate && "bg-blue-50 dark:bg-blue-950"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isTodayDate && "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <EventItem
                        key={event.id}
                        event={event}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                        onClick={handleEventClick}
                        isCompact={true}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Evento' : 'Detalles del Evento'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <EventDetailsForm
              event={selectedEvent}
              isEditing={isEditing}
              onSave={handleSaveEvent}
              onEdit={() => setIsEditing(true)}
              onDelete={() => handleDeleteEvent(selectedEvent.id)}
              onCancel={() => setIsEventDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Event details form component
function EventDetailsForm({
  event,
  isEditing,
  onSave,
  onEdit,
  onDelete,
  onCancel
}: {
  event: CalendarEvent
  isEditing: boolean
  onSave: (event: Partial<CalendarEvent>) => void
  onEdit: () => void
  onDelete: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>(event)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isEditing) {
    const config = eventTypeConfig[event.type]
    
    return (
      <div className="space-y-4">
        <div className={cn("p-4 rounded-lg", config.bgColor, config.textColor)}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{config.icon}</span>
            <h3 className="font-semibold">{event.title}</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-gray-500">Fecha</Label>
            <p>{format(event.date, 'PPP', { locale: es })}</p>
          </div>
          {event.startTime && (
            <div>
              <Label className="text-xs text-gray-500">Hora</Label>
              <p>{event.startTime} {event.endTime && `- ${event.endTime}`}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-gray-500">Estado</Label>
            <div className="flex items-center gap-1">
              <span>{statusConfig[event.status].icon}</span>
              <span className="capitalize">{event.status}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Prioridad</Label>
            <p className="capitalize">{event.priority}</p>
          </div>
        </div>

        {event.description && (
          <div>
            <Label className="text-xs text-gray-500">Descripción</Label>
            <p className="text-sm mt-1">{event.description}</p>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onEdit}>
            Editar
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Eliminar
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Nombre del evento"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(eventTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    {config.icon} {config.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Estado</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planificado</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="missed">Perdido</SelectItem>
              <SelectItem value="rescheduled">Reprogramado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Hora inicio</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="endTime">Hora fin</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detalles adicionales..."
          rows={3}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar
        </Button>
      </div>
    </form>
  )
}

export default AdvancedCalendar