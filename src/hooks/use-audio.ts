import { useRef, useCallback, useState, useEffect } from 'react'

// Tipos de sonidos disponibles
export type SoundType = 'pip' | 'exercise-complete' | 'rest-start' | 'workout-complete'

// Configuración de sonidos
const SOUND_CONFIG: Record<SoundType, { file: string; volume: number }> = {
	pip: { file: '/sounds/timer-beep.mp3', volume: 0.7 },
	'exercise-complete': { file: '/sounds/exercise-complete.mp3', volume: 0.8 },
	'rest-start': { file: '/sounds/rest-start.mp3', volume: 0.5 },
	'workout-complete': { file: '/sounds/workout-complete.mp3', volume: 1.0 }
}

// Configuración de audio
interface AudioSettings {
	enabled: boolean
	volume: number // 0.0 a 1.0
	vibrateEnabled: boolean // Para móvil
}

// Hook para manejar audio en la aplicación
export function useAudio() {
	const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map())
	const [settings, setSettings] = useState<AudioSettings>({
		enabled: true,
		volume: 0.7,
		vibrateEnabled: true
	})
	const [isSupported, setIsSupported] = useState(true)

	// Inicializar archivos de audio
	useEffect(() => {
		const initAudio = async () => {
			try {
				// Verificar soporte de audio
				if (typeof Audio === 'undefined') {
					setIsSupported(false)
					return
				}

				// Precargar todos los sonidos
				for (const [soundType, config] of Object.entries(SOUND_CONFIG)) {
					const audio = new Audio(config.file)
					audio.preload = 'auto'
					audio.volume = config.volume * settings.volume
					
					// Manejar errores de carga
					audio.onerror = () => {
						console.warn(`Error cargando sonido: ${soundType}`)
					}

					audioRefs.current.set(soundType as SoundType, audio)
				}
			} catch (error) {
				console.error('Error inicializando audio:', error)
				setIsSupported(false)
			}
		}

		initAudio()

		// Cargar configuración desde localStorage
		const savedSettings = localStorage.getItem('kairos-audio-settings')
		if (savedSettings) {
			try {
				const parsed = JSON.parse(savedSettings)
				setSettings(prev => ({ ...prev, ...parsed }))
			} catch (error) {
				console.warn('Error cargando configuración de audio:', error)
			}
		}
	}, [settings.volume])

	// Actualizar volumen cuando cambie la configuración
	useEffect(() => {
		for (const [soundType, audio] of audioRefs.current.entries()) {
			const config = SOUND_CONFIG[soundType]
			audio.volume = config.volume * settings.volume
		}
	}, [settings.volume])

	// Guardar configuración
	useEffect(() => {
		localStorage.setItem('kairos-audio-settings', JSON.stringify(settings))
	}, [settings])

	// Función para reproducir sonido
	const playSound = useCallback(async (soundType: SoundType) => {
		if (!settings.enabled || !isSupported) {
			return
		}

		try {
			const audio = audioRefs.current.get(soundType)
			if (!audio) {
				console.warn(`Sonido no encontrado: ${soundType}`)
				return
			}

			// Reiniciar el audio si ya está reproduciéndose
			audio.currentTime = 0
			
			// Reproducir sonido
			await audio.play()

			// Vibración en móvil (si está habilitada)
			if (settings.vibrateEnabled && 'vibrate' in navigator) {
				switch (soundType) {
					case 'pip':
						navigator.vibrate(100)
						break
					case 'exercise-complete':
						navigator.vibrate([200, 100, 200])
						break
					case 'workout-complete':
						navigator.vibrate([300, 100, 300, 100, 300])
						break
					default:
						navigator.vibrate(150)
				}
			}
		} catch (error) {
			// Los errores de audio son comunes en navegadores con políticas estrictas
			// No mostrar error al usuario, solo registrar en consola
			console.debug('Error reproduciendo sonido:', error)
		}
	}, [settings.enabled, settings.vibrateEnabled, isSupported])

	// Función para alternar sonido
	const toggleSound = useCallback(() => {
		setSettings(prev => ({ ...prev, enabled: !prev.enabled }))
	}, [])

	// Función para cambiar volumen
	const setVolume = useCallback((volume: number) => {
		const clampedVolume = Math.max(0, Math.min(1, volume))
		setSettings(prev => ({ ...prev, volume: clampedVolume }))
	}, [])

	// Función para alternar vibración
	const toggleVibrate = useCallback(() => {
		setSettings(prev => ({ ...prev, vibrateEnabled: !prev.vibrateEnabled }))
	}, [])

	// Función para probar sonido
	const testSound = useCallback((soundType: SoundType = 'pip') => {
		playSound(soundType)
	}, [playSound])

	return {
		// Estado
		settings,
		isSupported,
		
		// Funciones
		playSound,
		toggleSound,
		setVolume,
		toggleVibrate,
		testSound
	}
}

// Hook simplificado para componentes que solo necesitan reproducir sonidos
export function useSimpleAudio() {
	const { playSound, settings } = useAudio()
	
	return {
		playSound,
		soundEnabled: settings.enabled
	}
}