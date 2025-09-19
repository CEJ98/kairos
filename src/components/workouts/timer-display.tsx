'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
	Clock, 
	Play, 
	Pause, 
	AlertTriangle,
	CheckCircle2,
	Timer
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimerDisplayProps {
	timeRemaining: number
	totalTime: number
	timerState: 'idle' | 'exercise' | 'rest' | 'paused' | 'completed'
	size?: 'sm' | 'md' | 'lg'
	showProgress?: boolean
	showWarning?: boolean
	warningThreshold?: number
	className?: string
}

export function TimerDisplay({
	timeRemaining,
	totalTime,
	timerState,
	size = 'md',
	showProgress = true,
	showWarning = true,
	warningThreshold = 10,
	className
}: TimerDisplayProps) {
	const [isBlinking, setIsBlinking] = useState(false)

	// Efecto de parpadeo para advertencia
	useEffect(() => {
		if (showWarning && timeRemaining <= warningThreshold && timeRemaining > 0 && timerState !== 'paused') {
			const interval = setInterval(() => {
				setIsBlinking(prev => !prev)
			}, 500)
			return () => clearInterval(interval)
		} else {
			setIsBlinking(false)
		}
	}, [timeRemaining, warningThreshold, showWarning, timerState])

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const getTimerColor = () => {
		if (timerState === 'completed') return 'text-green-500'
		if (timerState === 'paused') return 'text-gray-500'
		if (timerState === 'exercise') {
			if (timeRemaining <= warningThreshold) return 'text-red-500'
			return 'text-green-600'
		}
		if (timerState === 'rest') {
			if (timeRemaining <= warningThreshold) return 'text-orange-500'
			return 'text-blue-600'
		}
		return 'text-gray-600'
	}

	const getProgressColor = () => {
		if (timerState === 'exercise') return 'bg-green-500'
		if (timerState === 'rest') return 'bg-blue-500'
		return 'bg-gray-500'
	}

	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return {
					container: 'p-3',
					time: 'text-2xl',
					icon: 'h-4 w-4',
					badge: 'text-xs'
				}
			case 'lg':
				return {
					container: 'p-8',
					time: 'text-8xl',
					icon: 'h-8 w-8',
					badge: 'text-base'
				}
			default:
				return {
					container: 'p-6',
					time: 'text-6xl',
					icon: 'h-6 w-6',
					badge: 'text-sm'
				}
		}
	}

	const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0
	const sizeClasses = getSizeClasses()

	return (
		<Card className={cn('text-center', className)}>
			<CardContent className={sizeClasses.container}>
				{/* Timer Display */}
				<div className={cn(
					'font-mono font-bold mb-4 transition-all duration-200',
					sizeClasses.time,
					getTimerColor(),
					isBlinking && 'animate-pulse scale-105'
				)}>
					{formatTime(timeRemaining)}
				</div>

				{/* Status Badge */}
				<div className="flex items-center justify-center gap-2 mb-4">
					{timerState === 'exercise' && (
						<Badge className={cn('bg-green-500', sizeClasses.badge)}>
							<Play className={cn(sizeClasses.icon, 'mr-1')} />
							Ejercicio
						</Badge>
					)}
					{timerState === 'rest' && (
						<Badge className={cn('bg-blue-500', sizeClasses.badge)}>
							<Clock className={cn(sizeClasses.icon, 'mr-1')} />
							Descanso
						</Badge>
					)}
					{timerState === 'paused' && (
						<Badge variant="secondary" className={sizeClasses.badge}>
							<Pause className={cn(sizeClasses.icon, 'mr-1')} />
							Pausado
						</Badge>
					)}
					{timerState === 'completed' && (
						<Badge className={cn('bg-green-500', sizeClasses.badge)}>
							<CheckCircle2 className={cn(sizeClasses.icon, 'mr-1')} />
							Completado
						</Badge>
					)}
					{timerState === 'idle' && (
						<Badge variant="outline" className={sizeClasses.badge}>
							<Timer className={cn(sizeClasses.icon, 'mr-1')} />
							Listo
						</Badge>
					)}

					{/* Warning indicator */}
					{showWarning && timeRemaining <= warningThreshold && timeRemaining > 0 && timerState !== 'paused' && (
						<Badge variant="destructive" className={cn(sizeClasses.badge, 'animate-pulse')}>
							<AlertTriangle className={cn(sizeClasses.icon, 'mr-1')} />
							¡Últimos segundos!
						</Badge>
					)}
				</div>

				{/* Progress Bar */}
				{showProgress && totalTime > 0 && (
					<div className="space-y-2">
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>Progreso</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<div className="relative">
							<Progress 
								value={progress} 
								className="h-2" 
							/>
							<div 
								className={cn(
									'absolute top-0 left-0 h-2 rounded-full transition-all duration-1000',
									getProgressColor()
								)}
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				)}

				{/* Time remaining text */}
				{totalTime > 0 && (
					<div className="mt-2 text-xs text-muted-foreground">
						{timeRemaining > 0 ? (
							<span>Quedan {formatTime(timeRemaining)}</span>
						) : (
							<span>¡Tiempo completado!</span>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}

// Componente de temporizador circular
export function CircularTimer({
	timeRemaining,
	totalTime,
	timerState,
	size = 120,
	strokeWidth = 8,
	className
}: {
	timeRemaining: number
	totalTime: number
	timerState: 'idle' | 'exercise' | 'rest' | 'paused' | 'completed'
	size?: number
	strokeWidth?: number
	className?: string
}) {
	const radius = (size - strokeWidth) / 2
	const circumference = radius * 2 * Math.PI
	const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0
	const strokeDashoffset = circumference - (progress / 100) * circumference

	const getStrokeColor = () => {
		if (timerState === 'exercise') return '#22c55e' // green-500
		if (timerState === 'rest') return '#3b82f6' // blue-500
		if (timerState === 'paused') return '#6b7280' // gray-500
		return '#e5e7eb' // gray-200
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	return (
		<div className={cn('relative inline-flex items-center justify-center', className)}>
			<svg
				width={size}
				height={size}
				className="transform -rotate-90"
			>
				{/* Background circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="#e5e7eb"
					strokeWidth={strokeWidth}
					fill="transparent"
				/>
				{/* Progress circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={getStrokeColor()}
					strokeWidth={strokeWidth}
					fill="transparent"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					className="transition-all duration-1000 ease-in-out"
				/>
			</svg>
			{/* Timer text */}
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<div className="text-lg font-mono font-bold">
					{formatTime(timeRemaining)}
				</div>
				<div className="text-xs text-muted-foreground capitalize">
					{timerState === 'exercise' ? 'Ejercicio' : 
					 timerState === 'rest' ? 'Descanso' : 
					 timerState === 'paused' ? 'Pausado' : 'Listo'}
				</div>
			</div>
		</div>
	)
}