'use client'

import { useState, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/lazy-loader"
import { lazy } from 'react'

// Lazy components con imports estáticos
const ProgressChart = lazy(() => import('@/components/dashboard/progress-chart'))
const WeeklyStats = lazy(() => import('@/components/dashboard/weekly-stats'))
const RecentActivity = lazy(() => import('@/components/dashboard/recent-activity'))
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
	TrendingDown,
	Plus,
	Heart,
	Scale,
	Ruler,
	ChevronRight,
	ArrowUpRight,
	ChevronLeft,
	Footprints,
	CheckCircle,
	Clock,
	Dumbbell,
	BarChart3,
	Bookmark,
	ArrowLeft,
	MoreHorizontal,
	Timer,
	Pause,
	RefreshCw,
	Loader2
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useDashboardData } from "@/hooks/useDashboardData"

// Los componentes lazy ya están definidos arriba

export default function FitnessDashboard() {
	const { data: session } = useSession()
	const { stats, weeklyProgress, recentRecords, isLoading, error, refresh } = useDashboardData()

	const formatDate = () => {
		const today = new Date()
		const options: Intl.DateTimeFormatOptions = { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		}
		return today.toLocaleDateString('es-ES', options)
	}

	const getUserInitials = (name?: string | null) => {
		if (!name) return 'U'
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
	}

	const getWeeklyScore = () => {
		const score = Math.min(10, (stats.completedWorkouts / 5) * 10)
		return score.toFixed(1)
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
					<span className="text-gray-600">Cargando dashboard...</span>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">Error: {error}</p>
					<Button onClick={refresh} variant="outline">
						<RefreshCw className="w-4 h-4 mr-2" />
						Reintentar
					</Button>
				</div>
			</div>
		)
	}

	return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20 p-4 sm:p-6 space-y-6">
				{/* Enhanced Header */}
				<div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="relative">
								<Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-4 ring-blue-100 shadow-lg">
									<AvatarImage src={session?.user?.image || "/fitness-user-avatar.png"} alt={session?.user?.name || "Usuario"} />
									<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">{getUserInitials(session?.user?.name)}</AvatarFallback>
								</Avatar>
								<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
							</div>
							<div>
								<h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">¡Hola, {session?.user?.name?.split(' ')[0] || 'Usuario'}! 👋</h1>
								<p className="text-sm sm:text-base text-gray-600 font-medium">{formatDate()}</p>
								<div className="flex items-center gap-2 mt-1">
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<span className="text-xs text-green-600 font-medium">En línea</span>
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" className="hover:bg-blue-50 transition-colors" onClick={refresh}>
								<RefreshCw className="w-4 h-4 text-gray-600" />
							</Button>
							<Link href="/dashboard/settings">
								<Button variant="ghost" size="sm" className="hover:bg-blue-50 transition-colors">
									<Settings className="w-4 h-4 text-gray-600" />
								</Button>
							</Link>
						</div>
					</div>
				</div>

			{/* Enhanced Weekly Overview */}
			<Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
				<CardContent className="p-6">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
								<BarChart3 className="w-5 h-5 text-white" />
							</div>
							<h2 className="text-lg sm:text-xl font-bold text-white">Resumen Semanal</h2>
						</div>
						<Badge 
							variant="secondary" 
							className={`border-0 text-xs sm:text-sm font-semibold px-3 py-1 ${
								parseFloat(getWeeklyScore()) >= 7 ? 'bg-green-100 text-green-700' :
								parseFloat(getWeeklyScore()) >= 5 ? 'bg-yellow-100 text-yellow-700' :
								'bg-red-100 text-red-700'
							}`}
						>
							{getWeeklyScore()}/10 {
								parseFloat(getWeeklyScore()) >= 7 ? '🔥 ¡Excelente!' :
								parseFloat(getWeeklyScore()) >= 5 ? '💪 ¡Bien!' :
								'📈 Puedes mejorar'
							}
						</Badge>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
							<div className="w-8 h-8 bg-blue-400/30 rounded-lg flex items-center justify-center mx-auto mb-2">
								<Footprints className="w-4 h-4 text-white" />
							</div>
							<div className="text-xl sm:text-2xl font-bold text-white">{stats.weeklyDistance.toLocaleString()}</div>
							<div className="text-xs sm:text-sm text-white/80">Distancia (km)</div>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
							<div className="w-8 h-8 bg-orange-400/30 rounded-lg flex items-center justify-center mx-auto mb-2">
								<Flame className="w-4 h-4 text-white" />
							</div>
							<div className="text-xl sm:text-2xl font-bold text-white">{stats.weeklyCalories.toLocaleString()}</div>
							<div className="text-xs sm:text-sm text-white/80">Calorías</div>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
							<div className="w-8 h-8 bg-green-400/30 rounded-lg flex items-center justify-center mx-auto mb-2">
								<Target className="w-4 h-4 text-white" />
							</div>
							<div className="text-xl sm:text-2xl font-bold text-white">{stats.weeklyPoints.toLocaleString()}</div>
							<div className="text-xs sm:text-sm text-white/80">Puntos</div>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
							<div className="w-8 h-8 bg-purple-400/30 rounded-lg flex items-center justify-center mx-auto mb-2">
								<Dumbbell className="w-4 h-4 text-white" />
							</div>
							<div className="text-xl sm:text-2xl font-bold text-white">{stats.completedWorkouts}</div>
							<div className="text-xs sm:text-sm text-white/80">Entrenamientos</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				{/* Enhanced Daily Progress */}
				<div className="xl:col-span-2">
					<Card className="bg-white/95 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
						<Target className="w-5 h-5 text-white" />
					</div>
					<h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Progreso Diario</h3>
				</div>
					
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
						{/* Steps */}
						<div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-300">
							<div className="relative w-24 h-24 mx-auto mb-4">
								<svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#e5e7eb"
										strokeWidth="6"
										fill="none"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="url(#blueGradient)"
										strokeWidth="6"
										fill="none"
										strokeDasharray={`${(stats.dailySteps/stats.dailyStepsGoal) * 251.2} 251.2`}
										strokeLinecap="round"
										className="drop-shadow-sm"
									/>
									<defs>
										<linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" stopColor="#3b82f6" />
											<stop offset="100%" stopColor="#1d4ed8" />
										</linearGradient>
									</defs>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-lg font-bold text-blue-600">{Math.round((stats.dailySteps/stats.dailyStepsGoal) * 100)}%</div>
										<Footprints className="w-4 h-4 text-blue-500 mx-auto mt-1" />
									</div>
								</div>
							</div>
							<div className="font-bold text-gray-900 mb-1">Pasos</div>
							<div className="text-sm text-gray-600 font-medium">{stats.dailySteps.toLocaleString()}</div>
							<div className="text-xs text-gray-500">Meta: {stats.dailyStepsGoal.toLocaleString()}</div>
						</div>

						{/* Calories */}
						<div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-300">
							<div className="relative w-24 h-24 mx-auto mb-4">
								<svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#e5e7eb"
										strokeWidth="6"
										fill="none"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="url(#orangeGradient)"
										strokeWidth="6"
										fill="none"
										strokeDasharray={`${(stats.dailyCalories/stats.dailyCaloriesGoal) * 251.2} 251.2`}
										strokeLinecap="round"
										className="drop-shadow-sm"
									/>
									<defs>
										<linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" stopColor="#f97316" />
											<stop offset="100%" stopColor="#ea580c" />
										</linearGradient>
									</defs>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-lg font-bold text-orange-600">{Math.round((stats.dailyCalories/stats.dailyCaloriesGoal) * 100)}%</div>
										<Flame className="w-4 h-4 text-orange-500 mx-auto mt-1" />
									</div>
								</div>
							</div>
							<div className="font-bold text-gray-900 mb-1">Calorías</div>
							<div className="text-sm text-gray-600 font-medium">{stats.dailyCalories.toLocaleString()}</div>
							<div className="text-xs text-gray-500">Meta: {stats.dailyCaloriesGoal.toLocaleString()} kcal</div>
						</div>

						{/* Weight Progress */}
						<div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-300">
							<div className="relative w-24 h-24 mx-auto mb-4">
								<svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#e5e7eb"
										strokeWidth="6"
										fill="none"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="url(#greenGradient)"
										strokeWidth="6"
										fill="none"
										strokeDasharray={`${Math.min(1, Math.abs(stats.weightGoal - stats.currentWeight) / Math.abs(stats.weightGoal - 80)) * 251.2} 251.2`}
										strokeLinecap="round"
										className="drop-shadow-sm"
									/>
									<defs>
										<linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" stopColor="#22c55e" />
											<stop offset="100%" stopColor="#16a34a" />
										</linearGradient>
									</defs>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-lg font-bold text-green-600">{stats.currentWeight.toFixed(1)}</div>
										<Scale className="w-4 h-4 text-green-500 mx-auto mt-1" />
									</div>
								</div>
							</div>
							<div className="font-bold text-gray-900 mb-1">Peso Actual</div>
							<div className="text-sm text-gray-600 font-medium">{stats.currentWeight.toFixed(1)} kg</div>
							<div className="text-xs text-gray-500">Meta: {stats.weightGoal.toFixed(1)} kg</div>
						</div>
					</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Metrics Cards */}
				<div className="space-y-4">
					{/* Calories Card */}
					<Card className="bg-white/95 backdrop-blur-md border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
						<CardContent className="p-5">
							<div className="flex items-center justify-between mobile-gap">
								<div className="flex items-center mobile-gap">
									<div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center">
										<Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
									</div>
									<h3 className="responsive-body font-semibold text-gray-900">Calorías</h3>
								</div>
								<span className="responsive-title font-bold text-gray-900">{stats.dailyCalories.toLocaleString()}</span>
							</div>
							<div className="responsive-caption text-gray-500 mb-2">Meta: {stats.dailyCaloriesGoal.toLocaleString()} kcal</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div 
									className="bg-orange-500 h-2 rounded-full" 
									style={{ width: `${Math.min(100, (stats.dailyCalories / stats.dailyCaloriesGoal) * 100)}%` }}
								></div>
							</div>
						</CardContent>
					</Card>

					{/* Weight Card */}
					<Card className="bg-white/95 backdrop-blur-md border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
										<Scale className="w-5 h-5 text-green-600" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900">Peso</h3>
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.currentWeight.toFixed(1)} kg</span>
							</div>
							<div className="text-sm text-gray-500 mb-3">Meta: {stats.weightGoal.toFixed(1)} kg</div>
							<div className="flex items-center mobile-gap">
								{stats.weightChange >= 0 ? (
									<TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
								) : (
									<TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
								)}
								<span className={`responsive-caption ${
									stats.weightChange >= 0 ? 'text-red-600' : 'text-green-600'
								}`}>
									{stats.weightChange >= 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg esta semana
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Heart Rate Card */}
					<Card className="bg-white/95 backdrop-blur-md border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
										<Heart className="w-5 h-5 text-red-600" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900">Ritmo Cardíaco</h3>
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.restingHeartRate} bpm</span>
							</div>
							<div className="text-sm text-gray-500">Ritmo cardíaco en reposo</div>
						</CardContent>
					</Card>

					{/* Quick Actions */}
					<Card className="bg-white/95 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
						<CardContent className="p-6">
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
									<Play className="w-5 h-5 text-white" />
								</div>
								<h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Acciones Rápidas</h3>
							</div>
							
							<div className="space-y-4">
							<Link href="/dashboard/player-rutina">
								<Button className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
									<Play className="w-5 h-5 mr-3" />
									Iniciar Entrenamiento
								</Button>
							</Link>
								
								{stats.lastWorkout && (
									<div className="text-sm text-gray-500 text-center bg-gray-50 rounded-lg p-3">
										Último entrenamiento: {stats.lastWorkout}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Personal Records */}
			<Card className="bg-white/95 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
				<CardContent className="p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
							<Activity className="w-5 h-5 text-white" />
						</div>
						<h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Récords Personales</h3>
					</div>
					
					<div className="space-y-4">
						{recentRecords.length > 0 ? (
							recentRecords.slice(0, 3).map((record, index) => (
									<div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all duration-300">
										<div>
											<div className="text-base font-semibold text-gray-900">{record.exerciseName}</div>
											<div className="text-sm text-gray-600">{record.recordType}: {record.value}{record.reps ? ` reps` : ` kg`}</div>
										</div>
										<div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
											<span className="text-white text-lg font-bold">🏆</span>
										</div>
									</div>
								))
						) : (
							<div className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl">
								<Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
								<p className="font-medium">No hay récords registrados aún</p>
								<p className="text-sm mt-1">¡Comienza a entrenar para establecer tus primeros récords!</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Bottom Navigation */}
			<div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 px-4 sm:px-6 py-3 shadow-2xl">
				<div className="flex justify-around items-center max-w-md mx-auto">
					<div className="flex flex-col items-center gap-1">
						<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
							<Home className="w-5 h-5 text-white" />
						</div>
						<span className="text-xs text-blue-600 font-semibold">Inicio</span>
					</div>
					
					<Link href="/dashboard/player-rutina" className="flex flex-col items-center gap-1">
					<div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 transition-all duration-300 group">
						<Play className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
					</div>
					<span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">Entrenar</span>
				</Link>
					
					<Link href="/dashboard/progreso" className="flex flex-col items-center gap-1">
						<div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 transition-all duration-300 group">
							<BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
						</div>
						<span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">Progreso</span>
					</Link>
					
					<Link href="/dashboard/profile" className="flex flex-col items-center gap-1">
						<div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 transition-all duration-300 group">
							<User className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
						</div>
						<span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">Perfil</span>
					</Link>
					
					<Link href="/dashboard/settings" className="flex flex-col items-center gap-1">
						<div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 transition-all duration-300 group">
							<Settings className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
						</div>
						<span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">Ajustes</span>
					</Link>
				</div>
			</div>
			{/* Spacer for bottom navigation */}
			<div className="h-20"></div>
		</div>
	)
}