import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';

// Nombre de la tarea de background fetch
const BACKGROUND_FETCH_TASK = 'background-fetch-widget-data';

interface WidgetData {
	todayWorkouts: number;
	weeklyProgress: number;
	currentStreak: number;
	nextWorkout?: {
		name: string;
		time: string;
	};
	lastUpdate: string;
}

interface WorkoutStats {
	totalWorkouts: number;
	weeklyWorkouts: number;
	currentStreak: number;
	nextScheduled?: {
		name: string;
		scheduledTime: string;
	};
}

class WidgetService {
	private baseURL: string;

	constructor() {
		this.baseURL = API_BASE_URL || 'http://localhost:3000/api';
		this.setupBackgroundTask();
	}

	/**
	 * Configura la tarea de background fetch
	 */
	private setupBackgroundTask() {
		TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
			try {
				console.log('🔄 Ejecutando background fetch para widget...');
				const success = await this.updateWidgetData();
				return success 
					? BackgroundFetch.BackgroundFetchResult.NewData 
					: BackgroundFetch.BackgroundFetchResult.Failed;
			} catch (error) {
				console.error('❌ Error en background fetch:', error);
				return BackgroundFetch.BackgroundFetchResult.Failed;
			}
		});
	}

	/**
	 * Registra la tarea de background fetch
	 */
	async registerBackgroundFetch(): Promise<boolean> {
		try {
			const status = await BackgroundFetch.getStatusAsync();
			
			if (status === BackgroundFetch.BackgroundFetchStatus.Restricted || 
					status === BackgroundFetch.BackgroundFetchStatus.Denied) {
				console.warn('⚠️ Background fetch no está disponible');
				return false;
			}

			await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
				minimumInterval: 15 * 60, // 15 minutos
				stopOnTerminate: false,
				startOnBoot: true,
			});

			console.log('✅ Background fetch registrado exitosamente');
			return true;
		} catch (error) {
			console.error('❌ Error registrando background fetch:', error);
			return false;
		}
	}

	/**
	 * Desregistra la tarea de background fetch
	 */
	async unregisterBackgroundFetch(): Promise<void> {
		try {
			await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
			console.log('✅ Background fetch desregistrado');
		} catch (error) {
			console.error('❌ Error desregistrando background fetch:', error);
		}
	}

	/**
	 * Obtiene datos del servidor para el widget
	 */
	private async fetchWorkoutStats(): Promise<WorkoutStats | null> {
		try {
			const authToken = await AsyncStorage.getItem('authToken');
			
			if (!authToken) {
				console.warn('⚠️ No hay token de autenticación');
				return null;
			}

			const response = await fetch(`${this.baseURL}/users/widget-stats`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${authToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const stats = await response.json();
			return stats;
		} catch (error) {
			console.error('❌ Error obteniendo stats del servidor:', error);
			return null;
		}
	}

	/**
	 * Actualiza los datos del widget
	 */
	async updateWidgetData(): Promise<boolean> {
		try {
			// Obtener datos del servidor
			const serverStats = await this.fetchWorkoutStats();
			
			// Si no hay datos del servidor, usar datos locales como fallback
			const localStats = await this.getLocalStats();
			
			const stats = serverStats || localStats;
			
			if (!stats) {
				console.warn('⚠️ No hay datos disponibles para el widget');
				return false;
			}

			// Preparar datos del widget
			const widgetData: WidgetData = {
				todayWorkouts: this.getTodayWorkoutsCount(stats),
				weeklyProgress: this.getWeeklyProgress(stats),
				currentStreak: stats.currentStreak || 0,
				nextWorkout: stats.nextScheduled ? {
					name: stats.nextScheduled.name,
					time: this.formatTime(stats.nextScheduled.scheduledTime),
				} : undefined,
				lastUpdate: new Date().toISOString(),
			};

			// Guardar datos del widget
			await AsyncStorage.setItem('widgetData', JSON.stringify(widgetData));
			
			// Actualizar widgets nativos
			await this.updateNativeWidgets(widgetData);
			
			console.log('✅ Datos del widget actualizados:', widgetData);
			return true;
		} catch (error) {
			console.error('❌ Error actualizando datos del widget:', error);
			return false;
		}
	}

	/**
	 * Obtiene estadísticas locales como fallback
	 */
	private async getLocalStats(): Promise<WorkoutStats | null> {
		try {
			const localWorkouts = await AsyncStorage.getItem('offlineWorkouts');
			const workouts = localWorkouts ? JSON.parse(localWorkouts) : [];
			
			const today = new Date();
			const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
			
			const todayWorkouts = workouts.filter((w: any) => {
				const workoutDate = new Date(w.completedAt || w.createdAt);
				return workoutDate.toDateString() === today.toDateString();
			});
			
			const weeklyWorkouts = workouts.filter((w: any) => {
				const workoutDate = new Date(w.completedAt || w.createdAt);
				return workoutDate >= weekStart;
			});

			return {
				totalWorkouts: workouts.length,
				weeklyWorkouts: weeklyWorkouts.length,
				currentStreak: await this.calculateLocalStreak(workouts),
			};
		} catch (error) {
			console.error('❌ Error obteniendo stats locales:', error);
			return null;
		}
	}

	/**
	 * Calcula la racha actual basada en datos locales
	 */
	private async calculateLocalStreak(workouts: any[]): Promise<number> {
		try {
			if (!workouts.length) return 0;
			
			// Ordenar workouts por fecha
			const sortedWorkouts = workouts
				.filter(w => w.completedAt)
				.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
			
			if (!sortedWorkouts.length) return 0;
			
			let streak = 0;
			const today = new Date();
			let currentDate = new Date(today);
			
			// Verificar días consecutivos hacia atrás
			for (let i = 0; i < sortedWorkouts.length; i++) {
				const workoutDate = new Date(sortedWorkouts[i].completedAt);
				
				if (workoutDate.toDateString() === currentDate.toDateString()) {
					streak++;
					currentDate.setDate(currentDate.getDate() - 1);
				} else {
					break;
				}
			}
			
			return streak;
		} catch (error) {
			console.error('❌ Error calculando racha local:', error);
			return 0;
		}
	}

	/**
	 * Obtiene el conteo de workouts de hoy
	 */
	private getTodayWorkoutsCount(stats: WorkoutStats): number {
		const today = new Date();
		// Esta lógica se puede mejorar con datos más específicos del servidor
		return stats.weeklyWorkouts > 0 ? 1 : 0;
	}

	/**
	 * Calcula el progreso semanal como porcentaje
	 */
	private getWeeklyProgress(stats: WorkoutStats): number {
		const weeklyGoal = 5; // Meta semanal por defecto
		return Math.min(100, Math.round((stats.weeklyWorkouts / weeklyGoal) * 100));
	}

	/**
	 * Formatea la hora para mostrar en el widget
	 */
	private formatTime(dateString: string): string {
		try {
			const date = new Date(dateString);
			return date.toLocaleTimeString('es-ES', { 
				hour: '2-digit', 
				minute: '2-digit',
				hour12: false 
			});
		} catch (error) {
			return 'N/A';
		}
	}

	/**
	 * Obtiene los datos actuales del widget
	 */
	async getWidgetData(): Promise<WidgetData | null> {
		try {
			const data = await AsyncStorage.getItem('widgetData');
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error('❌ Error obteniendo datos del widget:', error);
			return null;
		}
	}

	/**
	 * Fuerza una actualización inmediata de los datos del widget
	 */
	async forceUpdate(): Promise<boolean> {
		console.log('🔄 Forzando actualización del widget...');
		return await this.updateWidgetData();
	}

	/**
	 * Actualiza los widgets nativos de iOS y Android
	 */
	private async updateNativeWidgets(widgetData: WidgetData): Promise<void> {
		try {
			if (Platform.OS === 'ios') {
				// Para iOS, guardar en UserDefaults compartidos
				await this.updateiOSWidget(widgetData);
			} else if (Platform.OS === 'android') {
				// Para Android, actualizar a través del widget provider
				await this.updateAndroidWidget(widgetData);
			}
		} catch (error) {
			console.error('❌ Error actualizando widgets nativos:', error);
		}
	}

	/**
	 * Actualiza el widget de iOS
	 */
	private async updateiOSWidget(widgetData: WidgetData): Promise<void> {
		try {
			// En iOS, los datos se comparten a través de UserDefaults con App Groups
			// Esto requiere configuración nativa adicional
			console.log('📱 Actualizando widget de iOS...');
			
			// Los datos ya están en AsyncStorage, el widget de iOS los leerá desde allí
			// En una implementación completa, se usaría un App Group para compartir datos
		} catch (error) {
			console.error('❌ Error actualizando widget de iOS:', error);
		}
	}

	/**
	 * Actualiza el widget de Android
	 */
	private async updateAndroidWidget(widgetData: WidgetData): Promise<void> {
		try {
			console.log('🤖 Actualizando widget de Android...');
			
			// En Android, los datos se guardan en SharedPreferences
			// y se notifica al widget provider para actualizar
			// Esto requiere un módulo nativo o bridge
		} catch (error) {
			console.error('❌ Error actualizando widget de Android:', error);
		}
	}

	/**
	 * Verifica si el background fetch está disponible
	 */
	async isBackgroundFetchAvailable(): Promise<boolean> {
		try {
			const status = await BackgroundFetch.getStatusAsync();
			return status === BackgroundFetch.BackgroundFetchStatus.Available;
		} catch (error) {
			console.error('❌ Error verificando background fetch:', error);
			return false;
		}
	}
}

// Exportar instancia singleton
export const widgetService = new WidgetService();
export type { WidgetData, WorkoutStats };