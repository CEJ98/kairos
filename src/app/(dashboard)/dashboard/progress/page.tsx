'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp,
  Calendar,
  Trophy,
  Target,
  Activity,
  Weight,
  Clock,
  Flame,
  BarChart3,
  Plus,
  Download,
  Filter,
  Eye,
  Award,
  Zap
} from 'lucide-react'
import Link from 'next/link'

export default function ProgressPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedMetric, setSelectedMetric] = useState('workouts')

  // Mock data - en producción vendría de APIs
  const progressData = {
    overview: {
      totalWorkouts: 42,
      totalDuration: 1680, // minutos
      caloriesBurned: 8400,
      currentStreak: 7,
      longestStreak: 14,
      averageRating: 4.3
    },
    goals: {
      weeklyWorkouts: { current: 4, target: 5, percentage: 80 },
      monthlyCalories: { current: 2100, target: 2500, percentage: 84 },
      weightLoss: { current: 3.2, target: 5.0, percentage: 64, unit: 'kg' },
      strength: { current: 85, target: 100, percentage: 85, unit: 'kg' }
    },
    recentWorkouts: [
      {
        id: '1',
        name: 'Full Body Strength',
        date: '2024-01-20',
        duration: 45,
        calories: 320,
        rating: 5,
        exercises: 8,
        personalRecords: 2
      },
      {
        id: '2',
        name: 'HIIT Cardio Blast', 
        date: '2024-01-19',
        duration: 30,
        calories: 280,
        rating: 4,
        exercises: 6,
        personalRecords: 0
      },
      {
        id: '3',
        name: 'Upper Body Focus',
        date: '2024-01-18',
        duration: 50,
        calories: 350,
        rating: 5,
        exercises: 10,
        personalRecords: 1
      }
    ],
    personalRecords: [
      {
        exercise: 'Push-ups',
        record: 25,
        previousRecord: 20,
        improvement: 25,
        date: '2024-01-20',
        type: 'reps'
      },
      {
        exercise: 'Plank',
        record: 120,
        previousRecord: 90,
        improvement: 33,
        date: '2024-01-20',
        type: 'duration'
      },
      {
        exercise: 'Squats',
        record: 30,
        previousRecord: 25,
        improvement: 20,
        date: '2024-01-18',
        type: 'reps'
      }
    ],
    bodyMeasurements: [
      {
        date: '2024-01-20',
        weight: 72.5,
        bodyFat: 18.2,
        muscle: 62.8,
        measurements: {
          chest: 98,
          waist: 82,
          arms: 35,
          thighs: 58
        }
      },
      {
        date: '2024-01-01',
        weight: 75.7,
        bodyFat: 20.1,
        muscle: 60.2,
        measurements: {
          chest: 100,
          waist: 85,
          arms: 34,
          thighs: 60
        }
      }
    ],
    weeklyStats: [
      { week: 'Sem 1', workouts: 3, duration: 135, calories: 840 },
      { week: 'Sem 2', workouts: 4, duration: 180, calories: 1120 },
      { week: 'Sem 3', workouts: 5, duration: 225, calories: 1400 },
      { week: 'Sem 4', workouts: 4, duration: 200, calories: 1240 }
    ]
  }

  const periods = [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Año' }
  ]

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const latestMeasurement = progressData.bodyMeasurements[0]
  const previousMeasurement = progressData.bodyMeasurements[1]
  
  const weightChange = latestMeasurement.weight - previousMeasurement.weight
  const bodyFatChange = latestMeasurement.bodyFat - previousMeasurement.bodyFat
  const muscleChange = latestMeasurement.muscle - previousMeasurement.muscle

  return (
    <div className="mobile-spacing">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap">
        <div className="min-w-0">
          <h1 className="responsive-heading font-bold text-gray-900">Mi Progreso</h1>
          <p className="responsive-body text-gray-600 mt-1">
            Analiza tu evolución y mantente motivado
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row mobile-gap">
          <Button variant="outline" className="mobile-button">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="responsive-body">Exportar</span>
          </Button>
          <Link href="/dashboard/progress/measurements">
            <Button variant="gradient" className="mobile-button">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="responsive-body">Nueva Medición</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Period Selector */}
      <Card className="mobile-card">
        <CardContent className="mobile-spacing">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap">
            <div className="flex gap-2 overflow-x-auto">
              {periods.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                  className="mobile-button-sm responsive-caption whitespace-nowrap"
                >
                  {period.label}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mobile-button-sm responsive-caption">
              <Filter className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mobile-gap">
        <Card className="mobile-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-2" />
            <div className="responsive-subheading font-bold text-gray-900">{progressData.overview.totalWorkouts}</div>
            <p className="responsive-caption text-gray-600">Entrenamientos</p>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mx-auto mb-2" />
            <div className="responsive-subheading font-bold text-gray-900">{Math.round(progressData.overview.totalDuration / 60)}h</div>
            <p className="responsive-caption text-gray-600">Tiempo total</p>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mx-auto mb-2" />
            <div className="responsive-subheading font-bold text-gray-900">{progressData.overview.caloriesBurned.toLocaleString()}</div>
            <p className="responsive-caption text-gray-600">Calorías</p>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-2" />
            <div className="responsive-subheading font-bold text-gray-900">{progressData.overview.currentStreak}</div>
            <p className="responsive-caption text-gray-600">Racha actual</p>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mx-auto mb-2" />
            <div className="responsive-subheading font-bold text-gray-900">{progressData.personalRecords.length}</div>
            <p className="responsive-caption text-gray-600">Records</p>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 mx-auto mb-2" />
            <div className="responsive-subheading font-bold text-gray-900">{progressData.overview.averageRating}</div>
            <p className="responsive-caption text-gray-600">Rating prom.</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="flex items-center mobile-gap responsive-subheading">
            <Target className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            Progreso de Objetivos
          </CardTitle>
          <CardDescription className="responsive-caption">
            Tu avance hacia las metas establecidas
          </CardDescription>
        </CardHeader>
        <CardContent className="mobile-spacing-x mobile-gap-y">
          <div className="grid grid-cols-1 md:grid-cols-2 mobile-gap">
            <div className="mobile-gap-y">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="responsive-body font-medium">Entrenamientos Semanales</span>
                  <span className="responsive-body text-gray-600">
                    {progressData.goals.weeklyWorkouts.current}/{progressData.goals.weeklyWorkouts.target}
                  </span>
                </div>
                <Progress value={progressData.goals.weeklyWorkouts.percentage} className="h-2 md:h-3" />
                <p className="responsive-caption text-gray-500 mt-1">
                  {progressData.goals.weeklyWorkouts.percentage}% completado
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="responsive-body font-medium">Calorías Mensuales</span>
                  <span className="responsive-body text-gray-600">
                    {progressData.goals.monthlyCalories.current}/{progressData.goals.monthlyCalories.target}
                  </span>
                </div>
                <Progress value={progressData.goals.monthlyCalories.percentage} className="h-2 md:h-3" />
                <p className="responsive-caption text-gray-500 mt-1">
                  {progressData.goals.monthlyCalories.percentage}% completado
                </p>
              </div>
            </div>

            <div className="mobile-gap-y">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="responsive-body font-medium">Pérdida de Peso</span>
                  <span className="responsive-body text-gray-600">
                    {progressData.goals.weightLoss.current}/{progressData.goals.weightLoss.target} {progressData.goals.weightLoss.unit}
                  </span>
                </div>
                <Progress value={progressData.goals.weightLoss.percentage} className="h-2 md:h-3" />
                <p className="responsive-caption text-gray-500 mt-1">
                  {progressData.goals.weightLoss.percentage}% completado
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="responsive-body font-medium">Fuerza (Press Banca)</span>
                  <span className="responsive-body text-gray-600">
                    {progressData.goals.strength.current}/{progressData.goals.strength.target} {progressData.goals.strength.unit}
                  </span>
                </div>
                <Progress value={progressData.goals.strength.percentage} className="h-2 md:h-3" />
                <p className="responsive-caption text-gray-500 mt-1">
                  {progressData.goals.strength.percentage}% completado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap">
        {/* Recent Workouts */}
        <Card className="mobile-card">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap">
              <CardTitle className="flex items-center gap-2 responsive-subheading">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Entrenamientos Recientes
              </CardTitle>
              <Link href="/dashboard/workouts">
                <Button variant="ghost" size="sm" className="mobile-button">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="responsive-body">Ver todos</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="mobile-spacing p-4 sm:p-6">
            {progressData.recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg touch-target">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center mobile-gap mb-1">
                    <h4 className="responsive-body font-medium truncate">{workout.name}</h4>
                    {workout.personalRecords > 0 && (
                      <Badge variant="warning" className="responsive-caption">
                        <Trophy className="h-3 w-3 mr-1" />
                        {workout.personalRecords} PR
                      </Badge>
                    )}
                  </div>
                  <p className="responsive-caption text-gray-600">{workout.date}</p>
                  <div className="flex flex-wrap items-center mobile-gap mt-2 responsive-caption text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {workout.duration}min
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {workout.calories}cal
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {workout.exercises} ejercicios
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {[1,2,3,4,5].map((star) => (
                    <div
                      key={star}
                      className={`w-3 h-3 ${
                        star <= workout.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card className="mobile-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 responsive-subheading">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              Records Personales
            </CardTitle>
            <CardDescription className="responsive-body">
              Tus mejores marcas recientes
            </CardDescription>
          </CardHeader>
          <CardContent className="mobile-spacing p-4 sm:p-6">
            {progressData.personalRecords.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg touch-target">
                <div className="min-w-0">
                  <h4 className="responsive-body font-medium truncate">{record.exercise}</h4>
                  <p className="responsive-caption text-gray-600">{record.date}</p>
                  <div className="flex items-center mobile-gap mt-1">
                    <span className="responsive-body font-bold text-green-600">
                      {record.record} {record.type === 'duration' ? 's' : record.type}
                    </span>
                    <Badge variant="success" className="responsive-caption">
                      +{record.improvement}%
                    </Badge>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="responsive-caption text-gray-500">Anterior</p>
                  <p className="responsive-body text-gray-700">
                    {record.previousRecord} {record.type === 'duration' ? 's' : record.type}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Body Measurements */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="flex items-center mobile-gap responsive-subheading">
            <Weight className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            Mediciones Corporales
          </CardTitle>
          <CardDescription className="responsive-caption">
            Evolución de tu composición corporal
          </CardDescription>
        </CardHeader>
        <CardContent className="mobile-spacing-x mobile-gap-y">
          <div className="grid grid-cols-1 md:grid-cols-3 mobile-gap">
            {/* Weight Progress */}
            <div className="text-center mobile-spacing bg-blue-50 rounded-lg">
              <Weight className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mx-auto mb-3" />
              <div className="responsive-title font-bold text-gray-900 mb-1">
                {latestMeasurement.weight} kg
              </div>
              <div className={`responsive-caption ${weightChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </div>
              <p className="responsive-caption text-gray-600 mt-2">desde el mes pasado</p>
            </div>

            {/* Body Fat */}
            <div className="text-center mobile-spacing bg-orange-50 rounded-lg">
              <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-orange-600 mx-auto mb-3" />
              <div className="responsive-title font-bold text-gray-900 mb-1">
                {latestMeasurement.bodyFat}%
              </div>
              <div className={`responsive-caption ${bodyFatChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {bodyFatChange > 0 ? '+' : ''}{bodyFatChange.toFixed(1)}%
              </div>
              <p className="responsive-caption text-gray-600 mt-2">grasa corporal</p>
            </div>

            {/* Muscle Mass */}
            <div className="text-center mobile-spacing bg-green-50 rounded-lg">
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-green-600 mx-auto mb-3" />
              <div className="responsive-title font-bold text-gray-900 mb-1">
                {latestMeasurement.muscle}%
              </div>
              <div className={`responsive-caption ${muscleChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {muscleChange > 0 ? '+' : ''}{muscleChange.toFixed(1)}%
              </div>
              <p className="responsive-caption text-gray-600 mt-2">masa muscular</p>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full responsive-caption">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 responsive-caption font-medium">Medida</th>
                  <th className="text-right py-2 responsive-caption font-medium">Actual</th>
                  <th className="text-right py-2 responsive-caption font-medium">Anterior</th>
                  <th className="text-right py-2 responsive-caption font-medium">Cambio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 responsive-caption">Pecho</td>
                  <td className="text-right py-2 responsive-caption">{latestMeasurement.measurements.chest} cm</td>
                  <td className="text-right py-2 responsive-caption">{previousMeasurement.measurements.chest} cm</td>
                  <td className="text-right py-2 responsive-caption text-green-600">
                    {latestMeasurement.measurements.chest - previousMeasurement.measurements.chest} cm
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 responsive-caption">Cintura</td>
                  <td className="text-right py-2 responsive-caption">{latestMeasurement.measurements.waist} cm</td>
                  <td className="text-right py-2 responsive-caption">{previousMeasurement.measurements.waist} cm</td>
                  <td className="text-right py-2 responsive-caption text-green-600">
                    {latestMeasurement.measurements.waist - previousMeasurement.measurements.waist} cm
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 responsive-caption">Brazos</td>
                  <td className="text-right py-2 responsive-caption">{latestMeasurement.measurements.arms} cm</td>
                  <td className="text-right py-2 responsive-caption">{previousMeasurement.measurements.arms} cm</td>
                  <td className="text-right py-2 responsive-caption text-green-600">
                    +{latestMeasurement.measurements.arms - previousMeasurement.measurements.arms} cm
                  </td>
                </tr>
                <tr>
                  <td className="py-2 responsive-caption">Muslos</td>
                  <td className="text-right py-2 responsive-caption">{latestMeasurement.measurements.thighs} cm</td>
                  <td className="text-right py-2 responsive-caption">{previousMeasurement.measurements.thighs} cm</td>
                  <td className="text-right py-2 responsive-caption text-green-600">
                    {latestMeasurement.measurements.thighs - previousMeasurement.measurements.thighs} cm
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Chart */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="flex items-center mobile-gap responsive-subheading">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            Tendencia Semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing-x">
          <div className="grid grid-cols-2 md:grid-cols-4 mobile-gap">
            {progressData.weeklyStats.map((week, index) => (
              <div key={index} className="text-center mobile-spacing bg-gray-50 rounded-lg">
                <h4 className="font-semibold responsive-caption mb-3">{week.week}</h4>
                <div className="space-y-2 responsive-caption">
                  <div className="flex justify-between">
                    <span>Entrenamientos:</span>
                    <span className="font-medium">{week.workouts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duración:</span>
                    <span className="font-medium">{week.duration}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calorías:</span>
                    <span className="font-medium">{week.calories}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}