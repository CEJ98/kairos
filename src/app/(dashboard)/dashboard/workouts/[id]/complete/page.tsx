'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
import { logger } from '@/lib/logger'
  Trophy,
  Clock,
  Target,
  Flame,
  Star,
  Share2,
  Home,
  RotateCcw,
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function WorkoutCompletePage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string

  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  // Mock workout session data - en producción vendría de API
  const sessionData = {
    workoutName: 'Full Body Strength',
    duration: '42:35', // 42 minutos 35 segundos
    exercisesCompleted: 8,
    totalExercises: 8,
    setsCompleted: 24,
    totalSets: 24,
    estimatedCalories: 320,
    personalRecords: 2, // nuevos PRs
    completionRate: 100,
    averageRestTime: 65, // segundos
    exercises: [
      {
        name: 'Push-ups',
        setsCompleted: 3,
        repsCompleted: [15, 12, 10],
        targetReps: [15, 15, 15],
        isPersonalRecord: true
      },
      {
        name: 'Squats',
        setsCompleted: 3,
        repsCompleted: [20, 20, 18],
        targetReps: [20, 20, 20],
        isPersonalRecord: false
      },
      {
        name: 'Plank',
        setsCompleted: 3,
        duration: [35, 40, 32], // segundos
        targetDuration: [30, 30, 30],
        isPersonalRecord: true
      }
    ],
    streakDays: 6,
    weeklyGoalProgress: 4, // de 5 entrenamientos
  }

  const achievements = [
    {
      icon: '🔥',
      title: 'Racha de 6 días',
      description: 'Mantén el ritmo!'
    },
    {
      icon: '💪',
      title: '2 Records Personales',
      description: 'Push-ups y Plank'
    },
    {
      icon: '⚡',
      title: 'Entrenamiento Perfecto',
      description: '100% completado'
    }
  ]

  const handleSaveSession = async () => {
    try {
      // En producción: guardar datos de la sesión en API
      const sessionPayload = {
        workoutId,
        rating,
        notes,
        ...sessionData
      }

      logger.debug('Saving session:', sessionPayload)
      toast.success('Sesión guardada exitosamente')
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      toast.error('Error al guardar la sesión')
    }
  }

  const handleShare = async () => {
    const shareText = `¡Acabo de completar "${sessionData.workoutName}" en ${sessionData.duration}! 💪\n\n${sessionData.personalRecords} records personales 🏆\nRacha: ${sessionData.streakDays} días 🔥\n\n#KairosFitness #Fitness`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Entrenamiento completado - Kairos Fitness',
          text: shareText,
          url: window.location.origin
        })
      } catch (error) {
        logger.debug('Error sharing:', error)
      }
    } else {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(shareText)
      toast.success('¡Texto copiado al portapapeles!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto mobile-spacing mobile-gap">
      {/* Celebration Header */}
      <div className="text-center mobile-gap">
        <div className="text-6xl md:text-8xl animate-bounce">🎉</div>
        <h1 className="responsive-heading font-bold text-gray-900">
          ¡Entrenamiento Completado!
        </h1>
        <p className="responsive-subheading text-gray-600">
          Excelente trabajo en &quot;{sessionData.workoutName}&quot;
        </p>
      </div>

      {/* Main Stats */}
      <Card className="mobile-card">
        <CardContent className="mobile-spacing">
          <div className="grid grid-cols-2 md:grid-cols-4 mobile-gap">
            <div className="text-center touch-target">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full mx-auto mb-2 md:mb-3">
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
              <div className="responsive-title font-bold text-gray-900">{sessionData.duration}</div>
              <div className="responsive-caption text-gray-600">Duración</div>
            </div>

            <div className="text-center touch-target">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full mx-auto mb-2 md:mb-3">
                <Target className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
              <div className="responsive-title font-bold text-gray-900">
                {sessionData.exercisesCompleted}/{sessionData.totalExercises}
              </div>
              <div className="responsive-caption text-gray-600">Ejercicios</div>
            </div>

            <div className="text-center touch-target">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-full mx-auto mb-2 md:mb-3">
                <Flame className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
              </div>
              <div className="responsive-title font-bold text-gray-900">{sessionData.estimatedCalories}</div>
              <div className="responsive-caption text-gray-600">Calorías</div>
            </div>

            <div className="text-center touch-target">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full mx-auto mb-2 md:mb-3">
                <Trophy className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              </div>
              <div className="responsive-title font-bold text-gray-900">{sessionData.personalRecords}</div>
              <div className="responsive-caption text-gray-600">Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="responsive-subheading">Resumen de Progreso</CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing mobile-gap">
          <div className="flex justify-between items-center">
            <span className="responsive-body">Tasa de completación</span>
            <span className="responsive-body font-semibold">{sessionData.completionRate}%</span>
          </div>
          <Progress value={sessionData.completionRate} className="h-2 md:h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 mobile-gap mt-4 md:mt-6">
            <div className="mobile-spacing bg-green-50 rounded-lg touch-target">
              <div className="flex items-center mobile-gap-x">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                <div>
                  <div className="responsive-body font-semibold text-green-800">Meta Semanal</div>
                  <div className="responsive-caption text-green-600">
                    {sessionData.weeklyGoalProgress}/5 entrenamientos
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mobile-spacing bg-orange-50 rounded-lg touch-target">
              <div className="flex items-center mobile-gap-x">
                <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                <div>
                  <div className="responsive-body font-semibold text-orange-800">Racha Actual</div>
                  <div className="responsive-caption text-orange-600">
                    {sessionData.streakDays} días consecutivos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Breakdown */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="responsive-subheading">Detalles por Ejercicio</CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing">
          <div className="mobile-gap">
            {sessionData.exercises.map((exercise, index) => (
              <div key={index} className="border rounded-lg mobile-spacing touch-target">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <h4 className="responsive-body font-semibold flex items-center mobile-gap-x">
                    {exercise.name}
                    {exercise.isPersonalRecord && (
                      <Badge variant="warning" className="responsive-caption">
                        <Trophy className="h-3 w-3 mr-1" />
                        PR
                      </Badge>
                    )}
                  </h4>
                  <Badge variant="success" className="responsive-caption">Completado</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 mobile-gap responsive-caption">
                  <div>
                    <span className="text-gray-600">Series: </span>
                    <span className="font-medium">{exercise.setsCompleted}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {exercise.repsCompleted ? 'Reps: ' : 'Tiempo: '}
                    </span>
                    <span className="font-medium">
                      {exercise.repsCompleted 
                        ? exercise.repsCompleted.join(', ')
                        : exercise.duration?.join('s, ') + 's'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Meta: </span>
                    <span className="font-medium">
                      {exercise.targetReps 
                        ? exercise.targetReps.join(', ')
                        : exercise.targetDuration?.join('s, ') + 's'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="responsive-subheading">Logros Desbloqueados</CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing">
          <div className="grid grid-cols-1 md:grid-cols-3 mobile-gap">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center mobile-spacing bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 touch-target">
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">{achievement.icon}</div>
                <h4 className="responsive-body font-semibold text-yellow-800 mb-1">{achievement.title}</h4>
                <p className="responsive-caption text-yellow-700">{achievement.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating and Notes */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="responsive-subheading">¿Cómo te sentiste?</CardTitle>
          <CardDescription className="responsive-caption">
            Tu feedback nos ayuda a mejorar tus entrenamientos
          </CardDescription>
        </CardHeader>
        <CardContent className="mobile-spacing mobile-gap">
          {/* Star rating */}
          <div>
            <label className="block responsive-body font-medium mb-2">
              Califica este entrenamiento:
            </label>
            <div className="flex mobile-gap-x">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors touch-target ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star className="h-6 w-6 md:h-8 md:w-8 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block responsive-body font-medium mb-2">
              Notas (opcional):
            </label>
            <textarea
              className="w-full mobile-spacing border border-gray-300 rounded-md resize-none responsive-body"
              rows={3}
              placeholder="¿Cómo te sentiste durante el entrenamiento? ¿Algo que quieras recordar para la próxima vez?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 mobile-gap">
        <Button 
          variant="gradient" 
          size="lg" 
          onClick={handleSaveSession}
          className="md:col-span-2 mobile-button touch-target"
        >
          <Trophy className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          <span className="responsive-body">Guardar y Continuar</span>
        </Button>

        <Button variant="outline" size="lg" onClick={handleShare} className="mobile-button touch-target">
          <Share2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          <span className="responsive-body">Compartir</span>
        </Button>

        <Link href={`/dashboard/workouts/${workoutId}/start`}>
          <Button variant="outline" size="lg" className="w-full mobile-button touch-target">
            <RotateCcw className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            <span className="responsive-body">Repetir</span>
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="responsive-subheading">¿Qué sigue?</CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing">
          <div className="grid grid-cols-1 md:grid-cols-3 mobile-gap">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-16 md:h-20 flex-col mobile-gap touch-target">
                <Home className="h-5 w-5 md:h-6 md:w-6" />
                <span className="responsive-caption">Ir al Dashboard</span>
              </Button>
            </Link>

            <Link href="/dashboard/progress">
              <Button variant="outline" className="w-full h-16 md:h-20 flex-col mobile-gap touch-target">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                <span className="responsive-caption">Ver Progreso</span>
              </Button>
            </Link>

            <Link href="/dashboard/workouts">
              <Button variant="outline" className="w-full h-16 md:h-20 flex-col mobile-gap touch-target">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                <span className="responsive-caption">Próximo Entrenamiento</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}