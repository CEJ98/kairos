'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useResponsive } from '@/hooks/useResponsive'
import {
	Smartphone,
	Tablet,
	Monitor,
	Eye,
	Ruler,
	Palette,
	Layout,
	Type,
	MousePointer,
	RefreshCw
} from 'lucide-react'

interface ResponsiveTestProps {
	showDeviceInfo?: boolean
}

export default function ResponsiveTest({ showDeviceInfo = true }: ResponsiveTestProps) {
	const responsive = useResponsive()
	const [testProgress, setTestProgress] = useState(0)

	// Simular progreso de prueba
	React.useEffect(() => {
		const timer = setInterval(() => {
			setTestProgress(prev => (prev >= 100 ? 0 : prev + 10))
		}, 1000)
		return () => clearInterval(timer)
	}, [])

	const deviceType = responsive.isMobile ? 'Móvil' : responsive.isTablet ? 'Tablet' : 'Desktop'
	const deviceIcon = responsive.isMobile ? <Smartphone className="w-5 h-5" /> : 
						 responsive.isTablet ? <Tablet className="w-5 h-5" /> : 
						 <Monitor className="w-5 h-5" />

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 space-y-6">
			{/* Header de información del dispositivo */}
			{showDeviceInfo && (
				<Card className="border-2 border-dashed border-blue-300 dark:border-blue-700">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-lg">
								{deviceIcon}
								Prueba de Responsividad
							</CardTitle>
							<Badge variant={responsive.isMobile ? 'default' : responsive.isTablet ? 'secondary' : 'outline'}>
								{deviceType}
							</Badge>
						</div>
						<CardDescription>
							Verificando consistencia visual en {responsive.width}x{responsive.height}px
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Dimensiones</Label>
								<div className="font-mono">{responsive.width} × {responsive.height}</div>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Orientación</Label>
								<div>{responsive.isPortrait ? 'Vertical' : 'Horizontal'}</div>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Táctil</Label>
								<div>{responsive.isTouchDevice ? 'Sí' : 'No'}</div>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Breakpoint</Label>
								<div className="font-mono">
									{responsive.isXs && 'xs'}
									{responsive.isSm && 'sm'}
									{responsive.isMd && 'md'}
									{responsive.isLg && 'lg'}
									{responsive.isXl && 'xl'}
									{responsive.is2Xl && '2xl'}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Pruebas de componentes UI */}
			<Tabs defaultValue="buttons" className="w-full">
				<TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
					<TabsTrigger value="buttons" className="text-xs md:text-sm">
						<MousePointer className="w-4 h-4 mr-1" />
						Botones
					</TabsTrigger>
					<TabsTrigger value="cards" className="text-xs md:text-sm">
						<Layout className="w-4 h-4 mr-1" />
						Cards
					</TabsTrigger>
					<TabsTrigger value="forms" className="text-xs md:text-sm">
						<Type className="w-4 h-4 mr-1" />
						Formularios
					</TabsTrigger>
					<TabsTrigger value="layout" className="text-xs md:text-sm">
						<Ruler className="w-4 h-4 mr-1" />
						Layout
					</TabsTrigger>
				</TabsList>

				{/* Prueba de Botones */}
				<TabsContent value="buttons" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MousePointer className="w-5 h-5" />
								Prueba de Botones
							</CardTitle>
							<CardDescription>
								Verificando tamaños, variantes y estados de botones
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Tamaños de botones */}
							<div className="space-y-3">
								<Label className="text-sm font-medium">Tamaños</Label>
								<div className="flex flex-wrap gap-2">
									<Button size="xs">Extra Small</Button>
									<Button size="sm">Small</Button>
									<Button size="default">Default</Button>
									<Button size="lg">Large</Button>
									<Button size="xl">Extra Large</Button>
								</div>
							</div>

							{/* Variantes de botones */}
							<div className="space-y-3">
								<Label className="text-sm font-medium">Variantes</Label>
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
									<Button variant="default">Default</Button>
									<Button variant="secondary">Secondary</Button>
									<Button variant="outline">Outline</Button>
									<Button variant="ghost">Ghost</Button>
									<Button variant="destructive">Destructive</Button>
									<Button variant="success">Success</Button>
									<Button variant="warning">Warning</Button>
									<Button variant="gradient">Gradient</Button>
								</div>
							</div>

							{/* Estados de botones */}
							<div className="space-y-3">
								<Label className="text-sm font-medium">Estados</Label>
								<div className="flex flex-wrap gap-2">
									<Button>Normal</Button>
									<Button disabled>Deshabilitado</Button>
									<Button isLoading>Cargando</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Prueba de Cards */}
				<TabsContent value="cards" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<Card variant="default">
							<CardHeader>
								<CardTitle>Card Default</CardTitle>
								<CardDescription>Estilo por defecto con sombra sutil</CardDescription>
							</CardHeader>
							<CardContent>
								<Progress value={testProgress} className="mb-2" />
								<p className="text-sm text-muted-foreground">Progreso: {testProgress}%</p>
							</CardContent>
						</Card>

						<Card variant="elevated" hover>
							<CardHeader>
								<CardTitle>Card Elevada</CardTitle>
								<CardDescription>Con sombra elevada y hover</CardDescription>
							</CardHeader>
							<CardContent>
								<Badge variant="secondary">Interactiva</Badge>
							</CardContent>
						</Card>

						<Card variant="outlined">
							<CardHeader>
								<CardTitle>Card Outlined</CardTitle>
								<CardDescription>Con borde prominente</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex gap-2">
									<Badge>Tag 1</Badge>
									<Badge variant="outline">Tag 2</Badge>
								</div>
							</CardContent>
						</Card>

						<Card variant="glass" className="md:col-span-2 lg:col-span-1">
							<CardHeader>
								<CardTitle>Card Glass</CardTitle>
								<CardDescription>Efecto cristal con backdrop blur</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="ghost" size="sm">
									<RefreshCw className="w-4 h-4 mr-2" />
									Actualizar
								</Button>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Prueba de Formularios */}
				<TabsContent value="forms" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Type className="w-5 h-5" />
								Prueba de Formularios
							</CardTitle>
							<CardDescription>
								Verificando campos de entrada y controles
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="test-input">Campo de texto</Label>
									<Input 
										id="test-input" 
										placeholder="Escribe algo aquí..." 
										className="transition-all duration-200 focus:scale-[1.02]"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="test-email">Email</Label>
									<Input 
										id="test-email" 
										type="email" 
										placeholder="usuario@ejemplo.com"
										className="transition-all duration-200 focus:scale-[1.02]"
									/>
								</div>
							</div>
							<div className="flex flex-col sm:flex-row gap-2">
								<Button className="flex-1">Enviar</Button>
								<Button variant="outline" className="flex-1">Cancelar</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Prueba de Layout */}
				<TabsContent value="layout" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Ruler className="w-5 h-5" />
								Prueba de Layout Responsivo
							</CardTitle>
							<CardDescription>
								Verificando grids y espaciado adaptativo
							</CardDescription>
						</CardHeader>
						<CardContent>
							{/* Grid responsivo */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
								{[1, 2, 3, 4].map((item) => (
									<div 
										key={item}
										className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg text-center border-2 border-dashed border-blue-200 dark:border-blue-700 transition-all duration-300 hover:scale-105"
									>
										<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">#{item}</div>
										<div className="text-sm text-muted-foreground">Grid Item</div>
									</div>
								))}
							</div>

							{/* Información de breakpoints */}
							<div className="bg-muted/50 p-4 rounded-lg">
								<h4 className="font-medium mb-2">Breakpoints Activos:</h4>
								<div className="flex flex-wrap gap-2">
									{responsive.isXs && <Badge variant="outline">XS (0px+)</Badge>}
									{responsive.isSm && <Badge variant="secondary">SM (640px+)</Badge>}
									{responsive.isMd && <Badge variant="default">MD (768px+)</Badge>}
									{responsive.isLg && <Badge variant="default">LG (1024px+)</Badge>}
									{responsive.isXl && <Badge variant="default">XL (1280px+)</Badge>}
									{responsive.is2Xl && <Badge variant="default">2XL (1536px+)</Badge>}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Resumen de pruebas */}
			<Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
						<Eye className="w-5 h-5" />
						Resumen de Verificación
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full"></div>
							<span>Componentes responsivos</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full"></div>
							<span>Breakpoints funcionando</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full"></div>
							<span>Espaciado consistente</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full"></div>
							<span>Tipografía adaptativa</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}