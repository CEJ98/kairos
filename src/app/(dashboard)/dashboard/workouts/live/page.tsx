'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft,
  Clock,
  Play,
  Pause,
  Square,
  Flame,
  Heart,
  Zap,
  Target,
  CheckCircle,
  RotateCcw,
  Home,
  Activity,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export default function LiveWorkoutPage() {
  const [isActive, setIsActive] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Mock data - en producción vendría de APIs
  const workout = {
    id: '1',
    name: 'Cardio Blast',
    type: 'CARDIO',
    totalDuration: 1800, // 30 minutos
    currentExercise: {
      name: 'High Knees',
      duration: 45,
      description: 'Lift your knees high while running in place',
      calories: 15,
      heartRate: 118
    }
  }

  const totalCalories = 112
  const currentHeartRate = 118

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isActive, isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    setIsActive(false)
    setIsPaused(false)
    setTimeElapsed(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {workout.type} {formatTime(timeElapsed)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Exercise Visualization */}
      <div className="px-6 py-6">
        <Card className="bg-white border-0 shadow-sm mb-6">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Exercise Image with Motion Lines */}
              <div className="relative mb-6">
                <div className="w-64 h-64 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Grid Pattern Background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                      {[...Array(64)].map((_, i) => (
                        <div key={i} className="border border-blue-200"></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Exercise Figure */}
                  <div className="relative z-10">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <span className="text-2xl">🏃‍♀️</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Motion Lines */}
                  <div className="absolute inset-0 z-20">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <div className="w-8 h-0.5 bg-orange-400"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-8 h-0.5 bg-orange-400"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercise Info */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {workout.currentExercise.name}
              </h2>
              <p className="text-gray-600 mb-4">
                {workout.currentExercise.description}
              </p>
              
              {/* Instruction */}
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-700">
                  Press STOP to Finish Exercise
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="p-2 bg-orange-100 rounded-full w-fit mx-auto mb-2">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">{totalCalories}</div>
              <div className="text-xs text-gray-600">kcal</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="p-2 bg-red-100 rounded-full w-fit mx-auto mb-2">
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">{currentHeartRate}</div>
              <div className="text-xs text-gray-600">bpm</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="p-2 bg-blue-100 rounded-full w-fit mx-auto mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">{formatTime(timeElapsed)}</div>
              <div className="text-xs text-gray-600">time</div>
            </CardContent>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <Button 
              onClick={handleStart}
              className="w-32 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full"
            >
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : (
            <>
              <Button 
                onClick={handlePause}
                variant="outline"
                className="w-20 h-12 rounded-full"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
              
              <Button 
                onClick={handleStop}
                className="w-32 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              >
                <Square className="w-5 h-5 mr-2" />
                STOP
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Home className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500">Home</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500">Dashboard</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500">Bookmarks</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500">Notifications</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500">Settings</span>
          </div>
        </div>
      </div>

      {/* Spacer para la navegación inferior */}
      <div className="h-20"></div>
    </div>
  )
}