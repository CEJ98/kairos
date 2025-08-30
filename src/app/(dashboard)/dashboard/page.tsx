'use client'

import { useState, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner, withLazyLoading } from "@/components/ui/lazy-loader"
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

// Lazy load heavy components
const LazyProgressChart = withLazyLoading(
	() => import('@/components/dashboard/progress-chart'),
	{ loadingMessage: 'Cargando gráfico de progreso...', loadingSize: 'sm' }
)

const LazyWeeklyStats = withLazyLoading(
	() => import('@/components/dashboard/weekly-stats'),
	{ loadingMessage: 'Cargando estadísticas semanales...', loadingSize: 'sm' }
)

const LazyRecentActivity = withLazyLoading(
	() => import('@/components/dashboard/recent-activity'),
	{ loadingMessage: 'Cargando actividad reciente...', loadingSize: 'sm' }
)

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
		<div className="min-h-screen bg-gray-50 mobile-spacing">
			{/* Header */}
			<div className="flex items-center justify-between mobile-gap">
				<div className="flex items-center gap-3">
					<Avatar className="w-10 h-10 sm:w-12 sm:h-12">
						<AvatarImage src={session?.user?.image || "/fitness-user-avatar.png"} alt={session?.user?.name || "Usuario"} />
						<AvatarFallback>{getUserInitials(session?.user?.name)}</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="responsive-heading font-bold text-gray-900">Hola, {session?.user?.name?.split(' ')[0] || 'Usuario'} 👋</h1>
						<p className="responsive-caption text-gray-500">{formatDate()}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="ghost" className="mobile-button" onClick={refresh}>
						<RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
					</Button>
					<Button variant="ghost" className="mobile-button">
						<Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
					</Button>
				</div>
			</div>

			{/* Weekly Overview */}
			<Card className="mobile-card mobile-gap">
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between mobile-gap">
						<h2 className="responsive-subheading font-semibold text-gray-900">Resumen Semanal</h2>
						<Badge 
							variant="secondary" 
							className={`border-0 responsive-caption ${
								parseFloat(getWeeklyScore()) >= 7 ? 'bg-green-100 text-green-700' :
								parseFloat(getWeeklyScore()) >= 5 ? 'bg-yellow-100 text-yellow-700' :
								'bg-red-100 text-red-700'
							}`}
						>
							{getWeeklyScore()}/10 {
								parseFloat(getWeeklyScore()) >= 7 ? '¡Excelente!' :
								parseFloat(getWeeklyScore()) >= 5 ? '¡Bien!' :
								'Puedes mejorar'
							}
						</Badge>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 mobile-gap">
						<div className="text-center">
							<div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.weeklyDistance.toLocaleString()}</div>
							<div className="responsive-caption text-gray-500">Distancia (km)</div>
						</div>
						<div className="text-center">
							<div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.weeklyCalories.toLocaleString()}</div>
							<div className="responsive-caption text-gray-500">Calorías</div>
						</div>
						<div className="text-center">
							<div className="text-xl sm:text-2xl font-bold text-green-600">{stats.weeklyPoints.toLocaleString()}</div>
							<div className="responsive-caption text-gray-500">Puntos</div>
						</div>
						<div className="text-center">
							<div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.completedWorkouts}</div>
							<div className="responsive-caption text-gray-500">Entrenamientos</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 mobile-gap mobile-gap">
				{/* Daily Progress */}
				<div className="lg:col-span-2">
					<Card className="mobile-card">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center gap-2 mobile-gap">
					<div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center">
						<Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
					</div>
					<h3 className="responsive-subheading font-semibold text-gray-900">Progreso Diario</h3>
				</div>
					
					<div className="grid grid-cols-1 sm:grid-cols-3 mobile-gap">
						{/* Steps */}
						<div className="text-center">
							<div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3">
								<svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 100 100">
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#e5e7eb"
										strokeWidth="8"
										fill="none"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#3b82f6"
										strokeWidth="8"
										fill="none"
										strokeDasharray={`${(stats.dailySteps/stats.dailyStepsGoal) * 251.2} 251.2`}
										strokeLinecap="round"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-sm sm:text-lg font-bold text-gray-900">{stats.dailySteps.toLocaleString()}</div>
										<div className="text-xs text-gray-500">/{stats.dailyStepsGoal.toLocaleString()}</div>
									</div>
								</div>
							</div>
							<div className="responsive-body font-semibold text-gray-900">Pasos</div>
							<div className="responsive-caption text-gray-500">{stats.dailySteps.toLocaleString()} / {stats.dailyStepsGoal.toLocaleString()}</div>
						</div>

						{/* Calories */}
						<div className="text-center">
							<div className="relative w-24 h-24 mx-auto mb-3">
								<svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#e5e7eb"
										strokeWidth="8"
										fill="none"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#f97316"
										strokeWidth="8"
										fill="none"
										strokeDasharray={`${(stats.dailyCalories/stats.dailyCaloriesGoal) * 251.2} 251.2`}
										strokeLinecap="round"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-lg font-bold text-gray-900">{stats.dailyCalories.toLocaleString()}</div>
										<div className="text-xs text-gray-500">/{stats.dailyCaloriesGoal.toLocaleString()}</div>
									</div>
								</div>
							</div>
							<div className="font-semibold text-gray-900">Calorías</div>
							<div className="text-sm text-gray-500">{stats.dailyCalories.toLocaleString()} / {stats.dailyCaloriesGoal.toLocaleString()} kcal</div>
						</div>

						{/* Weight Progress */}
						<div className="text-center">
							<div className="relative w-24 h-24 mx-auto mb-3">
								<svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#e5e7eb"
										strokeWidth="8"
										fill="none"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#22c55e"
										strokeWidth="8"
										fill="none"
										strokeDasharray={`${Math.min(1, stats.currentWeight/stats.weightGoal) * 251.2} 251.2`}
										strokeLinecap="round"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-lg font-bold text-gray-900">{stats.currentWeight.toFixed(1)}</div>
										<div className="text-xs text-gray-500">kg</div>
									</div>
								</div>
							</div>
							<div className="font-semibold text-gray-900">Peso</div>
							<div className="text-sm text-gray-500">{stats.currentWeight.toFixed(1)} kg</div>
						</div>
					</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column */}
				<div className="mobile-gap-y">
					{/* Calories Card */}
					<Card className="mobile-card">
						<CardContent className="mobile-spacing">
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
					<Card className="mobile-card">
						<CardContent className="mobile-spacing">
							<div className="flex items-center justify-between mobile-gap">
								<div className="flex items-center mobile-gap">
									<div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
										<Scale className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
									</div>
									<h3 className="responsive-body font-semibold text-gray-900">Peso</h3>
								</div>
								<span className="responsive-title font-bold text-gray-900">{stats.currentWeight.toFixed(1)} kg</span>
							</div>
							<div className="responsive-caption text-gray-500 mb-2">Meta: {stats.weightGoal.toFixed(1)} kg</div>
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
					<Card className="mobile-card">
						<CardContent className="mobile-spacing">
							<div className="flex items-center justify-between mobile-gap">
								<div className="flex items-center mobile-gap">
									<div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
										<Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
									</div>
									<h3 className="responsive-body font-semibold text-gray-900">Ritmo Cardíaco</h3>
								</div>
								<span className="responsive-title font-bold text-gray-900">{stats.restingHeartRate} bpm</span>
							</div>
							<div className="responsive-caption text-gray-500">Ritmo cardíaco en reposo</div>
						</CardContent>
					</Card>

					{/* Quick Actions */}
					<Card className="mobile-card">
						<CardContent className="mobile-spacing">
							<div className="flex items-center mobile-gap mobile-gap">
								<div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center">
									<Play className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
								</div>
								<h3 className="responsive-subheading font-semibold text-gray-900">Acciones Rápidas</h3>
							</div>
							
							<div className="mobile-gap-y">
								<Button className="w-full mobile-button bg-blue-500 hover:bg-blue-600 text-white">
									<Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
									Iniciar Entrenamiento
								</Button>
								
								{stats.lastWorkout && (
									<div className="responsive-caption text-gray-500 text-center">
										Último entrenamiento: {stats.lastWorkout}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Personal Records */}
			<Card className="mobile-card">
				<CardContent className="mobile-spacing">
					<div className="flex items-center mobile-gap mobile-gap">
						<div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-100 rounded-full flex items-center justify-center">
							<Activity className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
						</div>
						<h3 className="responsive-subheading font-semibold text-gray-900">Récords Personales</h3>
					</div>
					
					<div className="mobile-gap-y">
						{recentRecords.length > 0 ? (
							recentRecords.slice(0, 3).map((record, index) => (
									<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div>
											<div className="responsive-body font-medium text-gray-900">{record.exerciseName}</div>
											<div className="responsive-caption text-gray-500">{record.recordType}: {record.value}{record.reps ? ` reps` : ` kg`}</div>
										</div>
										<div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center">
											<span className="text-yellow-600 responsive-caption font-semibold">🏆</span>
										</div>
									</div>
								))
						) : (
							<div className="text-center text-gray-500 py-4">
								No hay récords registrados aún
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Bottom Navigation */}
			<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-2 sm:py-3">
				<div className="flex justify-around items-center max-w-md mx-auto">
					<div className="flex flex-col items-center gap-1">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
							<Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
						</div>
						<span className="responsive-caption text-blue-500 font-medium">Inicio</span>
					</div>
					
					<Link href="/dashboard/workouts" className="flex flex-col items-center gap-1">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
							<Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-blue-500" />
						</div>
						<span className="responsive-caption text-gray-400">Rutinas</span>
					</Link>
					
					<Link href="/dashboard/calendar" className="flex flex-col items-center gap-1">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
							<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-blue-500" />
						</div>
						<span className="responsive-caption text-gray-400">Calendario</span>
					</Link>
					
					<Link href="/dashboard/profile" className="flex flex-col items-center gap-1">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
							<User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-blue-500" />
						</div>
						<span className="responsive-caption text-gray-400">Perfil</span>
					</Link>
					
					<Link href="/dashboard/settings" className="flex flex-col items-center gap-1">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
							<Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-blue-500" />
						</div>
						<span className="responsive-caption text-gray-400">Ajustes</span>
					</Link>
				</div>
			</div>
		</div>
	)
}