'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp, Users, Dumbbell, Calendar, Settings, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SearchResult {
	id: string
	title: string
	description: string
	href: string
	icon: React.ReactNode
	category: 'pages' | 'workouts' | 'exercises' | 'clients' | 'settings'
	keywords?: string[]
}

interface GlobalSearchProps {
	className?: string
	userRole?: 'CLIENT' | 'TRAINER' | 'ADMIN'
}

// Datos de búsqueda simulados - en producción vendrían de una API
const searchData: SearchResult[] = [
	// Páginas principales
	{
		id: 'dashboard',
		title: 'Dashboard',
		description: 'Panel principal con resumen de actividades',
		href: '/dashboard',
		icon: <TrendingUp size={16} />,
		category: 'pages',
		keywords: ['inicio', 'principal', 'resumen', 'estadísticas']
	},
	{
		id: 'workouts',
		title: 'Rutinas',
		description: 'Gestiona tus entrenamientos y rutinas',
		href: '/workouts',
		icon: <Dumbbell size={16} />,
		category: 'workouts',
		keywords: ['entrenamientos', 'rutinas', 'ejercicios', 'fitness']
	},
	{
		id: 'exercises',
		title: 'Ejercicios',
		description: 'Biblioteca completa de ejercicios',
		href: '/dashboard/exercises',
		icon: <Zap size={16} />,
		category: 'exercises',
		keywords: ['ejercicios', 'biblioteca', 'movimientos', 'técnica']
	},
	{
		id: 'progress',
		title: 'Progreso',
		description: 'Seguimiento de tu evolución y métricas',
		href: '/dashboard/progress',
		icon: <TrendingUp size={16} />,
		category: 'pages',
		keywords: ['progreso', 'evolución', 'métricas', 'estadísticas', 'seguimiento']
	},
	{
		id: 'calendar',
		title: 'Calendario',
		description: 'Agenda de entrenamientos y citas',
		href: '/dashboard/calendar',
		icon: <Calendar size={16} />,
		category: 'pages',
		keywords: ['calendario', 'agenda', 'citas', 'horarios', 'programación']
	},
	{
		id: 'profile',
		title: 'Perfil',
		description: 'Información personal y configuración',
		href: '/dashboard/profile',
		icon: <Users size={16} />,
		category: 'pages',
		keywords: ['perfil', 'información', 'datos', 'personal']
	},
	{
		id: 'settings',
		title: 'Configuración',
		description: 'Ajustes de la aplicación',
		href: '/dashboard/settings',
		icon: <Settings size={16} />,
		category: 'settings',
		keywords: ['configuración', 'ajustes', 'preferencias', 'opciones']
	},
	// Páginas específicas para entrenadores
	{
		id: 'trainer-clients',
		title: 'Mis Clientes',
		description: 'Gestión de clientes y seguimiento',
		href: '/dashboard/trainer/clients',
		icon: <Users size={16} />,
		category: 'clients',
		keywords: ['clientes', 'usuarios', 'seguimiento', 'gestión']
	},
	{
		id: 'trainer-analytics',
		title: 'Analytics',
		description: 'Estadísticas detalladas y reportes',
		href: '/dashboard/trainer/analytics',
		icon: <TrendingUp size={16} />,
		category: 'pages',
		keywords: ['analytics', 'estadísticas', 'reportes', 'métricas', 'análisis']
	}
]

const recentSearches = [
	'Rutina de pecho',
	'Ejercicios de cardio',
	'Progreso semanal',
	'Configurar notificaciones'
]

const trendingSearches = [
	'Rutinas HIIT',
	'Ejercicios en casa',
	'Plan de nutrición',
	'Seguimiento de peso'
]

export function GlobalSearch({ className, userRole = 'CLIENT' }: GlobalSearchProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const router = useRouter()
	const searchRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const dialogId = 'global-search-dialog'
  const titleId = 'global-search-title'
  const liveRegionRef = useRef<HTMLDivElement>(null)

	// Filtrar resultados basado en el rol del usuario
	const getFilteredData = useCallback(() => {
		if (userRole === 'TRAINER') {
			return searchData // Los entrenadores ven todo
		}
		// Los clientes no ven páginas específicas de entrenador
		return searchData.filter(item => !item.href.includes('/trainer/'))
	}, [userRole])

	// Función de búsqueda
	const searchItems = useCallback((searchQuery: string) => {
		if (!searchQuery.trim()) {
			setResults([])
			return
		}

		const filteredData = getFilteredData()
		const searchTerms = searchQuery.toLowerCase().split(' ')
		
		const filtered = filteredData.filter(item => {
			const searchableText = [
				item.title,
				item.description,
				...(item.keywords || [])
			].join(' ').toLowerCase()
			
			return searchTerms.every(term => searchableText.includes(term))
		})

		// Ordenar por relevancia
		const sorted = filtered.sort((a, b) => {
			const aTitle = a.title.toLowerCase()
			const bTitle = b.title.toLowerCase()
			const queryLower = searchQuery.toLowerCase()
			
			// Priorizar coincidencias exactas en el título
			if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1
			if (!aTitle.includes(queryLower) && bTitle.includes(queryLower)) return 1
			
			return 0
		})

		setResults(sorted.slice(0, 8)) // Limitar a 8 resultados
	}, [getFilteredData])

	// Manejar cambios en el input
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			searchItems(query)
		}, 150) // Debounce de 150ms

		return () => clearTimeout(timeoutId)
	}, [query, userRole, searchItems])

	// Click de resultado (declarado antes de usarlo en efectos)
	const handleResultClick = useCallback((result: SearchResult) => {
		router.push(result.href)
		setIsOpen(false)
		setQuery('')
		setSelectedIndex(-1)
	}, [router])

	// Manejar teclas
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) {
				// Abrir búsqueda con Cmd/Ctrl + K
				if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
					e.preventDefault()
					setIsOpen(true)
				}
				return
			}

			switch (e.key) {
				case 'Escape':
					setIsOpen(false)
					setQuery('')
					setSelectedIndex(-1)
					break
				case 'ArrowDown':
					e.preventDefault()
					setSelectedIndex(prev => 
						prev < results.length - 1 ? prev + 1 : prev
					)
					break
				case 'ArrowUp':
					e.preventDefault()
					setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
					break
				case 'Enter':
					e.preventDefault()
					if (selectedIndex >= 0 && results[selectedIndex]) {
						handleResultClick(results[selectedIndex])
					}
					break
			}
		}

			document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, results, selectedIndex, handleResultClick])

	// Cerrar al hacer clic fuera
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isOpen])

	// Enfocar input al abrir
	useEffect(() => {
		if (isOpen && inputRef.current) {
			previouslyFocused.current = document.activeElement as HTMLElement
			inputRef.current.focus()
		}

    // Simple focus trap inside modal
    const trapFocus = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key !== 'Tab') return
      const dialog = document.getElementById(dialogId)
      if (!dialog) return
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)

    return () => {
      document.removeEventListener('keydown', trapFocus)
      // Restore focus when closing
      if (!isOpen && previouslyFocused.current) {
        previouslyFocused.current.focus()
      }
    }
	}, [isOpen])

	// (fin reordenamiento)

	const handleQuickSearch = (searchTerm: string) => {
		setQuery(searchTerm)
		searchItems(searchTerm)
	}

	const getCategoryColor = (category: SearchResult['category']) => {
		switch (category) {
			case 'pages': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
			case 'workouts': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
			case 'exercises': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
			case 'clients': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
			case 'settings': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
			default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
		}
	}

	return (
		<div ref={searchRef} className={cn("relative", className)}>
			{/* Search Trigger */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => setIsOpen(true)}
				className="w-full max-w-sm justify-start text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				aria-controls={dialogId}
			>
				<Search size={16} className="mr-2" />
				<span className="flex-1 text-left">Buscar...</span>
				<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>

			{/* Search Modal */}
			{isOpen && (
				<>
					{/* Backdrop */}
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
					
					{/* Modal */}
					<div
						id={dialogId}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
					>
						{/* Search Input */}
						<div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
							<Search size={20} className="text-gray-400" aria-hidden="true" />
							<h2 id={titleId} className="sr-only">Búsqueda global</h2>
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Buscar páginas, rutinas, ejercicios..."
								className="flex-1 bg-transparent border-none outline-none text-lg placeholder-gray-400 dark:placeholder-gray-500"
								role="searchbox"
								aria-autocomplete="list"
								aria-controls="search-results"
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsOpen(false)}
								className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
							>
								<X size={16} />
							</Button>
						</div>

						{/* Results */}
						<div className="max-h-96 overflow-y-auto" aria-live="polite" aria-relevant="additions" aria-atomic="true">
							<div ref={liveRegionRef} className="sr-only" aria-live="polite">
								{results.length} resultados
							</div>
							{query.trim() === '' ? (
								/* Empty State */
								<div className="p-6">
									{/* Recent Searches */}
									<div className="mb-6">
										<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
											<Clock size={14} />
											Búsquedas recientes
										</h3>
										<div className="flex flex-wrap gap-2">
											{recentSearches.map((search, index) => (
												<button
													key={index}
													onClick={() => handleQuickSearch(search)}
													className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
												>
													{search}
												</button>
											))}
										</div>
									</div>

									{/* Trending Searches */}
									<div>
										<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
											<TrendingUp size={14} />
											Tendencias
										</h3>
										<div className="flex flex-wrap gap-2">
											{trendingSearches.map((search, index) => (
												<button
													key={index}
													onClick={() => handleQuickSearch(search)}
													className="px-3 py-1.5 text-sm bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 text-primary dark:text-blue-400 rounded-lg transition-all duration-200 hover:scale-105"
												>
													{search}
												</button>
											))}
										</div>
									</div>
								</div>
							) : results.length > 0 ? (
								/* Search Results */
								<div className="py-2" id="search-results" role="listbox">
									{results.map((result, index) => (
										<button
											key={result.id}
											onClick={() => handleResultClick(result)}
											className={cn(
												"w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left",
												selectedIndex === index && "bg-gray-50 dark:bg-gray-800"
											)}
											role="option"
											aria-selected={selectedIndex === index}
										>
											<div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
												{result.icon}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-medium text-gray-900 dark:text-white truncate">
														{result.title}
													</h4>
													<Badge 
														variant="secondary" 
														className={cn("text-xs px-2 py-0.5", getCategoryColor(result.category))}
													>
														{result.category}
													</Badge>
												</div>
												<p className="text-sm text-gray-500 dark:text-gray-400 truncate">
													{result.description}
												</p>
											</div>
										</button>
									))}
								</div>
							) : (
								/* No Results */
								<div className="p-8 text-center">
									<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
										<Search size={24} className="text-gray-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
										No se encontraron resultados
									</h3>
									<p className="text-gray-500 dark:text-gray-400">
										Intenta con otros términos de búsqueda
									</p>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
							<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
								<div className="flex items-center gap-4">
									<span className="flex items-center gap-1">
										<kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↑↓</kbd>
										Navegar
									</span>
									<span className="flex items-center gap-1">
										<kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↵</kbd>
										Seleccionar
									</span>
									<span className="flex items-center gap-1">
										<kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">esc</kbd>
										Cerrar
									</span>
								</div>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	)
}

export default GlobalSearch
