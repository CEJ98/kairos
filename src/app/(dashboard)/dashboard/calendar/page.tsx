'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  Activity,
  Footprints,
  Expand,
  Home,
  Settings,
  Dumbbell,
  Bird,
  Target,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { WeeklyCalendar } from '@/components/calendar/weekly-calendar'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function CalendarPage() {
	const searchParams = useSearchParams()
	const highlightWorkoutId = searchParams?.get('workoutId') || undefined
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<{ id: string; workoutId: string; title: string; date: string }[]>([])
  useEffect(() => {
    const params = new URLSearchParams()
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() + 1) // lunes
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    params.set('start', start.toISOString().slice(0, 10))
    params.set('end', end.toISOString().slice(0, 10))
    fetch(`/api/calendar/events?${params.toString()}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setEvents(json.events || []))
      .catch(() => setEvents([]))
  }, [])

  async function handleMove(id: string, newISODate: string) {
    try {
      const res = await fetch(`/api/calendar/events`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date: newISODate }),
      })
      if (!res.ok) throw new Error('No se pudo guardar el cambio')
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, date: newISODate } : ev))
      toast.success('Evento reprogramado')
    } catch (e: any) {
      toast.warning('No se pudo persistir el movimiento')
    }
  }
  
  // Mock data - en producción vendría de APIs
  const trainingDays = [
    { day: 4, type: 'strength', name: 'Upper Body', duration: 45, exercises: 8, completed: true },
    { day: 7, type: 'cardio', name: 'HIIT Blast', duration: 30, exercises: 6, completed: true },
    { day: 11, type: 'strength', name: 'Leg Day', duration: 60, exercises: 10, completed: false },
    { day: 14, type: 'cardio', name: 'Running', duration: 25, exercises: 1, completed: false },
    { day: 18, type: 'strength', name: 'Push Day', duration: 50, exercises: 9, completed: false },
    { day: 21, type: 'cardio', name: 'Cycling', duration: 40, exercises: 1, completed: false },
    { day: 25, type: 'strength', name: 'Pull Day', duration: 55, exercises: 11, completed: false },
    { day: 28, type: 'cardio', name: 'Swimming', duration: 35, exercises: 1, completed: false }
  ]

  const todayExercises = [
    {
      id: 1,
      name: "Morning Stretching",
      description: "Stretch. Breathe. Wake up. Feel alive",
      duration: "15 min",
      completed: true,
      image: "/api/placeholder/60/60"
    },
    {
      id: 2,
      name: "Morning Stretch Flow",
      description: "Wake up your body with",
      duration: "20 min",
      completed: false,
      image: "/api/placeholder/60/60"
    }
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const getTrainingDay = (day: number) => {
    return trainingDays.find(td => td.day === day)
  }

  const getTrainingIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <Dumbbell className="w-4 h-4 text-red-600" />
      case 'cardio':
        return <Bird className="w-4 h-4 text-green-600" />
      default:
        return <Activity className="w-4 h-4 text-blue-600" />
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center mobile-gap">
            <Button variant="ghost" size="sm" className="mobile-button">
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="responsive-heading font-semibold text-gray-900">Calendar</h1>
          </div>
          <Button variant="ghost" size="sm" className="mobile-button">
            <Expand className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Weekly Calendar */}
        <div className="mb-4 sm:mb-6">
          <WeeklyCalendar events={events} onMove={handleMove} highlightWorkoutId={highlightWorkoutId} />
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-2 mobile-gap mb-4 sm:mb-6">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Footprints className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="responsive-body font-bold text-gray-900">6,430</div>
            <div className="responsive-caption text-gray-500">Steps</div>
            <div className="text-xs text-gray-400">6,430 / 10,000</div>
          </div>
          
          <div className="text-center">
            <div className="responsive-body font-bold text-gray-900">7,233</div>
            <div className="responsive-caption text-gray-500">Distance</div>
          </div>
          
          <div className="text-center">
            <div className="responsive-body font-bold text-gray-900">609</div>
            <div className="responsive-caption text-gray-500">Calories</div>
          </div>
          
          <div className="text-center">
            <div className="responsive-body font-bold text-gray-900">202</div>
            <div className="responsive-caption text-gray-500">Points</div>
          </div>
        </div>

        {/* Today's Exercises */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="responsive-subheading font-semibold text-gray-900">Today Exercises</h3>
            <div className="flex items-center mobile-gap">
              <span className="responsive-caption text-gray-500">Today</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </div>
          </div>

          <div className="mobile-spacing content-visibility-auto">
            {todayExercises.map((exercise) => (
              <Card key={exercise.id} className="bg-white border-0 shadow-sm mobile-card">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center mobile-gap">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Image 
                        src={exercise.image} 
                        alt={exercise.name}
                        width={32}
                        height={32}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover"
                        sizes="(max-width: 768px) 24px, 32px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="responsive-body font-medium text-gray-900 truncate">{exercise.name}</h4>
                      <p className="responsive-caption text-gray-500 truncate">{exercise.description}</p>
                      <div className="flex items-center mobile-gap mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="responsive-caption text-gray-500">{exercise.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center mobile-gap flex-shrink-0">
                      {exercise.completed ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="mobile-button">
                          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <div className="flex flex-col items-center gap-1 touch-target">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <span className="responsive-caption text-gray-500">Home</span>
          </div>
          
          <div className="flex flex-col items-center gap-1 touch-target">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <span className="responsive-caption text-gray-500">Dashboard</span>
          </div>
          
          <div className="flex flex-col items-center gap-1 touch-target">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="responsive-caption text-blue-500 font-medium">Bookmarks</span>
          </div>
          
          <div className="flex flex-col items-center gap-1 touch-target">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <span className="responsive-caption text-gray-500">Notifications</span>
          </div>
          
          <div className="flex flex-col items-center gap-1 touch-target">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <span className="responsive-caption text-gray-500">Settings</span>
          </div>
        </div>
      </div>

      {/* Spacer para la navegación inferior */}
      <div className="h-20"></div>
      </div>
    </div>
  )
}
