'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown,
  Target, 
  Calendar,
  Plus,
  Flame,
  Clock,
  Activity,
  Heart,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Zap
} from 'lucide-react'
import Link from 'next/link'

export default function MeasurementsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')

  // Mock data - en producción vendría de APIs
  const healthScore = {
    current: 6.1,
    max: 10,
    status: 'Good!',
    improvement: '+0.3',
    comparison: 'You are healthier than 75% people'
  }

  const metrics = {
    calories: {
      current: 1290,
      target: 2340,
      unit: 'Kcal',
      status: 'Great physical activity',
      icon: Flame,
      color: 'orange'
    },
    weight: {
      current: 198,
      unit: 'lbs',
      height: '6\'0"',
      status: 'Healthy weight is 72-82kg',
      icon: User,
      color: 'green'
    },
    heartRate: {
      current: 88,
      unit: 'bpm',
      status: 'Normal',
      change: '+0.6%',
      icon: Heart,
      color: 'red'
    },
    steps: {
      current: 6430,
      target: 10000,
      unit: 'steps',
      status: 'Keep it up!',
      icon: Activity,
      color: 'blue'
    }
  }

  const activities = [
    { name: 'Steps', value: 6430, target: 10000, color: 'blue' },
    { name: 'Kcal', value: 1220, target: 2000, color: 'orange' },
    { name: 'Distance', value: 7233, unit: 'm', color: 'green' },
    { name: 'Points', value: 202, color: 'purple' }
  ]

  const weeklyData = [
    { day: 'Mon', steps: 8500, calories: 1800 },
    { day: 'Tue', steps: 7200, calories: 1600 },
    { day: 'Wed', steps: 9100, calories: 1900 },
    { day: 'Thu', steps: 6800, calories: 1500 },
    { day: 'Fri', steps: 9500, calories: 2000 },
    { day: 'Sat', steps: 7800, calories: 1700 },
    { day: 'Sun', steps: 6430, calories: 1220 }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      orange: 'from-orange-500 to-red-500',
      green: 'from-green-500 to-emerald-500',
      red: 'from-red-500 to-pink-500',
      blue: 'from-blue-500 to-sky-500',
      purple: 'from-purple-500 to-violet-500'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getProgressColor = (color: string) => {
    const colors = {
      orange: 'bg-orange-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Progreso</h1>
          <p className="text-gray-600 mt-1">Seguimiento de tu salud y fitness</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Medición
          </Button>
        </div>
      </div>

      {/* Health Score Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{healthScore.current}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    {healthScore.improvement}
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{healthScore.status}</h2>
                  <p className="text-gray-600">{healthScore.comparison}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Health Score</div>
              <div className="text-2xl font-bold text-blue-600">{healthScore.current}/{healthScore.max}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calories Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500 rounded-2xl">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-orange-700">Calories</div>
                  <div className="text-xs text-orange-600">Great physical activity</div>
                </div>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-300">1d</Badge>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-orange-900">
                {metrics.calories.current}/{metrics.calories.target}{metrics.calories.unit}
              </div>
              <Progress 
                value={(metrics.calories.current / metrics.calories.target) * 100} 
                className="h-2 bg-orange-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Weight Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-2xl">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-green-700">Weight</div>
                  <div className="text-xs text-green-600">Healthy weight is 72-82kg</div>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-300">6&apos;0&quot;</Badge>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-green-900">
                {metrics.weight.current}{metrics.weight.unit}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span>2.3 lbs down this week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heart Rate Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Heart Rate</CardTitle>
                <CardDescription>• Normal</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                24h
              </Button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Heart visualization */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white fill-current" />
                  </div>
                </div>
                {/* Heartbeat lines */}
                <div className="absolute top-4 left-4 w-8 h-2 bg-red-300 rounded-full opacity-60"></div>
                <div className="absolute top-6 left-6 w-6 h-2 bg-red-400 rounded-full opacity-80"></div>
                <div className="absolute top-8 left-4 w-8 h-2 bg-red-500 rounded-full"></div>
                <div className="absolute top-10 left-6 w-6 h-2 bg-red-400 rounded-full opacity-80"></div>
                <div className="absolute top-12 left-4 w-8 h-2 bg-red-300 rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">{metrics.heartRate.change}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics.heartRate.current} bpm</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activities</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">21 May</span>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {activities.slice(0, 2).map((activity, index) => (
              <div key={activity.name} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  {activity.name === 'Steps' && <Activity className="h-6 w-6 text-gray-600" />}
                  {activity.name === 'Kcal' && <Flame className="h-6 w-6 text-gray-600" />}
                </div>
                <div className="text-2xl font-bold text-gray-900">{activity.value.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{activity.name}</div>
              </div>
            ))}
          </div>

          {/* Weekly Chart */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Weekly Progress</span>
              <div className="flex gap-4">
                <span className="text-green-600">+72%</span>
                <span className="text-orange-600">+65%</span>
              </div>
            </div>
            <div className="flex items-end justify-between h-32 gap-2">
              {weeklyData.map((day, index) => (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t-lg relative">
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(day.steps / 10000) * 100}%` }}
                    ></div>
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg"
                      style={{ height: `${(day.calories / 2000) * 50}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activities.slice(2).map((activity) => (
          <Card key={activity.name} className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{activity.value}</div>
              <div className="text-sm text-gray-600">{activity.name}</div>
              {activity.unit && <div className="text-xs text-gray-500">{activity.unit}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}