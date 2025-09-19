'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
	Palette,
	Accessibility,
	Smartphone,
	Eye,
	CheckCircle,
	AlertTriangle,
	XCircle,
	TrendingUp,
	Layout,
	Type,
	MousePointer,
	Monitor,
	Tablet,
	RefreshCw,
	Zap,
	Target
} from 'lucide-react'

interface UIUXMetric {
	id: string
	name: string
	score: number
	status: 'excellent' | 'good' | 'needs-improvement' | 'critical'
	description: string
	recommendations: string[]
}

interface AccessibilityIssue {
	id: string
	type: 'critical' | 'moderate' | 'minor'
	title: string
	description: string
	location: string
	fix: string
}

const UI_UX_METRICS: UIUXMetric[] = [
	{
		id: 'design-consistency',
		name: 'Consistencia de Diseño',
		score: 85,
		status: 'good',
		description: 'Sistema de diseño bien estructurado con tokens de color y espaciado consistentes',
		recommendations: [
			'Unificar variantes de botones en componentes móviles',
			'Estandarizar espaciado en cards de diferentes secciones',
			'Consolidar paleta de colores entre web y móvil'
		]
	},
	{
		id: 'accessibility',
		name: 'Accesibilidad',
		score: 78,
		status: 'good',
		description: 'Buena implementación de ARIA labels y focus states, pero faltan algunas mejoras',
		recommendations: [
			'Añadir más landmarks ARIA en navegación',
			'Mejorar contraste en modo oscuro',
			'Implementar skip links para navegación por teclado',
			'Añadir descripciones alt más descriptivas en imágenes'
		]
	},
	{
		id: 'responsive-design',
		name: 'Diseño Responsivo',
		score: 92,
		status: 'excellent',
		description: 'Excelente implementación responsiva con breakpoints bien definidos',
		recommendations: [
			'Optimizar tablas en dispositivos móviles',
			'Mejorar navegación táctil en tablets'
		]
	},
	{
		id: 'visual-hierarchy',
		name: 'Jerarquía Visual',
		score: 88,
		status: 'good',
		description: 'Buena estructura tipográfica y uso de espacios en blanco',
		recommendations: [
			'Aumentar contraste en elementos secundarios',
			'Mejorar jerarquía en formularios complejos'
		]
	},
	{
		id: 'interaction-design',
		name: 'Diseño de Interacción',
		score: 82,
		status: 'good',
		description: 'Estados hover y focus bien implementados, transiciones suaves',
		recommendations: [
			'Añadir feedback visual en acciones de carga',
			'Implementar micro-interacciones en elementos clave',
			'Mejorar estados de error en formularios'
		]
	},
	{
		id: 'performance-ui',
		name: 'Rendimiento UI',
		score: 75,
		status: 'needs-improvement',
		description: 'Algunos componentes pesados afectan la fluidez de la interfaz',
		recommendations: [
			'Implementar lazy loading en componentes pesados',
			'Optimizar re-renders en dashboards',
			'Reducir bundle size de iconos'
		]
	}
]

const ACCESSIBILITY_ISSUES: AccessibilityIssue[] = [
	{
		id: 'contrast-dark-mode',
		type: 'moderate',
		title: 'Contraste insuficiente en modo oscuro',
		description: 'Algunos textos secundarios no cumplen WCAG AA',
		location: 'Componentes de navegación y cards',
		fix: 'Aumentar contraste de texto secundario de #666 a #888'
	},
	{
		id: 'focus-indicators',
		type: 'minor',
		title: 'Indicadores de foco inconsistentes',
		description: 'Algunos elementos interactivos no tienen focus visible',
		location: 'Botones de redes sociales en footer',
		fix: 'Aplicar clase focus-visible consistentemente'
	},
	{
		id: 'aria-labels',
		type: 'minor',
		title: 'ARIA labels faltantes',
		description: 'Algunos iconos decorativos no están marcados como tal',
		location: 'Iconos en cards y badges',
		fix: 'Añadir aria-hidden="true" a iconos decorativos'
	},
	{
		id: 'keyboard-navigation',
		type: 'moderate',
		title: 'Navegación por teclado limitada',
		description: 'Falta skip link para saltar al contenido principal',
		location: 'Layout principal',
		fix: 'Implementar skip link al inicio del body'
	}
]

const getStatusColor = (status: string) => {
	switch (status) {
		case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
		case 'good': return 'text-blue-600 bg-blue-50 border-blue-200'
		case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
		case 'critical': return 'text-red-600 bg-red-50 border-red-200'
		default: return 'text-gray-600 bg-gray-50 border-gray-200'
	}
}

const getStatusIcon = (status: string) => {
	switch (status) {
		case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />
		case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />
		case 'needs-improvement': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
		case 'critical': return <XCircle className="w-5 h-5 text-red-600" />
		default: return <AlertTriangle className="w-5 h-5 text-gray-600" />
	}
}

const getIssueTypeColor = (type: string) => {
	switch (type) {
		case 'critical': return 'destructive'
		case 'moderate': return 'secondary'
		case 'minor': return 'outline'
		default: return 'outline'
	}
}

export default function UIUXEvaluationReport() {
	const [activeTab, setActiveTab] = useState('overview')

	const overallScore = Math.round(
		UI_UX_METRICS.reduce((acc, metric) => acc + metric.score, 0) / UI_UX_METRICS.length
	)

	const criticalIssues = ACCESSIBILITY_ISSUES.filter(issue => issue.type === 'critical').length
	const moderateIssues = ACCESSIBILITY_ISSUES.filter(issue => issue.type === 'moderate').length
	const minorIssues = ACCESSIBILITY_ISSUES.filter(issue => issue.type === 'minor').length

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Evaluación UI/UX</h1>
					<p className="text-gray-600 dark:text-gray-300 mt-2">
						Análisis completo de diseño, usabilidad y accesibilidad
					</p>
				</div>
				<Button variant="outline" className="gap-2">
					<RefreshCw className="w-4 h-4" />
					Actualizar Análisis
				</Button>
			</div>

			{/* Score Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="w-5 h-5 text-blue-600" />
							Puntuación General UI/UX
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-4">
							<div className="text-4xl font-bold text-blue-600">{overallScore}</div>
							<div className="flex-1">
								<Progress value={overallScore} className="h-3" />
								<p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
									Buena experiencia general con oportunidades de mejora
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Accessibility className="w-5 h-5 text-green-600" />
							Accesibilidad
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Críticos</span>
								<Badge variant="destructive">{criticalIssues}</Badge>
							</div>
							<div className="flex justify-between text-sm">
								<span>Moderados</span>
								<Badge variant="secondary">{moderateIssues}</Badge>
							</div>
							<div className="flex justify-between text-sm">
								<span>Menores</span>
								<Badge variant="outline">{minorIssues}</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Smartphone className="w-5 h-5 text-purple-600" />
							Responsividad
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<span className="text-sm font-medium">Excelente</span>
						</div>
						<p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
							Breakpoints bien definidos y componentes adaptativos
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Analysis */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">Resumen</TabsTrigger>
					<TabsTrigger value="metrics">Métricas</TabsTrigger>
					<TabsTrigger value="accessibility">Accesibilidad</TabsTrigger>
					<TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Palette className="w-5 h-5 text-blue-600" />
									Sistema de Diseño
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm">Tokens de Color</span>
										<CheckCircle className="w-4 h-4 text-green-600" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Tipografía</span>
										<CheckCircle className="w-4 h-4 text-green-600" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Espaciado</span>
										<CheckCircle className="w-4 h-4 text-green-600" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Componentes</span>
										<AlertTriangle className="w-4 h-4 text-yellow-600" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Layout className="w-5 h-5 text-purple-600" />
									Experiencia de Usuario
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm">Navegación</span>
										<CheckCircle className="w-4 h-4 text-green-600" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Feedback Visual</span>
										<AlertTriangle className="w-4 h-4 text-yellow-600" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Flujos de Usuario</span>
										<CheckCircle className="w-4 h-4 text-green-600" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Estados de Error</span>
										<AlertTriangle className="w-4 h-4 text-yellow-600" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<Alert>
						<Target className="h-4 w-4" />
						<AlertDescription>
							<strong>Prioridades de Mejora:</strong> Enfocarse en consistencia de componentes móviles, 
							mejorar contraste en modo oscuro y optimizar rendimiento de componentes pesados.
						</AlertDescription>
					</Alert>
				</TabsContent>

				<TabsContent value="metrics" className="space-y-6">
					<div className="grid gap-6">
						{UI_UX_METRICS.map((metric) => (
							<Card key={metric.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											{getStatusIcon(metric.status)}
											{metric.name}
										</CardTitle>
										<Badge className={getStatusColor(metric.status)}>
											{metric.score}/100
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<Progress value={metric.score} className="h-2" />
										<p className="text-sm text-gray-600 dark:text-gray-300">
											{metric.description}
										</p>
										<div className="space-y-2">
											<h4 className="text-sm font-medium">Recomendaciones:</h4>
											<ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
												{metric.recommendations.map((rec, index) => (
													<li key={index} className="flex items-start gap-2">
														<span className="text-blue-600 mt-1">•</span>
														{rec}
													</li>
												))}
											</ul>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="accessibility" className="space-y-6">
					<div className="grid gap-4">
						{ACCESSIBILITY_ISSUES.map((issue) => (
							<Card key={issue.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-base">{issue.title}</CardTitle>
										<Badge variant={getIssueTypeColor(issue.type)}>
											{issue.type}
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<p className="text-sm text-gray-600 dark:text-gray-300">
											{issue.description}
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
											<div>
												<span className="font-medium text-gray-900 dark:text-white">Ubicación:</span>
												<p className="text-gray-600 dark:text-gray-300">{issue.location}</p>
											</div>
											<div>
												<span className="font-medium text-gray-900 dark:text-white">Solución:</span>
												<p className="text-gray-600 dark:text-gray-300">{issue.fix}</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="recommendations" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Zap className="w-5 h-5 text-yellow-600" />
									Prioridad Alta
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3 text-sm">
									<li className="flex items-start gap-2">
										<span className="text-red-600 mt-1">•</span>
										Mejorar contraste en modo oscuro (WCAG AA)
									</li>
									<li className="flex items-start gap-2">
										<span className="text-red-600 mt-1">•</span>
										Implementar lazy loading en componentes pesados
									</li>
									<li className="flex items-start gap-2">
										<span className="text-red-600 mt-1">•</span>
										Unificar variantes de botones entre web y móvil
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Target className="w-5 h-5 text-blue-600" />
									Prioridad Media
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3 text-sm">
									<li className="flex items-start gap-2">
										<span className="text-yellow-600 mt-1">•</span>
										Añadir micro-interacciones en elementos clave
									</li>
									<li className="flex items-start gap-2">
										<span className="text-yellow-600 mt-1">•</span>
										Mejorar feedback visual en acciones de carga
									</li>
									<li className="flex items-start gap-2">
										<span className="text-yellow-600 mt-1">•</span>
										Optimizar tablas en dispositivos móviles
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Plan de Implementación</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="p-4 border rounded-lg">
										<h4 className="font-medium mb-2">Semana 1-2</h4>
										<ul className="text-sm space-y-1">
											<li>• Mejorar contraste modo oscuro</li>
											<li>• Implementar skip links</li>
											<li>• Unificar focus states</li>
										</ul>
									</div>
									<div className="p-4 border rounded-lg">
										<h4 className="font-medium mb-2">Semana 3-4</h4>
										<ul className="text-sm space-y-1">
											<li>• Optimizar componentes pesados</li>
											<li>• Añadir lazy loading</li>
											<li>• Mejorar estados de carga</li>
										</ul>
									</div>
									<div className="p-4 border rounded-lg">
										<h4 className="font-medium mb-2">Semana 5-6</h4>
										<ul className="text-sm space-y-1">
											<li>• Micro-interacciones</li>
											<li>• Optimizar móvil</li>
											<li>• Testing final</li>
										</ul>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}