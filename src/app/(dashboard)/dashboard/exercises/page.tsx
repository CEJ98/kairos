'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import NextImage from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Dumbbell,
  Heart,
  Zap,
  Target,
  Clock,
  Users,
  Star,
  Play,
  Image,
  Video,
  Loader2
} from 'lucide-react'

interface Exercise {
  id: string
  name: string
  description?: string
  category: string
  muscleGroups: string[]
  equipments: string[]
  difficulty: string
  instructions?: string
  tips?: string
  imageUrl?: string
  videoUrl?: string
  gifUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ExerciseFormData {
  name: string
  description: string
  category: string
  muscleGroups: string[]
  equipments: string[]
  difficulty: string
  instructions: string
  tips: string
  imageUrl: string
  videoUrl: string
  gifUrl: string
}

const categories = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'STRENGTH', label: 'Fuerza' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'FLEXIBILITY', label: 'Flexibilidad' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'FUNCTIONAL', label: 'Funcional' },
  { value: 'REHABILITATION', label: 'Rehabilitación' }
]

const difficulties = [
  { value: 'all', label: 'Todas las dificultades' },
  { value: 'BEGINNER', label: 'Principiante' },
  { value: 'INTERMEDIATE', label: 'Intermedio' },
  { value: 'ADVANCED', label: 'Avanzado' },
  { value: 'EXPERT', label: 'Experto' }
]

const muscleGroups = [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS',
  'ABS', 'OBLIQUES', 'LOWER_BACK', 'QUADRICEPS', 'HAMSTRINGS',
  'GLUTES', 'CALVES', 'FULL_BODY', 'CORE'
]

const equipments = [
  'BODYWEIGHT', 'DUMBBELLS', 'BARBELL', 'KETTLEBELL', 'RESISTANCE_BANDS',
  'PULL_UP_BAR', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'TREADMILL',
  'STATIONARY_BIKE', 'ROWING_MACHINE', 'MEDICINE_BALL', 'FOAM_ROLLER'
]

export default function ExercisesPage() {
  const { data: session } = useSession()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all')
  const [selectedEquipment, setSelectedEquipment] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    description: '',
    category: 'STRENGTH',
    muscleGroups: [],
    equipments: [],
    difficulty: 'BEGINNER',
    instructions: '',
    tips: '',
    imageUrl: '',
    videoUrl: '',
    gifUrl: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
  }

  const handleDifficultyFilter = (difficulty: string) => {
    setSelectedDifficulty(difficulty)
  }

  const handleEquipmentFilter = (equipment: string) => {
    setSelectedEquipment(equipment)
  }

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty)
      if (selectedMuscleGroup !== 'all') params.append('muscleGroup', selectedMuscleGroup)
      if (selectedEquipment !== 'all') params.append('equipment', selectedEquipment)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/exercises?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      } else {
        toast.error('Error al cargar ejercicios')
      }
    } catch (error) {
      toast.error('Error al cargar ejercicios')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedDifficulty, selectedMuscleGroup, selectedEquipment, searchTerm])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const handleCreateExercise = async () => {
    try {
      setSubmitting(true)
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Ejercicio creado exitosamente')
        setIsCreateDialogOpen(false)
        resetForm()
        fetchExercises()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear ejercicio')
      }
    } catch (error) {
      toast.error('Error al crear ejercicio')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditExercise = async () => {
    if (!selectedExercise) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/exercises/${selectedExercise.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Ejercicio actualizado exitosamente')
        setIsEditDialogOpen(false)
        setSelectedExercise(null)
        resetForm()
        fetchExercises()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar ejercicio')
      }
    } catch (error) {
      toast.error('Error al actualizar ejercicio')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) return

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Ejercicio eliminado exitosamente')
        fetchExercises()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar ejercicio')
      }
    } catch (error) {
      toast.error('Error al eliminar ejercicio')
    }
  }

  const openEditDialog = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      equipments: exercise.equipments,
      difficulty: exercise.difficulty,
      instructions: exercise.instructions || '',
      tips: exercise.tips || '',
      imageUrl: exercise.imageUrl || '',
      videoUrl: exercise.videoUrl || '',
      gifUrl: exercise.gifUrl || ''
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'STRENGTH',
      muscleGroups: [],
      equipments: [],
      difficulty: 'BEGINNER',
      instructions: '',
      tips: '',
      imageUrl: '',
      videoUrl: '',
      gifUrl: ''
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800'
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800'
      case 'ADVANCED': return 'bg-orange-100 text-orange-800'
      case 'EXPERT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'STRENGTH': return <Dumbbell className="h-4 w-4" />
      case 'CARDIO': return <Heart className="h-4 w-4" />
      case 'HIIT': return <Zap className="h-4 w-4" />
      case 'FLEXIBILITY': return <Target className="h-4 w-4" />
      default: return <Dumbbell className="h-4 w-4" />
    }
  }

  const canEditExercises = session?.user?.role === 'TRAINER' || session?.user?.role === 'ADMIN'

  return (
    <div className="mobile-gap-y">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mobile-gap">
        <div className="min-w-0">
          <h1 className="responsive-heading font-bold text-gray-900">Gestión de Ejercicios</h1>
          <p className="responsive-body text-gray-600 mt-1">Administra la biblioteca completa de ejercicios</p>
        </div>
        {canEditExercises && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 mobile-button">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="responsive-body">Nuevo Ejercicio</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Ejercicio</DialogTitle>
              </DialogHeader>
              <ExerciseForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateExercise}
                submitting={submitting}
                isEdit={false}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 mobile-gap">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Buscar ejercicios..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-8 sm:pl-10 mobile-input"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="mobile-button">
                <SelectValue placeholder="Categoría" className="responsive-body" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={selectedDifficulty} onValueChange={handleDifficultyFilter}>
              <SelectTrigger className="mobile-button">
                <SelectValue placeholder="Dificultad" className="responsive-body" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Muscle Group Filter */}
            <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
              <SelectTrigger className="mobile-button">
                <SelectValue placeholder="Grupo muscular" className="responsive-body" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {muscleGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Equipment Filter */}
            <Select value={selectedEquipment} onValueChange={handleEquipmentFilter}>
              <SelectTrigger className="mobile-button">
                <SelectValue placeholder="Equipamiento" className="responsive-body" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el equipamiento</SelectItem>
                {equipments.map((equipment) => (
                  <SelectItem key={equipment} value={equipment}>
                    {equipment.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mobile-gap">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-lg transition-shadow mobile-card">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getCategoryIcon(exercise.category)}
                    <CardTitle className="responsive-subheading truncate">{exercise.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openViewDialog(exercise)}
                      className="mobile-button"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    {canEditExercises && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(exercise)}
                          className="mobile-button"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="text-red-600 hover:text-red-700 mobile-button"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {exercise.description && (
                  <p className="responsive-caption text-gray-600 line-clamp-2">
                    {exercise.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={getDifficultyColor(exercise.difficulty)}>
                    {exercise.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {exercise.category}
                  </Badge>
                </div>

                {exercise.muscleGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                      <Badge key={muscle} variant="secondary" className="text-xs">
                        {muscle.replace('_', ' ')}
                      </Badge>
                    ))}
                    {exercise.muscleGroups.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{exercise.muscleGroups.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center mobile-gap responsive-caption text-gray-500">
                  {exercise.imageUrl && (
                    <div className="flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      <span className="hidden sm:inline">Imagen</span>
                    </div>
                  )}
                  {exercise.videoUrl && (
                    <div className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      <span className="hidden sm:inline">Video</span>
                    </div>
                  )}
                  {exercise.gifUrl && (
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      <span className="hidden sm:inline">GIF</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {exercises.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <Dumbbell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="responsive-subheading font-medium text-gray-900 mb-2">No se encontraron ejercicios</h3>
            <p className="responsive-body text-gray-600 mb-3 sm:mb-4">Intenta ajustar los filtros o crear un nuevo ejercicio.</p>
            {canEditExercises && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mobile-button">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="responsive-body">Crear Primer Ejercicio</span>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ejercicio</DialogTitle>
          </DialogHeader>
          <ExerciseForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditExercise}
            submitting={submitting}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Ejercicio</DialogTitle>
          </DialogHeader>
          {selectedExercise && (
            <ExerciseDetails exercise={selectedExercise} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Exercise Form Component
interface ExerciseFormProps {
  formData: ExerciseFormData
  setFormData: (data: ExerciseFormData) => void
  onSubmit: () => void
  submitting: boolean
  isEdit: boolean
}

function ExerciseForm({ formData, setFormData, onSubmit, submitting, isEdit }: ExerciseFormProps) {
  const handleMuscleGroupToggle = (group: string) => {
    const newGroups = formData.muscleGroups.includes(group)
      ? formData.muscleGroups.filter(g => g !== group)
      : [...formData.muscleGroups, group]
    setFormData({ ...formData, muscleGroups: newGroups })
  }

  const handleEquipmentToggle = (equipment: string) => {
    const newEquipments = formData.equipments.includes(equipment)
      ? formData.equipments.filter(e => e !== equipment)
      : [...formData.equipments, equipment]
    setFormData({ ...formData, equipments: newEquipments })
  }

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-6"
      role="form"
      aria-label={isEdit ? "Editar ejercicio" : "Crear nuevo ejercicio"}
    >
      {/* Basic Info */}
      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend className="sr-only">Información básica del ejercicio</legend>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre del ejercicio"
            required
            aria-required="true"
            aria-describedby="name-error"
            aria-invalid={!formData.name ? "true" : "false"}
            autoComplete="off"
            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {!formData.name && (
            <div id="name-error" className="text-sm text-red-600" role="alert">
              <span className="sr-only">Error: </span>
              El nombre del ejercicio es requerido
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoría *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            required
          >
            <SelectTrigger 
              id="category"
              aria-required="true"
              aria-describedby="category-error"
              aria-invalid={!formData.category ? "true" : "false"}
              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.slice(1).map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!formData.category && (
            <div id="category-error" className="text-sm text-red-600" role="alert">
              <span className="sr-only">Error: </span>
              La categoría es requerida
            </div>
          )}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción breve del ejercicio"
          rows={3}
          aria-describedby="description-help"
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div id="description-help" className="text-sm text-gray-500">
          Proporciona una descripción clara y concisa del ejercicio
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label htmlFor="difficulty">Dificultad *</Label>
        <Select 
          value={formData.difficulty} 
          onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
          required
        >
          <SelectTrigger 
            id="difficulty"
            aria-required="true"
            aria-describedby="difficulty-error"
            aria-invalid={!formData.difficulty ? "true" : "false"}
            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <SelectValue placeholder="Selecciona la dificultad" />
          </SelectTrigger>
          <SelectContent>
            {difficulties.slice(1).map((difficulty) => (
              <SelectItem key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!formData.difficulty && (
          <div id="difficulty-error" className="text-sm text-red-600" role="alert">
            <span className="sr-only">Error: </span>
            La dificultad es requerida
          </div>
        )}
      </div>

      {/* Muscle Groups */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Grupos Musculares
        </legend>
        <div 
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-labelledby="muscle-groups-legend"
        >
          <div id="muscle-groups-legend" className="sr-only">
            Selecciona los grupos musculares que trabaja este ejercicio
          </div>
          {muscleGroups.map((group) => (
            <label 
              key={group} 
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors focus-within:ring-2 focus-within:ring-blue-500"
            >
              <input
                type="checkbox"
                checked={formData.muscleGroups.includes(group)}
                onChange={() => handleMuscleGroupToggle(group)}
                className="rounded focus:ring-2 focus:ring-blue-500"
                aria-describedby={`muscle-${group}-desc`}
              />
              <span className="text-sm">{group.replace('_', ' ')}</span>
              <span id={`muscle-${group}-desc`} className="sr-only">
                Grupo muscular: {group.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Equipment */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Equipamiento
        </legend>
        <div 
          className="grid grid-cols-2 gap-2"
          role="group"
          aria-labelledby="equipment-legend"
        >
          <div id="equipment-legend" className="sr-only">
            Selecciona el equipamiento necesario para este ejercicio
          </div>
          {equipments.map((equipment) => (
            <label 
              key={equipment} 
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors focus-within:ring-2 focus-within:ring-blue-500"
            >
              <input
                type="checkbox"
                checked={formData.equipments.includes(equipment)}
                onChange={() => handleEquipmentToggle(equipment)}
                className="rounded focus:ring-2 focus:ring-blue-500"
                aria-describedby={`equipment-${equipment}-desc`}
              />
              <span className="text-sm">{equipment.replace('_', ' ')}</span>
              <span id={`equipment-${equipment}-desc`} className="sr-only">
                Equipamiento: {equipment.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions">Instrucciones</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Instrucciones paso a paso para realizar el ejercicio"
          rows={4}
          aria-describedby="instructions-help"
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div id="instructions-help" className="text-sm text-gray-500">
          Describe los pasos detallados para ejecutar correctamente el ejercicio
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-2">
        <Label htmlFor="tips">Consejos</Label>
        <Textarea
          id="tips"
          value={formData.tips}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, tips: e.target.value })}
          placeholder="Consejos y recomendaciones adicionales"
          rows={3}
        />
      </div>

      {/* Media URLs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imageUrl">URL de Imagen</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="videoUrl">URL de Video</Label>
          <Input
            id="videoUrl"
            value={formData.videoUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, videoUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gifUrl">URL de GIF</Label>
          <Input
            id="gifUrl"
            value={formData.gifUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, gifUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Close dialog logic handled by parent
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting || !formData.name}
          className="bg-green-600 hover:bg-green-700"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Actualizar' : 'Crear'} Ejercicio
        </Button>
      </div>
    </form>
  )
}

// Exercise Details Component
interface ExerciseDetailsProps {
  exercise: Exercise
}

function ExerciseDetails({ exercise }: ExerciseDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{exercise.name}</h2>
          {exercise.description && (
            <p className="text-gray-600 mt-1">{exercise.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Badge className={`${
            exercise.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
            exercise.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
            exercise.difficulty === 'ADVANCED' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {exercise.difficulty}
          </Badge>
          <Badge variant="outline">{exercise.category}</Badge>
        </div>
      </div>

      {/* Media */}
      {(exercise.imageUrl || exercise.videoUrl || exercise.gifUrl) && (
        <div className="space-y-4">
          <h3 className="font-semibold">Multimedia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exercise.imageUrl && (
              <div className="space-y-2">
                <Label>Imagen</Label>
                <NextImage 
                  src={exercise.imageUrl} 
                  alt={exercise.name}
                  width={400}
                  height={128}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            {exercise.videoUrl && (
              <div className="space-y-2">
                <Label>Video</Label>
                <video 
                  src={exercise.videoUrl}
                  controls
                  className="w-full h-32 rounded-lg"
                />
              </div>
            )}
            {exercise.gifUrl && (
              <div className="space-y-2">
                <Label>GIF</Label>
                <img 
                  src={exercise.gifUrl} 
                  alt={exercise.name}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Muscle Groups */}
      {exercise.muscleGroups.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Grupos Musculares</h3>
          <div className="flex flex-wrap gap-2">
            {exercise.muscleGroups.map((muscle) => (
              <Badge key={muscle} variant="secondary">
                {muscle.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {exercise.equipments.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Equipamiento</h3>
          <div className="flex flex-wrap gap-2">
            {exercise.equipments.map((equipment) => (
              <Badge key={equipment} variant="outline">
                {equipment.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {exercise.instructions && (
        <div className="space-y-2">
          <h3 className="font-semibold">Instrucciones</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{exercise.instructions}</p>
          </div>
        </div>
      )}

      {/* Tips */}
      {exercise.tips && (
        <div className="space-y-2">
          <h3 className="font-semibold">Consejos</h3>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <p className="whitespace-pre-wrap">{exercise.tips}</p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-sm text-gray-500 border-t pt-4">
        <p>Creado: {new Date(exercise.createdAt).toLocaleDateString()}</p>
        <p>Actualizado: {new Date(exercise.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  )
}