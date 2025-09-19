'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Check,
  X,
  Timer,
  Target,
  Weight,
  RefreshCw,
  ArrowLeft,
  Flag
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Exercise {
  id: string
  name: string
  description: string
  instructions: string
  muscleGroup: string[]
  category: string
}

interface WorkoutExercise {
  id: string
  exercise: Exercise
  sets: number
  reps?: number
  duration?: number
  weight?: number
  restTime: number
  order: number
}

interface WorkoutSession {
  currentExerciseIndex: number
  currentSet: number
  isResting: boolean
  isActive: boolean
  startTime: Date | null
  completedSets: { [key: string]: number[] } // exerciseId -> completed reps per set
  sessionNotes: string
}

export default function WorkoutStartPage() {
  const params = useParams() as { id?: string } | null
  const router = useRouter()
  const workoutId = (params?.id as string) || ''

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Workout state
  const [session, setSession] = useState<WorkoutSession>({
    currentExerciseIndex: 0,
    currentSet: 1,
    isResting: false,
    isActive: false,
    startTime: null,
    completedSets: {},
    sessionNotes: ''
  })

  // Mock workout data - en producción vendría de API
  const workout = {
    id: workoutId,
    name: 'Full Body Strength',
    description: 'Rutina completa para trabajar todos los grupos musculares',
    exercises: [
      {
        id: '1',
        exercise: {
          id: 'ex1',
          name: 'Push-ups',
          description: 'Flexiones de pecho tradicionales',
          instructions: '1. Posición de plancha con manos a la anchura de hombros\n2. Bajar el pecho hasta casi tocar el suelo\n3. Empujar hacia arriba hasta posición inicial',
          muscleGroup: ['CHEST', 'TRICEPS'],
          category: 'STRENGTH'
        },
        sets: 3,
        reps: 15,
        restTime: 60,
        order: 1
      },
      {
        id: '2',
        exercise: {
          id: 'ex2',
          name: 'Squats',
          description: 'Sentadillas básicas',
          instructions: '1. Pies a la anchura de hombros\n2. Baja como si te fueras a sentar\n3. Baja hasta que los muslos estén paralelos al suelo\n4. Sube empujando con los talones',
          muscleGroup: ['QUADS', 'GLUTES'],
          category: 'STRENGTH'
        },
        sets: 3,
        reps: 20,
        restTime: 90,
        order: 2
      },
      {
        id: '3',
        exercise: {
          id: 'ex3',
          name: 'Plank',
          description: 'Plancha isométrica',
          instructions: '1. Posición de plancha sobre antebrazos\n2. Mantén el cuerpo recto\n3. Contrae el core',
          muscleGroup: ['ABS'],
          category: 'STRENGTH'
        },
        sets: 3,
        duration: 30,
        restTime: 45,
        order: 3
      }
    ] as WorkoutExercise[]
  }

  const currentExercise = workout.exercises[session.currentExerciseIndex]
  const totalExercises = workout.exercises.length
  const workoutProgress = ((session.currentExerciseIndex) / totalExercises) * 100

  const handleTimerComplete = useCallback(() => {
    setIsTimerRunning(false)
    toast.success(session.isResting ? '¡Descanso terminado!' : '¡Tiempo completado!')
    
    // Play sound notification (in production)
    // playNotificationSound()
  }, [session.isResting])

  // Timer effects
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerRunning) {
      handleTimerComplete()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTimerRunning, timeLeft, handleTimerComplete])

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds)
    setIsTimerRunning(true)
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    setTimeLeft(0)
  }

  const startWorkout = () => {
    setSession({
      ...session,
      isActive: true,
      startTime: new Date()
    })
    toast.success('¡Entrenamiento iniciado!')
  }

  const completeSet = (actualReps?: number) => {
    const exerciseId = currentExercise.exercise.id
    const reps = actualReps || currentExercise.reps || 0
    
    // Record completed reps
    const completedSets = { ...session.completedSets }
    if (!completedSets[exerciseId]) {
      completedSets[exerciseId] = []
    }
    completedSets[exerciseId][session.currentSet - 1] = reps

    if (session.currentSet < currentExercise.sets) {
      // Start rest timer
      setSession({
        ...session,
        currentSet: session.currentSet + 1,
        isResting: true,
        completedSets
      })
      startTimer(currentExercise.restTime)
      toast.success(`Serie ${session.currentSet} completada. ¡Descansa!`)
    } else {
      // Exercise completed
      completeExercise(completedSets)
    }
  }

  const completeExercise = (completedSets: { [key: string]: number[] }) => {
    if (session.currentExerciseIndex < workout.exercises.length - 1) {
      setSession({
        ...session,
        currentExerciseIndex: session.currentExerciseIndex + 1,
        currentSet: 1,
        isResting: false,
        completedSets
      })
      toast.success(`¡${currentExercise.exercise.name} completado!`)
    } else {
      // Workout completed
      completeWorkout(completedSets)
    }
  }

  const completeWorkout = (completedSets: { [key: string]: number[] }) => {
    stopTimer()
    setSession({
      ...session,
      isActive: false,
      completedSets
    })
    
    // Save workout session (API call in production)
    toast.success('¡Entrenamiento completado! 🎉')
    
    // Redirect to completion screen
    setTimeout(() => {
      router.push(`/dashboard/workouts/${workoutId}/complete`)
    }, 2000)
  }

  const skipExercise = () => {
    if (session.currentExerciseIndex < workout.exercises.length - 1) {
      setSession({
        ...session,
        currentExerciseIndex: session.currentExerciseIndex + 1,
        currentSet: 1,
        isResting: false
      })
      stopTimer()
    }
  }

  const skipRest = () => {
    setSession({
      ...session,
      isResting: false
    })
    stopTimer()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getElapsedTime = () => {
    if (!session.startTime) return '00:00'
    const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000)
    return formatTime(elapsed)
  }

  if (!session.isActive) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="mobile-button">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="responsive-body">Volver</span>
          </Button>
        </div>

        {/* Workout Overview */}
        <Card className="mobile-card">
          <CardHeader className="text-center">
            <CardTitle className="responsive-title">{workout.name}</CardTitle>
            <CardDescription className="responsive-subheading">
              {workout.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mobile-spacing">
            {/* Stats */}
            <div className="grid grid-cols-3 mobile-gap text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{totalExercises}</div>
                <div className="responsive-caption text-gray-600">Ejercicios</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {workout.exercises.reduce((acc, ex) => acc + ex.sets, 0)}
                </div>
                <div className="responsive-caption text-gray-600">Series totales</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  ~{Math.round(workout.exercises.reduce((acc, ex) => 
                    acc + (ex.sets * (ex.duration || 45)) + (ex.sets * ex.restTime), 0
                  ) / 60)}
                </div>
                <div className="responsive-caption text-gray-600">Minutos estimados</div>
              </div>
            </div>

            {/* Exercise Preview */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="responsive-subheading font-semibold">Ejercicios en esta rutina:</h3>
              <div className="space-y-2 sm:space-y-3">
                {workout.exercises.map((ex, index) => (
                  <div key={ex.id} className="flex items-center mobile-gap p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="responsive-body font-medium truncate">{ex.exercise.name}</h4>
                      <p className="responsive-caption text-gray-600 line-clamp-2">{ex.exercise.description}</p>
                      <div className="flex gap-1 sm:gap-2 mt-1 flex-wrap">
                        {ex.exercise.muscleGroup.map((muscle) => (
                          <Badge key={muscle} variant="outline" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right responsive-caption text-gray-600 flex-shrink-0">
                      <div>{ex.sets} series</div>
                      <div>{ex.reps ? `${ex.reps} reps` : `${ex.duration}s`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center pt-4 sm:pt-6">
              <Button 
                size="lg" 
                variant="gradient"
                onClick={startWorkout}
                className="px-8 sm:px-12 py-3 sm:py-4 responsive-subheading touch-target"
              >
                <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Comenzar Entrenamiento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with progress */}
      <Card className="mobile-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="responsive-subheading font-bold truncate">{workout.name}</h2>
              <p className="responsive-caption text-gray-600">
                Ejercicio {session.currentExerciseIndex + 1} de {totalExercises} • 
                Tiempo: {getElapsedTime()}
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push('/dashboard/workouts')} className="mobile-button flex-shrink-0">
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="responsive-body">Salir</span>
            </Button>
          </div>
          <Progress value={workoutProgress} className="h-2 sm:h-3" />
        </CardContent>
      </Card>

      {session.isResting ? (
        /* Rest Screen */
        <Card className="mobile-card">
          <CardContent className="text-center py-8 sm:py-12">
            <div className="mobile-spacing">
              <div className="text-4xl sm:text-6xl animate-pulse-green">⏰</div>
              <h2 className="responsive-heading font-bold">¡Tiempo de descanso!</h2>
              <p className="responsive-body text-gray-600 px-4">
                Prepárate para la serie {session.currentSet} de {currentExercise.exercise.name}
              </p>
              
              <div className="text-5xl sm:text-8xl font-mono font-bold text-green-600 animate-countdown">
                {formatTime(timeLeft)}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center mobile-gap">
                <Button 
                  variant="outline" 
                  onClick={isTimerRunning ? pauseTimer : () => setIsTimerRunning(true)}
                  className="mobile-button"
                >
                  {isTimerRunning ? <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> : <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                  <span className="responsive-body">{isTimerRunning ? 'Pausar' : 'Reanudar'}</span>
                </Button>
                
                <Button variant="gradient" onClick={skipRest} className="mobile-button">
                  <SkipForward className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="responsive-body">Saltar Descanso</span>
                </Button>
                
                <Button variant="outline" onClick={() => startTimer(currentExercise.restTime)} className="mobile-button">
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="responsive-body">Reiniciar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Exercise Screen */
        <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap">
          {/* Exercise Info */}
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="flex items-center mobile-gap">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                  {session.currentExerciseIndex + 1}
                </div>
                <span className="responsive-subheading truncate">{currentExercise.exercise.name}</span>
              </CardTitle>
              <CardDescription className="responsive-body">
                {currentExercise.exercise.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Muscle groups */}
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {currentExercise.exercise.muscleGroup.map((muscle) => (
                  <Badge key={muscle} variant="outline" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
              </div>

              {/* Instructions */}
              <div>
                <h4 className="responsive-body font-semibold mb-2">Instrucciones:</h4>
                <div className="responsive-caption text-gray-600 space-y-1">
                  {currentExercise.exercise.instructions.split('\n').map((instruction, index) => (
                    <div key={index}>{instruction}</div>
                  ))}
                </div>
              </div>

              {/* Exercise video/gif placeholder */}
              <div className="bg-gray-100 rounded-lg p-6 sm:p-8 text-center">
                <div className="text-3xl sm:text-4xl mb-2">🎥</div>
                <p className="responsive-caption text-gray-600">Video del ejercicio</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Set */}
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="responsive-subheading">
                Serie {session.currentSet} de {currentExercise.sets}
              </CardTitle>
            </CardHeader>
            <CardContent className="mobile-spacing">
              {/* Set info */}
              <div className="grid grid-cols-2 mobile-gap">
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {currentExercise.reps || currentExercise.duration}
                  </div>
                  <div className="responsive-caption text-gray-600">
                    {currentExercise.reps ? 'Repeticiones' : 'Segundos'}
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    {formatTime(currentExercise.restTime)}
                  </div>
                  <div className="responsive-caption text-gray-600">Descanso</div>
                </div>
              </div>

              {/* Timer for timed exercises */}
              {currentExercise.duration && (
                <div className="text-center">
                  <div className="text-4xl sm:text-6xl font-mono font-bold text-green-600 mb-3 sm:mb-4">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="flex justify-center mobile-gap">
                    <Button 
                      variant="outline"
                      onClick={() => startTimer(currentExercise.duration!)}
                      disabled={isTimerRunning}
                      className="mobile-button"
                    >
                      <Timer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="responsive-body">Iniciar Timer</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={isTimerRunning ? pauseTimer : () => setIsTimerRunning(true)}
                      disabled={timeLeft === 0}
                      className="mobile-button"
                    >
                      {isTimerRunning ? <Pause className="h-3 w-3 sm:h-4 sm:w-4" /> : <Play className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Previous sets history */}
              {session.completedSets[currentExercise.exercise.id] && (
                <div>
                  <h4 className="responsive-body font-semibold mb-2">Series completadas:</h4>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {session.completedSets[currentExercise.exercise.id].map((reps, index) => (
                      <div key={index} className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded responsive-caption">
                        Serie {index + 1}: {reps} {currentExercise.reps ? 'reps' : 's'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 sm:space-y-3">
                <Button 
                  variant="gradient" 
                  size="lg" 
                  className="w-full touch-target"
                  onClick={() => completeSet()}
                >
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="responsive-subheading">Completar Serie</span>
                </Button>
                
                <div className="grid grid-cols-2 mobile-gap">
                  <Button variant="outline" onClick={skipExercise} className="mobile-button">
                    <SkipForward className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="responsive-body">Saltar Ejercicio</span>
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard/workouts')} className="mobile-button">
                    <Flag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="responsive-body">Terminar Rutina</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
