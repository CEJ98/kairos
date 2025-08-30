'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Home, 
  Calendar, 
  Activity, 
  User, 
  Settings, 
  Play, 
  Flame, 
  Zap, 
  Target, 
  TrendingUp, 
  Plus,
  Heart,
  Scale,
  Ruler,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Footprints
} from "lucide-react"
import Link from "next/link"

export default function ActivitiesPage() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long' 
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/api/placeholder/40/40" alt="Fred Nicklson" />
              <AvatarFallback>FN</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Hello, Fred</h1>
            </div>
          </div>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Activities</h2>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-lg font-semibold text-gray-900">
            {formatDate(currentDate)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-1 gap-4">
          {/* Steps */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Footprints className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">Steps</div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">6,430</div>
                  <div className="flex items-center gap-2">
                    <Progress value={64.3} className="flex-1 h-2" />
                    <span className="text-sm text-green-600 font-medium">+72%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calories */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Flame className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">Kcal</div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">1,220</div>
                  <div className="flex items-center gap-2">
                    <Progress value={65} className="flex-1 h-2" />
                    <span className="text-sm text-green-600 font-medium">+65%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-blue-500 font-medium">Dashboard</span>
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
