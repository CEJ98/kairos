'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
	TrendingUp, 
	TrendingDown, 
	Minus, 
	Plus, 
	Scale, 
	Activity, 
	Target,
	Calendar,
	BarChart3,
	LineChart
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface ProgressMetric {
	id: string
	date: string
	weight?: number
	bodyFat?: number
	muscle?: number
	chest?: number
	waist?: number
	hips?: number
	bicep?: number
	thigh?: number
	notes?: string
}

interface OneRepMaxData {
	exercise: {
		id: string
		name: string
		category: string
		muscleGroups: string[]
	}
	oneRepMax: number
	bestSet: {
		weight: number
		reps: number
		date: string
	}
	totalSets: number
	trend: number
	history: Array<{
		oneRM: number
		weight: number
		reps: number
		date: string
	}>
}

interface ProgressStats {
	totalEntries: number
	latestEntry?: ProgressMetric
	changes?: {
		weight?: { current: number; change: number }
		bodyFat?: { current: number; change: number }
		muscle?: { current: number; change: number }
	}
}

export default function ProgressDashboard() {
	const [metrics, setMetrics] = useState<ProgressMetric[]>([])
	const [oneRepMaxData, setOneRepMaxData] = useState<OneRepMaxData[]>([])
	const [stats, setStats] = useState<ProgressStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [showForm, setShowForm] = useState(false)

	// Form state
	const [formData, setFormData] = useState({
		weight: '',
		bodyFat: '',
		muscle: '',
		chest: '',
		waist: '',
		hips: '',
		bicep: '',
		thigh: '',
		notes: ''
	})

	// Carregar dados
	useEffect(() => {
		loadData()
	}, [])

	const loadData = async () => {
		try {
			setLoading(true)
			
			// Carregar métricas de progresso
			const metricsResponse = await fetch('/api/progress-metrics')
			if (metricsResponse.ok) {
				const metricsData = await metricsResponse.json()
				setMetrics(metricsData.metrics || [])
				setStats(metricsData.stats || null)
			}

			// Carregar dados de 1RM
			const oneRMResponse = await fetch('/api/one-rep-max')
			if (oneRMResponse.ok) {
				const oneRMData = await oneRMResponse.json()
				setOneRepMaxData(oneRMData.oneRepMaxData || [])
			}
		} catch (error) {
			console.error('Erro ao carregar dados:', error)
			toast.error('Erro ao carregar dados de progresso')
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSubmitting(true)

		try {
			// Filtrar apenas campos preenchidos
			const dataToSubmit: any = {}
			Object.entries(formData).forEach(([key, value]) => {
				if (value.trim()) {
					if (key === 'notes') {
						dataToSubmit[key] = value
					} else {
						dataToSubmit[key] = parseFloat(value)
					}
				}
			})

			if (Object.keys(dataToSubmit).length === 0) {
				toast.error('Preencha pelo menos um campo')
				return
			}

			const response = await fetch('/api/progress-metrics', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataToSubmit)
			})

			if (response.ok) {
				toast.success('Métrica adicionada com sucesso!')
				setFormData({
					weight: '',
					bodyFat: '',
					muscle: '',
					chest: '',
					waist: '',
					hips: '',
					bicep: '',
					thigh: '',
					notes: ''
				})
				setShowForm(false)
				loadData() // Recarregar dados
			} else {
				const error = await response.json()
				toast.error(error.error || 'Erro ao salvar métrica')
			}
		} catch (error) {
			console.error('Erro ao salvar métrica:', error)
			toast.error('Erro ao salvar métrica')
		} finally {
			setSubmitting(false)
		}
	}

	const formatChartData = (field: keyof ProgressMetric) => {
		return metrics
			.filter(m => m[field] !== null && m[field] !== undefined)
			.map(m => ({
				date: format(new Date(m.date), 'dd/MM', { locale: ptBR }),
				value: m[field] as number,
				fullDate: m.date
			}))
			.reverse() // Mais antigo primeiro para o gráfico
	}

	const getTrendIcon = (change: number) => {
		if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
		if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
		return <Minus className="h-4 w-4 text-gray-500" />
	}

	const getTrendColor = (trend: number) => {
		if (trend > 5) return 'text-green-500'
		if (trend < -5) return 'text-red-500'
		return 'text-gray-500'
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Progresso</h1>
					<p className="text-gray-600">Acompanhe sua evolução e métricas</p>
				</div>
				<Button onClick={() => setShowForm(!showForm)}>
					<Plus className="h-4 w-4 mr-2" />
					Adicionar Métrica
				</Button>
			</div>

			{/* Formulário */}
			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>Nova Métrica de Progresso</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Métricas Corporais */}
								<div className="space-y-2">
									<Label htmlFor="weight">Peso (kg)</Label>
									<Input
										id="weight"
										type="number"
										step="0.1"
										value={formData.weight}
										onChange={(e) => setFormData({...formData, weight: e.target.value})}
										placeholder="70.5"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="bodyFat">Gordura Corporal (%)</Label>
									<Input
										id="bodyFat"
										type="number"
										step="0.1"
										value={formData.bodyFat}
										onChange={(e) => setFormData({...formData, bodyFat: e.target.value})}
										placeholder="15.2"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="muscle">Massa Muscular (kg)</Label>
									<Input
										id="muscle"
										type="number"
										step="0.1"
										value={formData.muscle}
										onChange={(e) => setFormData({...formData, muscle: e.target.value})}
										placeholder="55.0"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
								{/* Medidas Corporais */}
								<div className="space-y-2">
									<Label htmlFor="chest">Peitoral (cm)</Label>
									<Input
										id="chest"
										type="number"
										step="0.1"
										value={formData.chest}
										onChange={(e) => setFormData({...formData, chest: e.target.value})}
										placeholder="100"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="waist">Cintura (cm)</Label>
									<Input
										id="waist"
										type="number"
										step="0.1"
										value={formData.waist}
										onChange={(e) => setFormData({...formData, waist: e.target.value})}
										placeholder="80"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="hips">Quadril (cm)</Label>
									<Input
										id="hips"
										type="number"
										step="0.1"
										value={formData.hips}
										onChange={(e) => setFormData({...formData, hips: e.target.value})}
										placeholder="95"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="bicep">Bíceps (cm)</Label>
									<Input
										id="bicep"
										type="number"
										step="0.1"
										value={formData.bicep}
										onChange={(e) => setFormData({...formData, bicep: e.target.value})}
										placeholder="35"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="thigh">Coxa (cm)</Label>
									<Input
										id="thigh"
										type="number"
										step="0.1"
										value={formData.thigh}
										onChange={(e) => setFormData({...formData, thigh: e.target.value})}
										placeholder="60"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="notes">Observações</Label>
								<Textarea
									id="notes"
									value={formData.notes}
									onChange={(e) => setFormData({...formData, notes: e.target.value})}
									placeholder="Observações sobre o progresso..."
									rows={3}
								/>
							</div>

							<div className="flex gap-2">
								<Button type="submit" disabled={submitting}>
									{submitting ? 'Salvando...' : 'Salvar Métrica'}
								</Button>
								<Button type="button" variant="outline" onClick={() => setShowForm(false)}>
									Cancelar
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* Resumo de Estatísticas */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{stats.changes?.weight && (
						<Card>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-600">Peso Atual</p>
										<p className="text-2xl font-bold">{stats.changes.weight.current}kg</p>
									</div>
									<div className="flex items-center gap-1">
										{getTrendIcon(stats.changes.weight.change)}
										<span className={`text-sm font-medium ${
											stats.changes.weight.change > 0 ? 'text-green-500' : 
											stats.changes.weight.change < 0 ? 'text-red-500' : 'text-gray-500'
										}`}>
											{stats.changes.weight.change > 0 ? '+' : ''}{stats.changes.weight.change.toFixed(1)}kg
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{stats.changes?.bodyFat && (
						<Card>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-600">Gordura Corporal</p>
										<p className="text-2xl font-bold">{stats.changes.bodyFat.current}%</p>
									</div>
									<div className="flex items-center gap-1">
										{getTrendIcon(-stats.changes.bodyFat.change)} {/* Invertido: menos gordura é melhor */}
										<span className={`text-sm font-medium ${
											stats.changes.bodyFat.change < 0 ? 'text-green-500' : 
											stats.changes.bodyFat.change > 0 ? 'text-red-500' : 'text-gray-500'
										}`}>
											{stats.changes.bodyFat.change > 0 ? '+' : ''}{stats.changes.bodyFat.change.toFixed(1)}%
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{stats.changes?.muscle && (
						<Card>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-600">Massa Muscular</p>
										<p className="text-2xl font-bold">{stats.changes.muscle.current}kg</p>
									</div>
									<div className="flex items-center gap-1">
										{getTrendIcon(stats.changes.muscle.change)}
										<span className={`text-sm font-medium ${
											stats.changes.muscle.change > 0 ? 'text-green-500' : 
											stats.changes.muscle.change < 0 ? 'text-red-500' : 'text-gray-500'
										}`}>
											{stats.changes.muscle.change > 0 ? '+' : ''}{stats.changes.muscle.change.toFixed(1)}kg
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Tabs para diferentes visualizações */}
			<Tabs defaultValue="metrics" className="space-y-4">
				<TabsList>
					<TabsTrigger value="metrics">Métricas Corporais</TabsTrigger>
					<TabsTrigger value="measurements">Medidas</TabsTrigger>
					<TabsTrigger value="strength">Força (1RM)</TabsTrigger>
				</TabsList>

				{/* Métricas Corporais */}
				<TabsContent value="metrics" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
						{/* Gráfico de Peso */}
						{formatChartData('weight').length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Scale className="h-5 w-5" />
										Peso
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={200}>
										<RechartsLineChart data={formatChartData('weight')}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip />
											<Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
										</RechartsLineChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						)}

						{/* Gráfico de Gordura Corporal */}
						{formatChartData('bodyFat').length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Activity className="h-5 w-5" />
										Gordura Corporal
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={200}>
										<RechartsLineChart data={formatChartData('bodyFat')}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip />
											<Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} />
										</RechartsLineChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						)}

						{/* Gráfico de Massa Muscular */}
						{formatChartData('muscle').length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Target className="h-5 w-5" />
										Massa Muscular
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={200}>
										<RechartsLineChart data={formatChartData('muscle')}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip />
											<Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
										</RechartsLineChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				{/* Medidas Corporais */}
				<TabsContent value="measurements" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{['chest', 'waist', 'hips', 'bicep', 'thigh'].map(measurement => {
							const data = formatChartData(measurement as keyof ProgressMetric)
							if (data.length === 0) return null

							const titles = {
								chest: 'Peitoral',
								waist: 'Cintura',
								hips: 'Quadril',
								bicep: 'Bíceps',
								thigh: 'Coxa'
							}

							return (
								<Card key={measurement}>
									<CardHeader>
										<CardTitle>{titles[measurement as keyof typeof titles]} (cm)</CardTitle>
									</CardHeader>
									<CardContent>
										<ResponsiveContainer width="100%" height={200}>
											<RechartsLineChart data={data}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="date" />
												<YAxis />
												<Tooltip />
												<Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
											</RechartsLineChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>
							)
						})}
					</div>
				</TabsContent>

				{/* Força (1RM) */}
				<TabsContent value="strength" className="space-y-4">
					{oneRepMaxData.length > 0 ? (
						<div className="space-y-4">
							{/* Top 5 Exercícios */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<BarChart3 className="h-5 w-5" />
										Top 5 - 1RM Estimada
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<BarChart data={oneRepMaxData.slice(0, 5)}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis 
												dataKey="exercise.name" 
												angle={-45}
												textAnchor="end"
												height={80}
											/>
											<YAxis />
											<Tooltip />
											<Bar dataKey="oneRepMax" fill="#f59e0b" />
										</BarChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>

							{/* Lista Detalhada */}
							<Card>
								<CardHeader>
									<CardTitle>Todos os Exercícios</CardTitle>
								</CardHeader>
								<CardContent>
									<ScrollArea className="h-[400px]">
										<div className="space-y-3">
											{oneRepMaxData.map((exercise, index) => (
												<div key={exercise.exercise.id} className="flex items-center justify-between p-3 border rounded-lg">
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<span className="font-medium">{exercise.exercise.name}</span>
															<Badge variant="outline">{exercise.exercise.category}</Badge>
														</div>
														<p className="text-sm text-gray-600">
															Melhor: {exercise.bestSet.weight}kg × {exercise.bestSet.reps} reps
														</p>
													</div>
													<div className="text-right">
														<p className="text-lg font-bold">{exercise.oneRepMax}kg</p>
														<div className="flex items-center gap-1">
															<span className={`text-sm ${getTrendColor(exercise.trend)}`}>
																{exercise.trend > 0 ? '+' : ''}{exercise.trend}%
															</span>
															<Badge variant="secondary" className="text-xs">
																{exercise.totalSets} sets
															</Badge>
														</div>
													</div>
												</div>
											))}
										</div>
									</ScrollArea>
								</CardContent>
							</Card>
						</div>
					) : (
						<Card>
							<CardContent className="p-8 text-center">
								<LineChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado de força encontrado</h3>
								<p className="text-gray-600">Complete alguns treinos para ver suas estimativas de 1RM</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>

			{/* Histórico de Métricas */}
			{metrics.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Histórico de Métricas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[300px]">
							<div className="space-y-3">
								{metrics.map((metric) => (
									<div key={metric.id} className="border rounded-lg p-3">
										<div className="flex items-center justify-between mb-2">
											<span className="font-medium">
												{format(new Date(metric.date), 'dd/MM/yyyy', { locale: ptBR })}
											</span>
										</div>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
											{metric.weight && <span>Peso: {metric.weight}kg</span>}
											{metric.bodyFat && <span>Gordura: {metric.bodyFat}%</span>}
											{metric.muscle && <span>Músculo: {metric.muscle}kg</span>}
											{metric.chest && <span>Peitoral: {metric.chest}cm</span>}
											{metric.waist && <span>Cintura: {metric.waist}cm</span>}
											{metric.hips && <span>Quadril: {metric.hips}cm</span>}
											{metric.bicep && <span>Bíceps: {metric.bicep}cm</span>}
											{metric.thigh && <span>Coxa: {metric.thigh}cm</span>}
										</div>
										{metric.notes && (
											<p className="text-sm text-gray-600 mt-2">{metric.notes}</p>
										)}
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			)}
		</div>
	)
}