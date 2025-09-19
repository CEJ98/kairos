'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
	Play, 
	Pause, 
	SkipForward, 
	SkipBack, 
	Square, 
	Clock, 
	Target, 
	CheckCircle,
	AlertCircle,
	Volume2,
	VolumeX
} from 'lucide-react'
import { toast } from 'sonner'
import { useAudio } from '@/hooks/use-audio'
import { usePersonalRecords } from '@/hooks/use-personal-records'

interface Exercise {
	id: string
	name: string
	description?: string
	category: string
	difficulty: string
	imageUrl?: string
	videoUrl?: string
	instructions?: string
}

interface WorkoutExercise {
	id: string
	exerciseId: string
	exercise: Exercise
	order: number
	sets?: number
	reps?: number
	weight?: number
	duration?: number
	distance?: number
	restTime?: number
	notes?: string
}

interface Workout {
	id: string
	name: string
	description?: string
	category: string
	exercises: WorkoutExercise[]
}

interface WorkoutExecutorProps {
	workout: Workout
	onComplete: (sessionData: any) => Promise<void>
	onExit?: () => void
}

type TimerState = 'idle' | 'exercise' | 'rest' | 'paused' | 'completed'

interface SetData {
	setNumber: number
	reps?: number
	weight?: number
	duration?: number
	startTime: Date
	endTime?: Date
	restStartTime?: Date
	restEndTime?: Date
	notes?: string
}

interface ExerciseSessionData {
	exerciseId: string
	sets: SetData[]
	startTime: Date
	endTime?: Date
	notes?: string
}

interface SessionData {
	currentExerciseIndex: number
	currentSet: number
	timerState: TimerState
	timeRemaining: number
	startTime: Date
	currentSetStartTime?: Date
	currentRestStartTime?: Date
	completedExercises: ExerciseSessionData[]
	currentExerciseData?: ExerciseSessionData
}

export function WorkoutExecutor({ workout, onComplete, onExit }: WorkoutExecutorProps) {
	const [session, setSession] = useState<SessionData>({
		currentExerciseIndex: 0,
		currentSet: 1,
		timerState: 'idle',
		timeRemaining: 0,
		startTime: new Date(),
		completedExercises: [],
		currentExerciseData: undefined
	})

	const [showExitDialog, setShowExitDialog] = useState(false)
	const [isCompleting, setIsCompleting] = useState(false)
	const [currentReps, setCurrentReps] = useState<number>(0)
	const [currentWeight, setCurrentWeight] = useState<number>(0)
	const [setNotes, setSetNotes] = useState<string>('')

	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const { playSound, settings, toggleSound } = useAudio()
	const { evaluateSet, recentRecords, formatRecord, getRecordTypeLabel } = usePersonalRecords('cmf1u7i0i0000c3rep4zgy3gk') // TODO: Get real user ID

	// Timer principal
	useEffect(() => {
		if (session.timerState === 'exercise' || session.timerState === 'rest') {
			timerRef.current = setInterval(() => {
				setSession(prev => {
					if (prev.timeRemaining <= 1) {
						// Timer completado
						if (prev.timerState === 'exercise') {
							// Ejercicio completado, iniciar descanso
							playSound('exercise-complete')
							const currentExercise = workout.exercises[prev.currentExerciseIndex]
							const restTime = currentExercise.restTime || 60
							
							return {
								...prev,
								timerState: 'rest',
								timeRemaining: restTime
							}
						} else {
							// Descanso completado
							playSound('rest-start')
							const currentExercise = workout.exercises[prev.currentExerciseIndex]
							const totalSets = currentExercise.sets || 3
							
							if (prev.currentSet < totalSets) {
								// Siguiente serie del mismo ejercicio
								return {
									...prev,
									timerState: 'idle',
									currentSet: prev.currentSet + 1,
									timeRemaining: 0
								}
							} else {
								// Ejercicio completado, siguiente ejercicio
								if (prev.currentExerciseIndex < workout.exercises.length - 1) {
									return {
										...prev,
										timerState: 'idle',
										currentExerciseIndex: prev.currentExerciseIndex + 1,
										currentSet: 1,
										timeRemaining: 0
									}
								} else {
									// Rutina completada
									return {
										...prev,
										timerState: 'completed',
										timeRemaining: 0
									}
								}
							}
						}
					} else {
						return {
							...prev,
							timeRemaining: prev.timeRemaining - 1
						}
					}
				})
			}, 1000)
		} else {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}
	}, [session.timerState, workout.exercises, playSound])

	// Notificar cuando se complete la rutina
	useEffect(() => {
		if (session.timerState === 'completed') {
			toast.success('¡Rutina completada! 🎉')
			playSound('workout-complete')
		}
	}, [session.timerState, playSound])

	// Inicializar ejercicio actual
	useEffect(() => {
		const currentExercise = workout.exercises[session.currentExerciseIndex]
		if (currentExercise && !session.currentExerciseData) {
			const exerciseData: ExerciseSessionData = {
				exerciseId: currentExercise.exerciseId,
				sets: [],
				startTime: new Date()
			}
			setSession(prev => ({ ...prev, currentExerciseData: exerciseData }))
			// Inicializar valores por defecto
			setCurrentReps(currentExercise.reps || 0)
			setCurrentWeight(currentExercise.weight || 0)
		}
	}, [session.currentExerciseIndex, session.currentExerciseData, workout.exercises])

	const startExercise = () => {
		const currentExercise = workout.exercises[session.currentExerciseIndex]
		const duration = currentExercise.duration || 30 // 30 segundos por defecto
		const now = new Date()
		
		setSession(prev => ({
			...prev,
			timerState: 'exercise',
			timeRemaining: duration,
			currentSetStartTime: now
		}))
	}

	const completeSet = async () => {
		const now = new Date()
		const currentExercise = workout.exercises[session.currentExerciseIndex]
		const totalSets = currentExercise.sets || 3

		if (!session.currentExerciseData || !session.currentSetStartTime) return

		// Crear datos del set completado
		const setData: SetData = {
			setNumber: session.currentSet,
			reps: currentReps > 0 ? currentReps : undefined,
			weight: currentWeight > 0 ? currentWeight : undefined,
			duration: currentExercise.duration,
			startTime: session.currentSetStartTime,
			endTime: now,
			notes: setNotes || undefined
		}

		// Evaluar records personales
		try {
			await evaluateSet(currentExercise.exerciseId, {
				reps: setData.reps,
				weight: setData.weight,
				duration: setData.duration
			})
		} catch (error) {
			console.error('Error evaluating personal records:', error)
		}

		// Actualizar datos del ejercicio actual
		const updatedExerciseData = {
			...session.currentExerciseData,
			sets: [...session.currentExerciseData.sets, setData]
		}

		if (session.currentSet < totalSets) {
			// Siguiente set del mismo ejercicio
			setSession(prev => ({
				...prev,
				currentSet: prev.currentSet + 1,
				timerState: 'rest',
				timeRemaining: currentExercise.restTime || 60,
				currentExerciseData: updatedExerciseData,
				currentSetStartTime: undefined,
				currentRestStartTime: now
			}))
			playSound('rest-start')
		} else {
			// Ejercicio completado
			const completedExercise = {
				...updatedExerciseData,
				endTime: now
			}

			if (session.currentExerciseIndex < workout.exercises.length - 1) {
				// Siguiente ejercicio
				setSession(prev => ({
					...prev,
					currentExerciseIndex: prev.currentExerciseIndex + 1,
					currentSet: 1,
					timerState: 'idle',
					timeRemaining: 0,
					completedExercises: [...prev.completedExercises, completedExercise],
					currentExerciseData: undefined,
					currentSetStartTime: undefined,
					currentRestStartTime: undefined
				}))
				playSound('exercise-complete')
			} else {
				// Rutina completada
				setSession(prev => ({
					...prev,
					timerState: 'completed',
					timeRemaining: 0,
					completedExercises: [...prev.completedExercises, completedExercise],
					currentExerciseData: undefined
				}))
			}
		}

		// Limpiar campos para el siguiente set
		setSetNotes('')
		toast.success(`Set ${session.currentSet} completado`)
	}

	const pauseTimer = () => {
		setSession(prev => ({
			...prev,
			timerState: prev.timerState === 'paused' ? 
				(prev.timeRemaining > 0 ? 'exercise' : 'rest') : 'paused'
		}))
	}

	const skipTimer = () => {
		setSession(prev => ({
			...prev,
			timeRemaining: 0
		}))
	}

	const previousExercise = () => {
		if (session.currentExerciseIndex > 0) {
			setSession(prev => ({
				...prev,
				currentExerciseIndex: prev.currentExerciseIndex - 1,
				currentSet: 1,
				timerState: 'idle',
				timeRemaining: 0
			}))
		}
	}

	const nextExercise = () => {
		if (session.currentExerciseIndex < workout.exercises.length - 1) {
			setSession(prev => ({
				...prev,
				currentExerciseIndex: prev.currentExerciseIndex + 1,
				currentSet: 1,
				timerState: 'idle',
				timeRemaining: 0
			}))
		}
	}

	const handleComplete = async () => {
		// Si hay un set en progreso, completarlo primero
		if (session.timerState === 'idle' && session.currentExerciseData && session.currentSet <= (currentExercise?.sets || 3)) {
			completeSet()
			return
		}

		try {
			setIsCompleting(true)
			const sessionData = {
				workoutId: workout.id,
				startTime: session.startTime,
				endTime: new Date(),
				status: 'COMPLETED',
				completedExercises: session.completedExercises
			}
			
			await onComplete(sessionData)
			toast.success('Sesión guardada exitosamente')
		} catch (error) {
			console.error('Error completing workout:', error)
			toast.error('Error al guardar la sesión')
		} finally {
			setIsCompleting(false)
		}
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const currentExercise = workout.exercises[session.currentExerciseIndex]
	const progress = ((session.currentExerciseIndex + (session.currentSet - 1) / (currentExercise?.sets || 3)) / workout.exercises.length) * 100

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{workout.name}</h1>
					<p className="text-muted-foreground mt-1">
						Ejercicio {session.currentExerciseIndex + 1} de {workout.exercises.length}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={toggleSound}
				>
					{settings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
					</Button>
					<Button variant="outline" onClick={() => setShowExitDialog(true)}>
						Salir
					</Button>
				</div>
			</div>

			{/* Progress */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">Progreso General</span>
						<span className="text-sm text-muted-foreground">
							{Math.round(progress)}%
						</span>
					</div>
					<Progress value={progress} className="h-2" />
				</CardContent>
			</Card>

			{session.timerState === 'completed' ? (
				/* Pantalla de completado */
				<Card className="text-center">
					<CardContent className="p-8">
						<CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
						<h2 className="text-2xl font-bold mb-2">¡Rutina Completada!</h2>
						<p className="text-muted-foreground mb-6">
							Has completado todos los ejercicios de la rutina
						</p>
						<div className="flex gap-4 justify-center">
							<Button onClick={handleComplete} disabled={isCompleting}>
								{isCompleting ? 'Guardando...' : 'Guardar Sesión'}
							</Button>
							{onExit && (
								<Button variant="outline" onClick={onExit}>
									Salir
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Ejercicio actual */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Target className="h-5 w-5" />
								Ejercicio Actual
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{currentExercise.exercise.imageUrl && (
							<Image 
								src={currentExercise.exercise.imageUrl} 
								alt={currentExercise.exercise.name}
								width={400}
								height={192}
								className="w-full h-48 object-cover rounded-lg"
							/>
						)}
							
							<div>
								<h3 className="text-xl font-bold">{currentExercise.exercise.name}</h3>
								<div className="flex gap-2 mt-2">
									<Badge variant="secondary">{currentExercise.exercise.category}</Badge>
									<Badge variant="outline">{currentExercise.exercise.difficulty}</Badge>
								</div>
							</div>

							{currentExercise.exercise.description && (
								<p className="text-muted-foreground">
									{currentExercise.exercise.description}
								</p>
							)}

							<Separator />

							{/* Configuración del ejercicio */}
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="font-medium">Serie:</span>
									<span className="ml-2">{session.currentSet} / {currentExercise.sets || 3}</span>
								</div>
								{currentExercise.reps && (
									<div>
										<span className="font-medium">Repeticiones:</span>
										<span className="ml-2">{currentExercise.reps}</span>
									</div>
								)}
								{currentExercise.weight && (
									<div>
										<span className="font-medium">Peso:</span>
										<span className="ml-2">{currentExercise.weight} kg</span>
									</div>
								)}
								{currentExercise.duration && (
									<div>
										<span className="font-medium">Duración:</span>
										<span className="ml-2">{currentExercise.duration}s</span>
									</div>
								)}
							</div>

							{currentExercise.notes && (
							<div className="bg-muted p-3 rounded-lg">
								<p className="text-sm">
									<strong>Notas:</strong> {currentExercise.notes}
								</p>
							</div>
						)}

						<Separator />

						{/* Personal Records del ejercicio */}
						{recentRecords.filter(r => r.exerciseId === currentExercise.exerciseId).length > 0 && (
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
								<h5 className="text-sm font-medium text-yellow-800 mb-2">🏆 Tus Records</h5>
								<div className="space-y-1">
									{recentRecords
										.filter(r => r.exerciseId === currentExercise.exerciseId)
										.map((record, index) => (
											<div key={index} className="flex justify-between text-xs text-yellow-700">
												<span>{getRecordTypeLabel(record.recordType)}</span>
												<span className="font-medium">{formatRecord(record)}</span>
											</div>
										))}
								</div>
							</div>
						)}

						<Separator />

						{/* Set Tracking */}
						<div className="space-y-4">
							<h4 className="font-semibold">Registro del Set {session.currentSet}</h4>
							
							<div className="grid grid-cols-2 gap-4">
								{currentExercise.reps && (
									<div className="space-y-2">
										<Label htmlFor="current-reps">Repeticiones</Label>
										<Input
											id="current-reps"
											type="number"
											value={currentReps}
											onChange={(e) => setCurrentReps(Number(e.target.value))}
											placeholder={`Meta: ${currentExercise.reps}`}
											min="0"
										/>
									</div>
								)}
								
								{currentExercise.weight && (
									<div className="space-y-2">
										<Label htmlFor="current-weight">Peso (kg)</Label>
										<Input
											id="current-weight"
											type="number"
											value={currentWeight}
											onChange={(e) => setCurrentWeight(Number(e.target.value))}
											placeholder={`Meta: ${currentExercise.weight}`}
											min="0"
											step="0.5"
										/>
									</div>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="set-notes">Notas del Set (opcional)</Label>
								<Textarea
									id="set-notes"
									value={setNotes}
									onChange={(e) => setSetNotes(e.target.value)}
									placeholder="Ej: Forma perfecta, muy fácil, necesito más peso..."
									rows={2}
								/>
							</div>

							{session.timerState === 'idle' && session.currentSet <= (currentExercise?.sets || 3) && (
								<Button 
									onClick={completeSet} 
									className="w-full"
									disabled={!!(currentExercise.reps && currentReps === 0)}
								>
									Completar Set {session.currentSet}
								</Button>
							)}

							{/* Botón para completar workout cuando todos los sets estén hechos */}
							{session.timerState === 'idle' && 
							 session.currentExerciseData && 
							 session.currentSet > (currentExercise?.sets || 3) && (
								<Button onClick={handleComplete} variant="destructive" className="w-full">
									<CheckCircle className="h-4 w-4 mr-2" />
									Completar Ejercicio
								</Button>
							)}

							{/* Historial de sets completados */}
							{session.currentExerciseData && session.currentExerciseData.sets.length > 0 && (
								<div className="space-y-2">
									<h5 className="text-sm font-medium text-muted-foreground">Sets Completados</h5>
									<div className="space-y-1">
										{session.currentExerciseData.sets.map((set, index) => (
											<div key={index} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
												<span>Set {set.setNumber}</span>
												<span>
													{set.reps && `${set.reps} reps`}
													{set.weight && ` @ ${set.weight}kg`}
													{set.duration && ` ${set.duration}s`}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

					{/* Timer y controles */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Temporizador
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Timer display */}
							<div className="text-center">
								<div className="text-6xl font-mono font-bold mb-2">
									{formatTime(session.timeRemaining)}
								</div>
								<div className="flex items-center justify-center gap-2">
									{session.timerState === 'exercise' && (
										<Badge className="bg-green-500">
											<Play className="h-3 w-3 mr-1" />
											Ejercicio
										</Badge>
									)}
									{session.timerState === 'rest' && (
										<Badge className="bg-blue-500">
											<Clock className="h-3 w-3 mr-1" />
											Descanso
										</Badge>
									)}
									{session.timerState === 'paused' && (
										<Badge variant="secondary">
											<Pause className="h-3 w-3 mr-1" />
											Pausado
										</Badge>
									)}
									{session.timerState === 'idle' && (
										<Badge variant="outline">
											Listo para comenzar
										</Badge>
									)}
								</div>
							</div>

							{/* Timer controls */}
							<div className="flex justify-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={previousExercise}
									disabled={session.currentExerciseIndex === 0}
								>
									<SkipBack className="h-4 w-4" />
								</Button>

								{session.timerState === 'idle' ? (
									<Button onClick={startExercise} className="px-8">
										<Play className="h-4 w-4 mr-2" />
										Comenzar
									</Button>
								) : (
									<Button onClick={pauseTimer} className="px-8">
										{session.timerState === 'paused' ? (
											<>
												<Play className="h-4 w-4 mr-2" />
												Reanudar
											</>
										) : (
											<>
												<Pause className="h-4 w-4 mr-2" />
												Pausar
											</>
										)}
									</Button>
								)}

								<Button
									variant="outline"
									size="sm"
									onClick={nextExercise}
									disabled={session.currentExerciseIndex === workout.exercises.length - 1}
								>
									<SkipForward className="h-4 w-4" />
								</Button>
							</div>

							{/* Skip timer button */}
							{(session.timerState === 'exercise' || session.timerState === 'rest') && (
								<div className="text-center">
									<Button variant="ghost" size="sm" onClick={skipTimer}>
										Saltar {session.timerState === 'exercise' ? 'ejercicio' : 'descanso'}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Exit Dialog */}
			<Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-orange-500" />
							¿Salir de la rutina?
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-muted-foreground">
							Si sales ahora, perderás el progreso de esta sesión.
						</p>
						<div className="flex gap-2 justify-end">
							<Button variant="outline" onClick={() => setShowExitDialog(false)}>
								Continuar rutina
							</Button>
							<Button variant="destructive" onClick={onExit}>
								<Square className="h-4 w-4 mr-2" />
								Salir
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}