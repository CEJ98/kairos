'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Plus,
  Search,
  Clock,
  Target,
  Zap,
  GripVertical,
  X,
  Save,
  Play
} from 'lucide-react'
import { logger } from '@/lib/logger'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface Exercise {
  id: string
  name: string
  category: string
  muscleGroup: string[]
  equipment: string[]
  difficulty: string
  description?: string
}

interface WorkoutExercise {
  id: string
  exercise: Exercise
  sets: number
  reps?: number
  weight?: number
  duration?: number
  restTime: number
  notes?: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  
  // Workout form data
  const [workoutData, setWorkoutData] = useState({
    name: '',
    description: '',
    category: 'STRENGTH',
    isTemplate: false
  })

  // Exercises
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([])
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock exercises data
  const availableExercises: Exercise[] = [
    {
      id: '1',
      name: 'Push-ups',
      category: 'STRENGTH',
      muscleGroup: ['CHEST', 'TRICEPS'],
      equipment: ['BODYWEIGHT'],
      difficulty: 'BEGINNER',
      description: 'Flexiones de pecho tradicionales'
    },
    {
      id: '2',
      name: 'Squats',
      category: 'STRENGTH', 
      muscleGroup: ['QUADS', 'GLUTES'],
      equipment: ['BODYWEIGHT'],
      difficulty: 'BEGINNER',
      description: 'Sentadillas básicas'
    },
    {
      id: '3',
      name: 'Pull-ups',
      category: 'STRENGTH',
      muscleGroup: ['BACK', 'BICEPS'],
      equipment: ['PULL_UP_BAR'],
      difficulty: 'INTERMEDIATE',
      description: 'Dominadas en barra'
    },
    {
      id: '4',
      name: 'Plank',
      category: 'STRENGTH',
      muscleGroup: ['ABS', 'OBLIQUES'],
      equipment: ['BODYWEIGHT'],
      difficulty: 'BEGINNER',
      description: 'Plancha isométrica'
    },
    {
      id: '5',
      name: 'Burpees',
      category: 'CARDIO',
      muscleGroup: ['FULL_BODY'],
      equipment: ['BODYWEIGHT'],
      difficulty: 'INTERMEDIATE',
      description: 'Ejercicio combinado de alta intensidad'
    }
  ]

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'STRENGTH', label: 'Fuerza' },
    { value: 'CARDIO', label: 'Cardio' },
    { value: 'FLEXIBILITY', label: 'Flexibilidad' }
  ]

  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
    const notSelected = !selectedExercises.find(se => se.exercise.id === exercise.id)
    return matchesSearch && matchesCategory && notSelected
  })

  const addExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      id: `${exercise.id}-${Date.now()}`,
      exercise,
      sets: 3,
      reps: 10,
      restTime: 60
    }
    setSelectedExercises([...selectedExercises, newWorkoutExercise])
  }

  const removeExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== id))
  }

  const updateExercise = (id: string, updates: Partial<WorkoutExercise>) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.id === id ? { ...ex, ...updates } : ex
    ))
  }

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const newExercises = [...selectedExercises]
    const [removed] = newExercises.splice(fromIndex, 1)
    newExercises.splice(toIndex, 0, removed)
    setSelectedExercises(newExercises)
  }

  const handleSave = async (asDraft = false) => {
    if (!workoutData.name.trim()) {
      toast.error('El nombre de la rutina es obligatorio')
      return
    }

    if (selectedExercises.length === 0) {
      toast.error('Debe agregar al menos un ejercicio')
      return
    }

    try {
      const workoutPayload = {
        name: workoutData.name,
        description: workoutData.description,
        category: workoutData.category,
        isTemplate: workoutData.isTemplate,
        isPublic: false,
        exercises: selectedExercises.map((ex, index) => ({
          exerciseId: ex.exercise.id,
          order: index + 1,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          duration: ex.duration,
          restTime: ex.restTime,
          notes: ex.notes
        }))
      }

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear rutina')
      }

      const workout = await response.json()
      
      toast.success('Rutina creada exitosamente')
      
      if (asDraft) {
        router.push('/dashboard/workouts')
      } else {
        router.push(`/dashboard/workouts/${workout.id}/start`)
      }
    } catch (error) {
      logger.error('Error saving workout:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar la rutina')
    }
  }

  const totalDuration = selectedExercises.reduce((acc, ex) => {
    const exerciseTime = ex.duration || (ex.sets || 0) * (ex.reps || 0) * 2 // 2 sec per rep estimate
    const restTime = (ex.sets || 0) * ex.restTime
    return acc + exerciseTime + restTime
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workouts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Rutina</h1>
            <p className="text-gray-600">Crea una rutina personalizada</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(true)}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button 
            variant="gradient" 
            onClick={() => handleSave(false)}
            disabled={!workoutData.name || selectedExercises.length === 0}
          >
            Crear Rutina
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Información Básica</span>
            </div>
            
            <div className="flex-1 mx-4 h-px bg-gray-200">
              <div className={`h-full bg-green-600 transition-all duration-300 ${
                currentStep >= 2 ? 'w-full' : 'w-0'
              }`} />
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Seleccionar Ejercicios</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Información de la Rutina</CardTitle>
            <CardDescription>
              Define los detalles básicos de tu rutina
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la rutina *</label>
                <Input
                  placeholder="Ej: Full Body Strength"
                  value={workoutData.name}
                  onChange={(e) => setWorkoutData({...workoutData, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={workoutData.category}
                  onChange={(e) => setWorkoutData({...workoutData, category: e.target.value})}
                >
                  <option value="STRENGTH">Fuerza</option>
                  <option value="CARDIO">Cardio</option>
                  <option value="HIIT">HIIT</option>
                  <option value="YOGA">Yoga</option>
                  <option value="FUNCTIONAL">Funcional</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={3}
                placeholder="Describe el objetivo de esta rutina..."
                value={workoutData.description}
                onChange={(e) => setWorkoutData({...workoutData, description: e.target.value})}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isTemplate"
                checked={workoutData.isTemplate}
                onChange={(e) => setWorkoutData({...workoutData, isTemplate: e.target.checked})}
              />
              <label htmlFor="isTemplate" className="text-sm">
                Crear como plantilla (podrá ser usada por otros usuarios)
              </label>
            </div>
            
            <Button 
              onClick={() => setCurrentStep(2)}
              disabled={!workoutData.name}
              variant="gradient"
            >
              Continuar
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exercise Library */}
          <Card>
            <CardHeader>
              <CardTitle>Biblioteca de Ejercicios</CardTitle>
              <CardDescription>
                Busca y agrega ejercicios a tu rutina
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and filters */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar ejercicios..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className="whitespace-nowrap"
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Exercise list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{exercise.name}</h4>
                      <p className="text-xs text-gray-600">{exercise.description}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {exercise.difficulty}
                        </Badge>
                        {exercise.muscleGroup.slice(0, 2).map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addExercise(exercise)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Exercises */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rutina: {workoutData.name}</CardTitle>
                  <CardDescription>
                    {selectedExercises.length} ejercicios • ~{Math.round(totalDuration / 60)} min
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                >
                  Editar Info
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Agrega ejercicios de la biblioteca</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedExercises.map((workoutEx, index) => (
                    <div key={workoutEx.id} className="border rounded-lg p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                          <span className="font-medium text-sm">{workoutEx.exercise.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(workoutEx.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Configuration */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Series</label>
                          <Input
                            type="number"
                            min="1"
                            value={workoutEx.sets}
                            onChange={(e) => updateExercise(workoutEx.id, { sets: parseInt(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        
                        {workoutEx.exercise.category === 'CARDIO' ? (
                          <div>
                            <label className="text-xs text-gray-600">Duración (seg)</label>
                            <Input
                              type="number"
                              min="1"
                              value={workoutEx.duration || 30}
                              onChange={(e) => updateExercise(workoutEx.id, { duration: parseInt(e.target.value) })}
                              className="h-8 text-sm"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="text-xs text-gray-600">Reps</label>
                            <Input
                              type="number"
                              min="1"
                              value={workoutEx.reps}
                              onChange={(e) => updateExercise(workoutEx.id, { reps: parseInt(e.target.value) })}
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="text-xs text-gray-600">Descanso (seg)</label>
                          <Input
                            type="number"
                            min="0"
                            value={workoutEx.restTime}
                            onChange={(e) => updateExercise(workoutEx.id, { restTime: parseInt(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <Input
                        placeholder="Notas del ejercicio..."
                        value={workoutEx.notes || ''}
                        onChange={(e) => updateExercise(workoutEx.id, { notes: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {selectedExercises.length > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Duración estimada:</span>
                    <span className="font-medium">{Math.round(totalDuration / 60)} minutos</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave(true)}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => handleSave(false)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Crear y Probar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}