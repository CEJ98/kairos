/**
 * UX Enhancements Components
 * Improved user experience components and patterns
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Filter, X, Check, AlertCircle, Info, Loader2 } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { Progress } from './progress'
import { cn } from '@/lib/utils'

// Enhanced Navigation Breadcrumbs
interface BreadcrumbItem {
	label: string
	href?: string
	icon?: React.ReactNode
	isActive?: boolean
}

interface EnhancedBreadcrumbsProps {
	items: BreadcrumbItem[]
	onNavigate?: (href: string) => void
	className?: string
}

export function EnhancedBreadcrumbs({ items, onNavigate, className }: EnhancedBreadcrumbsProps) {
	return (
		<nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
			{items.map((item, index) => (
				<React.Fragment key={index}>
					{index > 0 && (
						<ChevronRight className="h-4 w-4 text-muted-foreground" />
					)}
					<motion.div
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.1 }}
						className={cn(
							'flex items-center space-x-1',
							item.isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
							item.href && !item.isActive && 'cursor-pointer transition-colors'
						)}
						onClick={() => item.href && !item.isActive && onNavigate?.(item.href)}
					>
						{item.icon && <span className="h-4 w-4">{item.icon}</span>}
						<span>{item.label}</span>
					</motion.div>
				</React.Fragment>
			))}
		</nav>
	)
}

// Smart Search with Filters
interface SearchFilter {
	id: string
	label: string
	type: 'select' | 'checkbox' | 'range'
	options?: Array<{ value: string; label: string }>
	min?: number
	max?: number
	value?: any
}

interface SmartSearchProps {
	placeholder?: string
	filters?: SearchFilter[]
	onSearch: (query: string, filters: Record<string, any>) => void
	loading?: boolean
	resultsCount?: number
	className?: string
}

export function SmartSearch({ 
	placeholder = 'Search...', 
	filters = [], 
	onSearch, 
	loading = false,
	resultsCount,
	className 
}: SmartSearchProps) {
	const [query, setQuery] = useState('')
	const [filterValues, setFilterValues] = useState<Record<string, any>>({})
	const [showFilters, setShowFilters] = useState(false)
	const [debouncedQuery, setDebouncedQuery] = useState('')

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query)
		}, 300)

		return () => clearTimeout(timer)
	}, [query])

	// Trigger search when query or filters change
	useEffect(() => {
		if (debouncedQuery || Object.keys(filterValues).length > 0) {
			onSearch(debouncedQuery, filterValues)
		}
	}, [debouncedQuery, filterValues, onSearch])

	const handleFilterChange = useCallback((filterId: string, value: any) => {
		setFilterValues(prev => ({
			...prev,
			[filterId]: value
		}))
	}, [])

	const clearFilters = useCallback(() => {
		setFilterValues({})
		setQuery('')
	}, [])

	const activeFiltersCount = useMemo(() => {
		return Object.values(filterValues).filter(value => 
			value !== undefined && value !== null && value !== '' && 
			(Array.isArray(value) ? value.length > 0 : true)
		).length
	}, [filterValues])

	return (
		<div className={cn('space-y-4', className)}>
			<div className="flex items-center space-x-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={placeholder}
						className="pl-10 pr-10"
					/>
					{loading && (
						<Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
					)}
					{query && !loading && (
						<Button
							variant="ghost"
							size="sm"
							className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
							onClick={() => setQuery('')}
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>

				{filters.length > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowFilters(!showFilters)}
						className="relative"
					>
						<Filter className="h-4 w-4 mr-2" />
						Filters
						{activeFiltersCount > 0 && (
							<Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
								{activeFiltersCount}
							</Badge>
						)}
					</Button>
				)}

				{(activeFiltersCount > 0 || query) && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
					>
						Clear all
					</Button>
				)}
			</div>

			{resultsCount !== undefined && (
				<div className="text-sm text-muted-foreground">
					{resultsCount} result{resultsCount !== 1 ? 's' : ''} found
				</div>
			)}

			<AnimatePresence>
				{showFilters && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="border rounded-lg p-4 space-y-4"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filters.map((filter) => (
								<div key={filter.id} className="space-y-2">
									<label className="text-sm font-medium">{filter.label}</label>
									{filter.type === 'select' && (
										<select
											value={filterValues[filter.id] || ''}
											onChange={(e) => handleFilterChange(filter.id, e.target.value)}
											className="w-full p-2 border rounded-md"
										>
											<option value="">All</option>
											{filter.options?.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									)}
									{filter.type === 'range' && (
										<div className="space-y-2">
											<input
												type="range"
												min={filter.min}
												max={filter.max}
												value={filterValues[filter.id] || filter.min}
												onChange={(e) => handleFilterChange(filter.id, parseInt(e.target.value))}
												className="w-full"
											/>
											<div className="flex justify-between text-xs text-muted-foreground">
												<span>{filter.min}</span>
												<span>{filterValues[filter.id] || filter.min}</span>
												<span>{filter.max}</span>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

// Enhanced Progress Indicator
interface ProgressStep {
	id: string
	label: string
	description?: string
	status: 'pending' | 'current' | 'completed' | 'error'
	icon?: React.ReactNode
}

interface EnhancedProgressProps {
	steps: ProgressStep[]
	orientation?: 'horizontal' | 'vertical'
	showLabels?: boolean
	showDescriptions?: boolean
	className?: string
}

export function EnhancedProgress({ 
	steps, 
	orientation = 'horizontal', 
	showLabels = true,
	showDescriptions = false,
	className 
}: EnhancedProgressProps) {
	const completedSteps = steps.filter(step => step.status === 'completed').length
	const progressPercentage = (completedSteps / steps.length) * 100

	return (
		<div className={cn('space-y-4', className)}>
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">
					Step {completedSteps + 1} of {steps.length}
				</div>
				<div className="text-sm text-muted-foreground">
					{Math.round(progressPercentage)}% complete
				</div>
			</div>

			<Progress value={progressPercentage} className="h-2" />

			<div className={cn(
				'flex',
				orientation === 'horizontal' ? 'flex-row space-x-4' : 'flex-col space-y-4'
			)}>
				{steps.map((step, index) => {
					const isLast = index === steps.length - 1

					return (
						<div key={step.id} className={cn(
							'flex items-center',
							orientation === 'horizontal' ? 'flex-col' : 'flex-row space-x-3'
						)}>
							<div className="relative flex items-center">
								<motion.div
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ delay: index * 0.1 }}
									className={cn(
										'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
										step.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
										step.status === 'current' && 'border-primary bg-primary/10 text-primary',
										step.status === 'error' && 'border-destructive bg-destructive/10 text-destructive',
										step.status === 'pending' && 'border-muted-foreground/30 bg-muted text-muted-foreground'
									)}
								>
									{step.status === 'completed' ? (
										<Check className="h-4 w-4" />
									) : step.status === 'error' ? (
										<AlertCircle className="h-4 w-4" />
									) : step.icon ? (
										step.icon
									) : (
										<span className="text-sm font-medium">{index + 1}</span>
									)}
								</motion.div>

								{!isLast && orientation === 'horizontal' && (
									<div className={cn(
										'absolute top-8 left-1/2 h-8 w-px -translate-x-1/2',
										step.status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/30'
									)} />
								)}

								{!isLast && orientation === 'vertical' && (
									<div className={cn(
										'absolute left-4 top-8 h-8 w-px',
										step.status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/30'
									)} />
								)}
							</div>

							{(showLabels || showDescriptions) && (
								<div className={cn(
									'text-center',
									orientation === 'vertical' && 'text-left flex-1'
								)}>
									{showLabels && (
										<div className={cn(
											'text-sm font-medium',
											step.status === 'current' && 'text-primary',
											step.status === 'error' && 'text-destructive'
										)}>
											{step.label}
										</div>
									)}
									{showDescriptions && step.description && (
										<div className="text-xs text-muted-foreground mt-1">
											{step.description}
										</div>
									)}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}

// Enhanced Feedback System
type FeedbackType = 'success' | 'error' | 'warning' | 'info'

interface FeedbackMessage {
	id: string
	type: FeedbackType
	title: string
	message?: string
	action?: {
		label: string
		onClick: () => void
	}
	autoDismiss?: boolean
	duration?: number
}

interface FeedbackSystemProps {
	messages: FeedbackMessage[]
	onDismiss: (id: string) => void
	position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
	className?: string
}

export function FeedbackSystem({ 
	messages, 
	onDismiss, 
	position = 'top-right',
	className 
}: FeedbackSystemProps) {
	useEffect(() => {
		messages.forEach(message => {
			if (message.autoDismiss !== false) {
				const duration = message.duration || 5000
				const timer = setTimeout(() => {
					onDismiss(message.id)
				}, duration)

				return () => clearTimeout(timer)
			}
		})
	}, [messages, onDismiss])

	const getIcon = (type: FeedbackType) => {
		switch (type) {
			case 'success':
				return <Check className="h-4 w-4" />
			case 'error':
				return <AlertCircle className="h-4 w-4" />
			case 'warning':
				return <AlertCircle className="h-4 w-4" />
			case 'info':
				return <Info className="h-4 w-4" />
		}
	}

	const getStyles = (type: FeedbackType) => {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-200 text-green-800'
			case 'error':
				return 'bg-red-50 border-red-200 text-red-800'
			case 'warning':
				return 'bg-yellow-50 border-yellow-200 text-yellow-800'
			case 'info':
				return 'bg-blue-50 border-blue-200 text-blue-800'
		}
	}

	const positionClasses = {
		'top-right': 'top-4 right-4',
		'top-left': 'top-4 left-4',
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4'
	}

	return (
		<div className={cn(
			'fixed z-50 flex flex-col space-y-2 max-w-sm w-full',
			positionClasses[position],
			className
		)}>
			<AnimatePresence>
				{messages.map((message) => (
					<motion.div
						key={message.id}
						initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.9 }}
						animate={{ opacity: 1, x: 0, scale: 1 }}
						exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.9 }}
						transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						className={cn(
							'p-4 rounded-lg border shadow-lg',
							getStyles(message.type)
						)}
					>
						<div className="flex items-start space-x-3">
							<div className="flex-shrink-0">
								{getIcon(message.type)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-medium text-sm">
									{message.title}
								</div>
								{message.message && (
									<div className="text-sm mt-1 opacity-90">
										{message.message}
									</div>
								)}
								{message.action && (
									<Button
										variant="ghost"
										size="sm"
										className="mt-2 h-6 px-2 text-xs"
										onClick={message.action.onClick}
									>
										{message.action.label}
									</Button>
								)}
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="flex-shrink-0 h-6 w-6 p-0 opacity-70 hover:opacity-100"
								onClick={() => onDismiss(message.id)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	)
}

// Enhanced Loading States
interface LoadingStateProps {
	type?: 'spinner' | 'skeleton' | 'pulse' | 'dots'
	size?: 'sm' | 'md' | 'lg'
	text?: string
	className?: string
}

export function LoadingState({ type = 'spinner', size = 'md', text, className }: LoadingStateProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8'
	}

	if (type === 'skeleton') {
		return (
			<div className={cn('animate-pulse space-y-2', className)}>
				<div className="h-4 bg-muted rounded w-3/4"></div>
				<div className="h-4 bg-muted rounded w-1/2"></div>
				<div className="h-4 bg-muted rounded w-5/6"></div>
			</div>
		)
	}

	if (type === 'pulse') {
		return (
			<div className={cn('flex items-center justify-center', className)}>
				<div className={cn(
					'rounded-full bg-primary animate-pulse',
					sizeClasses[size]
				)} />
				{text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
			</div>
		)
	}

	if (type === 'dots') {
		return (
			<div className={cn('flex items-center justify-center space-x-1', className)}>
				{[0, 1, 2].map((i) => (
					<motion.div
						key={i}
						className={cn('rounded-full bg-primary', sizeClasses[size])}
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.7, 1, 0.7]
						}}
						transition={{
							duration: 1,
							repeat: Infinity,
							delay: i * 0.2
						}}
					/>
				))}
				{text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
			</div>
		)
	}

	// Default spinner
	return (
		<div className={cn('flex items-center justify-center', className)}>
			<Loader2 className={cn('animate-spin', sizeClasses[size])} />
			{text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
		</div>
	)
}

// Enhanced Empty States
interface EmptyStateProps {
	title: string
	description?: string
	icon?: React.ReactNode
	action?: {
		label: string
		onClick: () => void
		variant?: 'default' | 'outline'
	}
	className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex flex-col items-center justify-center text-center p-8 space-y-4',
				className
			)}
		>
			{icon && (
				<div className="text-muted-foreground/50">
					{icon}
				</div>
			)}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold text-foreground">{title}</h3>
				{description && (
					<p className="text-sm text-muted-foreground max-w-sm">
						{description}
					</p>
				)}
			</div>
			{action && (
				<Button
					variant={action.variant || 'default'}
					onClick={action.onClick}
				>
					{action.label}
				</Button>
			)}
		</motion.div>
	)
}