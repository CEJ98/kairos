'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Target, 
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Star,
  Users,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { WorkoutForm } from '@/components/workouts/workout-form'
import { WorkoutTable } from '@/components/workouts/workout-table'
import { useCreateWorkout, useWorkoutsList } from '@/hooks/use-workouts'

interface Workout {
  id: string
  name: string
  description?: string
  category: string
  duration?: number
  isTemplate: boolean
  isPublic: boolean
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  exercises: {
    id: string
    order: number
    sets?: number
    reps?: number
    duration?: number
    restTime?: number
    exercise: {
      id: string
      name: string
      category: string
    }
  }[]
  _count: {
    sessions: number
  }
}

export default function WorkoutsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { data, isLoading, isError } = useWorkoutsList({ category: selectedCategory, search: searchTerm })
  const workouts: Workout[] = data?.workouts || []
  const loading = isLoading
  const error = isError ? 'Error al cargar las rutinas' : null
  const createMutation = useCreateWorkout()

  const categories = [
    { value: 'all', label: 'Todas', count: workouts.length },
    { value: 'STRENGTH', label: 'Fuerza', count: 2 },
    { value: 'CARDIO', label: 'Cardio', count: 1 },
    { value: 'FLEXIBILITY', label: 'Flexibilidad', count: 1 },
  ]

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workout.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesCategory = selectedCategory === 'all' || workout.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'success'
      case 'INTERMEDIATE': return 'warning'
      case 'ADVANCED': return 'destructive'
      default: return 'secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'STRENGTH': return '💪'
      case 'CARDIO': return '❤️'
      case 'FLEXIBILITY': return '🧘'
      default: return '⚡'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap">
        <div className="min-w-0">
          <h1 className="responsive-heading font-bold text-gray-900">Mis Rutinas</h1>
          <p className="responsive-body text-gray-600 mt-1">
            Gestiona y ejecuta tus rutinas de entrenamiento
          </p>
        </div>
        <Link href="/dashboard/workouts/new">
          <Button variant="gradient" className="mobile-button">
            <Plus className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="responsive-body">Nueva Rutina</span>
          </Button>
        </Link>
      </div>

      {/* Quick create form */}
      <WorkoutForm 
        onSubmit={async (values) => {
          try {
            await createMutation.mutateAsync({ ...values })
            toast.success('Rutina creada')
          } catch (e: any) {
            toast.error(e?.message || 'Error al crear rutina')
          }
        }}
        submitting={createMutation.isPending}
      />

      {/* Filters */}
      <Card className="mobile-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row mobile-gap">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                placeholder="Buscar rutinas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 mobile-input responsive-body"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="whitespace-nowrap mobile-button"
                >
                  <span className="responsive-caption">{category.label} ({category.count})</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 mobile-gap">
        <Card className="mobile-card">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="responsive-subheading font-bold text-green-600">
              {workouts.length}
            </div>
            <p className="responsive-caption text-gray-600">Total de rutinas</p>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="responsive-subheading font-bold text-blue-600">
              {workouts.filter(w => w.isTemplate).length}
            </div>
            <p className="responsive-caption text-gray-600">Plantillas</p>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="responsive-subheading font-bold text-purple-600">
              {workouts.reduce((acc, w) => acc + w._count.sessions, 0)}
            </div>
            <p className="responsive-caption text-gray-600">Sesiones totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Cargando rutinas...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredWorkouts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'No se encontraron rutinas' : 'No tienes rutinas aún'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Intenta ajustar tus filtros de búsqueda'
                : 'Crea tu primera rutina de entrenamiento'}
            </p>
            <Link href="/dashboard/workouts/new">
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Rutina
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Workouts Grid */}
      {!loading && !error && filteredWorkouts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mobile-gap">
        {filteredWorkouts.map((workout) => (
          <Card key={workout.id} className="hover:shadow-lg transition-shadow mobile-card">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mobile-gap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base sm:text-lg">{getCategoryIcon(workout.category)}</span>
                    <CardTitle className="responsive-body leading-none truncate">{workout.name}</CardTitle>
                    {workout.isTemplate && (
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  <CardDescription className="responsive-caption line-clamp-2">
                    {workout.description}
                  </CardDescription>
                </div>
                
                <Button variant="ghost" size="sm" className="p-2 touch-target flex-shrink-0">
                  <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="text-xs">
                  {workout.category}
                </Badge>
                {workout.isTemplate && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Plantilla
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-600">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="responsive-caption">{workout.duration || 0}min</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-600">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="responsive-caption">{workout.exercises.length} ejercicios</span>
                  </div>
                </div>
                <div>
                  <div className="responsive-caption text-gray-600">
                    {workout._count.sessions} sesiones
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Creada por: {workout.creator.name}</div>
                <div>Actualizada: {new Date(workout.updatedAt).toLocaleDateString()}</div>
              </div>

              {/* Actions */}
              <div className="flex mobile-gap pt-2">
                <Link href={`/dashboard/workouts/${workout.id}/start`} className="flex-1">
                  <Button variant="gradient" size="sm" className="w-full mobile-button">
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="responsive-caption">Iniciar</span>
                  </Button>
                </Link>
                
                {/* Planificar */}
                <PlanWorkoutDialog workoutId={workout.id} workoutName={workout.name} />

                <Link href={`/dashboard/workouts/${workout.id}/edit`}>
                  <Button variant="outline" size="sm" className="touch-target">
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
                
                <Button variant="outline" size="sm" className="touch-target">
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Simple table view (title, createdAt) */}
      {!loading && !error && (
        <WorkoutTable rows={workouts.map(w => ({ id: w.id, name: w.name, createdAt: w.createdAt }))} />
      )}
    </div>
  )
}

function PlanWorkoutDialog({ workoutId, workoutName }: { workoutId: string; workoutName: string }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<string>('')

  async function onSubmit() {
    if (!date) {
      toast.error('Selecciona una fecha')
      return
    }
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId, date }),
      })
      if (!res.ok) throw new Error('No se pudo planificar')
      toast.success('Workout planificado')
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.message || 'Error al planificar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="touch-target">Planificar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Planificar rutina</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-gray-600">{workoutName}</div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
