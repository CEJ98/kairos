'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
	Play,
	Pause,
	SkipForward,
	Clock,
	Dumbbell,
	CheckCircle,
	Plus,
	AlertCircle,
	Timer,
	Volume2,
	VolumeX
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Exercise {
	id: string
	name: string
	description?: string
	category: string
	muscleGroups?: string
	instructions?: string
	imageUrl?: string
	videoUrl?: string
}

interface RoutineSet {
	id: string
	exerciseId: string
	order: number
	reps?: number
	weight?: number
	duration?: number
	distance?: number
	restTime?: number
	notes?: string
	exercise: Exercise
}

interface RoutineBlock {
	id: string
	name: string
	order: number
	rounds: number
	restBetweenRounds?: number
	notes?: string
	sets: RoutineSet[]
}

interface Routine {
	id: string
	name: string
	description?: string
	category?: string
	difficulty?: string
	estimatedDuration?: number
	blocks: RoutineBlock[]
}

interface WorkoutSession {
	id: string
	routineId: string
	startTime: string
	status: string
}

type TimerState = 'idle' | 'working' | 'resting' | 'paused'

interface PlayerRutinaProps {
	onClose?: () => void
}

export function PlayerRutina({ onClose }: PlayerRutinaProps) {
	const { data: session } = useSession()
	const [routine, setRoutine] = useState<Routine | null>(null)
	const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	
	// Estado del entrenamiento
	const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
	const [currentSetIndex, setCurrentSetIndex] = useState(0)
	const [currentRound, setCurrentRound] = useState(1)
	const [completedSets, setCompletedSets] = useState<Set<string>>(new Set())
	
	// Estado del temporizador
	const [timerState, setTimerState] = useState<TimerState>('idle')
	const [timeRemaining, setTimeRemaining] = useState(0)
	const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
	
	// Configuración de audio
	const [soundEnabled, setSoundEnabled] = useState(true)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	
	// Cargar rutina asignada más reciente
	const loadAssignedRoutine = useCallback(async () => {
		if (!session?.user?.id) return
		
		try {
			setIsLoading(true)
			setError(null)
			
			const response = await fetch('/api/routines/assigned')
			if (!response.ok) {
				if (response.status === 404) {
					setError('No tienes rutinas asignadas. Contacta a tu entrenador.')
					return
				}
				throw new Error('Error al cargar la rutina')
			}
			
			const data = await response.json()
			setRoutine(data.routine)
		} catch (error) {
			console.error('Error loading routine:', error)
			setError('Error al cargar la rutina asignada')
			toast.error('Error al cargar la rutina')
		} finally {
			setIsLoading(false)
		}
	}, [session?.user?.id])
	
	// Generar beep programáticamente
	const generateBeep = useCallback(() => {
		if (typeof window !== 'undefined' && window.AudioContext) {
			const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
			const oscillator = audioContext.createOscillator()
			const gainNode = audioContext.createGain()
			
			oscillator.connect(gainNode)
			gainNode.connect(audioContext.destination)
			
			oscillator.frequency.value = 800 // Hz
			oscillator.type = 'sine'
			
			gainNode.gain.setValueAtTime(0, audioContext.currentTime)
			gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
			
			oscillator.start(audioContext.currentTime)
			oscillator.stop(audioContext.currentTime + 0.2)
		}
	}, [])
	
	// Cargar rutina al montar el componente
	useEffect(() => {
		loadAssignedRoutine()
	}, [loadAssignedRoutine])
	
	// Limpiar temporizador al desmontar
	useEffect(() => {
		return () => {
			if (timerInterval) {
				clearInterval(timerInterval)
			}
		}
	}, [timerInterval])
	
	// Reproducir sonido
	const playBeep = useCallback(() => {
		if (soundEnabled) {
			generateBeep()
		}
	}, [soundEnabled, generateBeep])
	
	// Iniciar sesión de entrenamiento
	const startWorkoutSession = useCallback(async () => {
		if (!routine || !session?.user?.id) return
		
		try {
			const response = await fetch('/api/workout-sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					routineId: routine.id,
					startTime: new Date().toISOString()
				})
			})
			
			if (!response.ok) throw new Error('Error al iniciar sesión')
			
			const session = await response.json()
			setCurrentSession(session)
			toast.success('¡Entrenamiento iniciado!')
		} catch (error) {
			console.error('Error starting session:', error)
			toast.error('Error al iniciar el entrenamiento')
		}
	}, [routine, session?.user?.id])
	
	// Iniciar temporizador
	const startTimer = useCallback((seconds: number, state: TimerState) => {
		if (timerInterval) clearInterval(timerInterval)
		
		setTimeRemaining(seconds)
		setTimerState(state)
		
		const interval = setInterval(() => {
			setTimeRemaining(prev => {
				if (prev <= 1) {
					clearInterval(interval)
					setTimerState('idle')
					playBeep()
					
					if (state === 'resting') {
						toast.success('¡Comienza ejercicio!')
					}
					
					return 0
				}
				return prev - 1
			})
		}, 1000)
		
		setTimerInterval(interval)
	}, [timerInterval, playBeep])
	
	// Pausar/reanudar temporizador
	const toggleTimer = useCallback(() => {
		if (timerState === 'paused') {
			startTimer(timeRemaining, timerState === 'paused' ? 'working' : 'resting')
		} else if (timerState !== 'idle') {
			if (timerInterval) clearInterval(timerInterval)
			setTimerState('paused')
		}
	}, [timerState, timeRemaining, startTimer, timerInterval])
	
	// Saltar descanso
	const skipRest = useCallback(() => {
		if (timerState === 'resting') {
			if (timerInterval) clearInterval(timerInterval)
			setTimerState('idle')
			setTimeRemaining(0)
			toast.success('Descanso saltado')
		}
	}, [timerState, timerInterval])
	
	// Agregar 30 segundos
	const addThirtySeconds = useCallback(() => {
		if (timerState === 'resting') {
			setTimeRemaining(prev => prev + 30)
			toast.success('+30 segundos agregados')
		}
	}, [timerState])
	
	// Completar serie
	const completeSet = useCallback(async () => {
		if (!routine || !currentSession) return
		
		const currentBlock = routine.blocks[currentBlockIndex]
		const currentSet = currentBlock?.sets[currentSetIndex]
		
		if (!currentSet) return
		
		try {
			// Guardar set_log
			const response = await fetch('/api/set-logs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: currentSession.id,
					setId: currentSet.id,
					setIndex: currentSetIndex + 1,
					repsCompleted: currentSet.reps,
					weightUsed: currentSet.weight,
					durationActual: currentSet.duration,
					startTime: new Date().toISOString(),
					endTime: new Date().toISOString()
				})
			})
			
			if (!response.ok) throw new Error('Error al guardar serie')
			
			// Marcar serie como completada
			setCompletedSets(prev => new Set([...prev, currentSet.id]))
			
			// Iniciar descanso si está configurado
			if (currentSet.restTime && currentSet.restTime > 0) {
				startTimer(currentSet.restTime, 'resting')
				toast.success(`Serie completada. Descansa ${currentSet.restTime}s`)
			} else {
				toast.success('Serie completada')
			}
			
		} catch (error) {
			console.error('Error completing set:', error)
			toast.error('Error al completar la serie')
		}
	}, [routine, currentSession, currentBlockIndex, currentSetIndex, startTimer])
	
	// Siguiente ejercicio
	const nextExercise = useCallback(() => {
		if (!routine) return
		
		const currentBlock = routine.blocks[currentBlockIndex]
		if (!currentBlock) return
		
		// Si hay más sets en el bloque actual
		if (currentSetIndex < currentBlock.sets.length - 1) {
			setCurrentSetIndex(prev => prev + 1)
			return
		}
		
		// Si hay más rondas en el bloque actual
		if (currentRound < currentBlock.rounds) {
			setCurrentRound(prev => prev + 1)
			setCurrentSetIndex(0)
			return
		}
		
		// Si hay más bloques
		if (currentBlockIndex < routine.blocks.length - 1) {
			setCurrentBlockIndex(prev => prev + 1)
			setCurrentSetIndex(0)
			setCurrentRound(1)
			return
		}
		
		// Entrenamiento completado
		toast.success('¡Entrenamiento completado!')
		if (onClose) onClose()
	}, [routine, currentBlockIndex, currentSetIndex, currentRound, onClose])
	
	// Formatear tiempo
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}
	
	// Calcular progreso
	const calculateProgress = () => {
		if (!routine) return 0
		
		let totalSets = 0
		let completedCount = 0
		
		routine.blocks.forEach(block => {
			block.sets.forEach(set => {
				totalSets += block.rounds
				if (completedSets.has(set.id)) {
					completedCount += block.rounds
				}
			})
		})
		
		return totalSets > 0 ? (completedCount / totalSets) * 100 : 0
	}
	
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Cargando rutina...</p>
				</div>
			</div>
		)
	}
	
	if (error) {
		return (
			<Card className="max-w-md mx-auto">
				<CardContent className="pt-6">
					<div className="text-center">
						<AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">Sin rutina asignada</h3>
						<p className="text-gray-600 mb-4">{error}</p>
						<Button onClick={onClose} variant="outline">
							Volver al Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>
		)
	}
	
	if (!routine) return null
	
	const currentBlock = routine.blocks[currentBlockIndex]
	const currentSet = currentBlock?.sets[currentSetIndex]
	const progress = calculateProgress()
	
	return (
		<div className="max-w-4xl mx-auto p-4 space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Dumbbell className="h-5 w-5" />
								{routine.name}
							</CardTitle>
							{routine.description && (
								<p className="text-sm text-gray-600 mt-1">{routine.description}</p>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSoundEnabled(!soundEnabled)}
							>
								{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
							</Button>
							{onClose && (
								<Button variant="outline" size="sm" onClick={onClose}>
									Salir
								</Button>
							)}
						</div>
					</div>
					<div className="mt-4">
						<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
							<span>Progreso general</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>
				</CardHeader>
			</Card>
			
			{/* Temporizador */}
			{timerState !== 'idle' && (
				<Card>
					<CardContent className="pt-6">
						<div className="text-center">
							<div className="text-4xl font-bold mb-2">
								{formatTime(timeRemaining)}
							</div>
							<Badge 
								variant={timerState === 'working' ? 'default' : timerState === 'resting' ? 'secondary' : 'outline'}
								className="mb-4"
							>
								{timerState === 'working' ? 'Trabajando' : timerState === 'resting' ? 'Descansando' : 'Pausado'}
							</Badge>
							<div className="flex items-center justify-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={toggleTimer}
								>
									{timerState === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
								</Button>
								{timerState === 'resting' && (
									<>
										<Button variant="outline" size="sm" onClick={skipRest}>
											Saltar
										</Button>
										<Button variant="outline" size="sm" onClick={addThirtySeconds}>
											+30s
										</Button>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
			
			{/* Ejercicio actual */}
			{currentSet && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg">
									{currentSet.exercise.name}
								</CardTitle>
								<div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
									<span>Bloque: {currentBlock.name}</span>
									<span>Ronda: {currentRound}/{currentBlock.rounds}</span>
									<span>Set: {currentSetIndex + 1}/{currentBlock.sets.length}</span>
								</div>
							</div>
							<Badge variant={completedSets.has(currentSet.id) ? 'default' : 'outline'}>
								{completedSets.has(currentSet.id) ? 'Completado' : 'Pendiente'}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
							{currentSet.reps && (
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">{currentSet.reps}</div>
									<div className="text-sm text-gray-600">Repeticiones</div>
								</div>
							)}
							{currentSet.weight && (
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">{currentSet.weight}kg</div>
									<div className="text-sm text-gray-600">Peso</div>
								</div>
							)}
							{currentSet.duration && (
								<div className="text-center">
									<div className="text-2xl font-bold text-purple-600">{formatTime(currentSet.duration)}</div>
									<div className="text-sm text-gray-600">Duración</div>
								</div>
							)}
							{currentSet.restTime && (
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600">{formatTime(currentSet.restTime)}</div>
									<div className="text-sm text-gray-600">Descanso</div>
								</div>
							)}
						</div>
						
						{currentSet.exercise.instructions && (
							<div className="mb-4">
								<h4 className="font-medium mb-2">Instrucciones:</h4>
								<p className="text-sm text-gray-600">{currentSet.exercise.instructions}</p>
							</div>
						)}
						
						{currentSet.notes && (
							<div className="mb-4">
								<h4 className="font-medium mb-2">Notas del entrenador:</h4>
								<p className="text-sm text-gray-600">{currentSet.notes}</p>
							</div>
						)}
						
						<div className="flex gap-2">
							{!currentSession ? (
								<Button onClick={startWorkoutSession} className="flex-1">
									<Play className="h-4 w-4 mr-2" />
									Iniciar Entrenamiento
								</Button>
							) : (
								<>
									<Button 
										onClick={completeSet} 
										className="flex-1"
										disabled={completedSets.has(currentSet.id)}
									>
										<CheckCircle className="h-4 w-4 mr-2" />
										{completedSets.has(currentSet.id) ? 'Completado' : 'Completar Serie'}
									</Button>
									<Button 
										variant="outline" 
										onClick={nextExercise}
										disabled={!completedSets.has(currentSet.id)}
									>
										<SkipForward className="h-4 w-4 mr-2" />
										Siguiente
									</Button>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			)}
			
			{/* Resumen de bloques */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Bloques de la rutina</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{routine.blocks.map((block, blockIndex) => (
							<div 
								key={block.id} 
								className={`p-3 rounded-lg border ${
									blockIndex === currentBlockIndex 
										? 'border-blue-500 bg-blue-50' 
										: 'border-gray-200'
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<h4 className="font-medium">{block.name}</h4>
									<Badge variant="outline">
										{block.rounds} ronda{block.rounds > 1 ? 's' : ''}
									</Badge>
								</div>
								<div className="text-sm text-gray-600">
									{block.sets.length} ejercicio{block.sets.length > 1 ? 's' : ''}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}