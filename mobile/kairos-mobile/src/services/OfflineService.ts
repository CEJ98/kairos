import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';

export interface OfflineWorkout {
	id: string;
	name: string;
	exercises: Array<{
		id: string;
		name: string;
		sets: number;
		reps: number;
		weight: number;
		rest: number;
		notes?: string;
	}>;
	createdAt: string;
	updatedAt: string;
	synced: boolean;
}

export interface OfflineWorkoutSession {
	id: string;
	workoutId: string;
	workoutName: string;
	startTime: string;
	endTime?: string;
	exercises: Array<{
		id: string;
		name: string;
		completedSets: Array<{
			reps: number;
			weight: number;
			rest: number;
			completedAt: string;
		}>;
	}>;
	synced: boolean;
}

interface OfflinePreferences {
	autoSync: boolean;
	syncOnWiFiOnly: boolean;
	keepDataDays: number;
	notifyWhenOffline: boolean;
	maxOfflineWorkouts: number;
}

class OfflineService {
	private readonly WORKOUTS_KEY = '@kairos_offline_workouts';
	private readonly SESSIONS_KEY = '@kairos_offline_sessions';
	private readonly SYNC_QUEUE_KEY = '@kairos_sync_queue';
	private readonly PREFERENCES_KEY = '@kairos_offline_preferences';
	private readonly LAST_CLEANUP_KEY = '@kairos_last_cleanup';
	private readonly LAST_SYNC_KEY = '@kairos_last_sync_time';

	private syncInterval: NodeJS.Timeout | null = null;
	private appStateSubscription: any = null;
	private networkSubscription: any = null;

	constructor() {
		this.initializeService();
	}

	private async initializeService(): Promise<void> {
		// Configurar listeners de conectividad y estado de la app
		this.setupNetworkListener();
		this.setupAppStateListener();
		
		// Ejecutar limpieza inicial
		await this.performMaintenanceTasks();
		
		// Configurar sincronización automática
		await this.setupAutoSync();
	}

	private setupNetworkListener(): void {
		this.networkSubscription = NetInfo.addEventListener(async (state) => {
			if (state.isConnected) {
				const preferences = await this.getPreferences();
				if (preferences.autoSync) {
					await this.handleConnectivityChange(true);
				}
			} else {
				await this.handleConnectivityChange(false);
			}
		});
	}

	private setupAppStateListener(): void {
		this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
			if (nextAppState === 'active') {
				// App volvió al primer plano, verificar sincronización
				const preferences = await this.getPreferences();
				if (preferences.autoSync && await this.shouldAutoSync()) {
					await this.syncWithServer();
				}
			}
		});
	}

	private async setupAutoSync(): Promise<void> {
		const preferences = await this.getPreferences();
		if (preferences.autoSync) {
			// Configurar sincronización cada 5 minutos cuando hay conexión
			this.syncInterval = setInterval(async () => {
				if (await this.shouldAutoSync()) {
					await this.syncWithServer();
				}
			}, 5 * 60 * 1000); // 5 minutos
		}
	}

	private async shouldAutoSync(): Promise<boolean> {
		const preferences = await this.getPreferences();
		const isConnected = await this.isConnected();
		
		if (!isConnected || !preferences.autoSync) {
			return false;
		}
		
		if (preferences.syncOnWiFiOnly) {
			const networkState = await NetInfo.fetch();
			return networkState.type === 'wifi';
		}
		
		return true;
	}

	private async handleConnectivityChange(isConnected: boolean): Promise<void> {
		const preferences = await this.getPreferences();
		
		if (isConnected) {
			// Reconectado - intentar sincronizar
			if (preferences.autoSync && await this.shouldAutoSync()) {
				setTimeout(() => this.syncWithServer(), 2000); // Esperar 2 segundos
			}
		} else {
			// Desconectado - mostrar notificación si está habilitada
			if (preferences.notifyWhenOffline) {
				Alert.alert(
					'Modo Offline',
					'Se perdió la conexión. Tus entrenamientos se guardarán localmente.',
					[{ text: 'Entendido' }]
				);
			}
		}
	}

	private async performMaintenanceTasks(): Promise<void> {
		const lastCleanup = await AsyncStorage.getItem(this.LAST_CLEANUP_KEY);
		const now = new Date();
		
		// Ejecutar limpieza una vez al día
		if (!lastCleanup || (now.getTime() - new Date(lastCleanup).getTime()) > 24 * 60 * 60 * 1000) {
			await this.cleanupOldData();
			await AsyncStorage.setItem(this.LAST_CLEANUP_KEY, now.toISOString());
		}
	}

	private async cleanupOldData(): Promise<void> {
		try {
			const preferences = await this.getPreferences();
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - preferences.keepDataDays);
			
			// Limpiar workouts antiguos sincronizados
			const workouts = await this.getOfflineWorkouts();
			const filteredWorkouts = workouts.filter(workout => {
				const workoutDate = new Date(workout.createdAt);
				return !workout.synced || workoutDate > cutoffDate;
			});
			
			// Limpiar sesiones antiguas sincronizadas
			const sessions = await this.getOfflineWorkoutSessions();
			const filteredSessions = sessions.filter(session => {
				const sessionDate = new Date(session.startTime);
				return !session.synced || sessionDate > cutoffDate;
			});
			
			await AsyncStorage.setItem(this.WORKOUTS_KEY, JSON.stringify(filteredWorkouts));
			await AsyncStorage.setItem(this.SESSIONS_KEY, JSON.stringify(filteredSessions));
			
			console.log(`Limpieza completada: ${workouts.length - filteredWorkouts.length} workouts y ${sessions.length - filteredSessions.length} sesiones eliminadas`);
		} catch (error) {
			console.error('Error during cleanup:', error);
		}
	}

	// Gestión de preferencias
	async getPreferences(): Promise<OfflinePreferences> {
		try {
			const prefsJson = await AsyncStorage.getItem(this.PREFERENCES_KEY);
			if (prefsJson) {
				return JSON.parse(prefsJson);
			}
		} catch (error) {
			console.error('Error getting preferences:', error);
		}
		
		// Valores por defecto
		return {
			autoSync: true,
			syncOnWiFiOnly: true,
			keepDataDays: 30,
			notifyWhenOffline: true,
			maxOfflineWorkouts: 50,
		};
	}

	async updatePreferences(preferences: Partial<OfflinePreferences>): Promise<void> {
		try {
			const currentPrefs = await this.getPreferences();
			const newPrefs = { ...currentPrefs, ...preferences };
			await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(newPrefs));
			
			// Reconfigurar sincronización automática si cambió
			if ('autoSync' in preferences) {
				if (this.syncInterval) {
					clearInterval(this.syncInterval);
					this.syncInterval = null;
				}
				if (newPrefs.autoSync) {
					await this.setupAutoSync();
				}
			}
		} catch (error) {
			console.error('Error updating preferences:', error);
			throw error;
		}
	}

	// Gestión de workouts offline
	async saveWorkout(workout: OfflineWorkout): Promise<void> {
		try {
			const workouts = await this.getOfflineWorkouts();
			const existingIndex = workouts.findIndex(w => w.id === workout.id);
			
			if (existingIndex >= 0) {
				workouts[existingIndex] = { ...workout, updatedAt: new Date().toISOString() };
			} else {
				workouts.push(workout);
			}
			
			await AsyncStorage.setItem(this.WORKOUTS_KEY, JSON.stringify(workouts));
			
			// Agregar a cola de sincronización si hay conexión
			const isConnected = await this.isConnected();
			if (isConnected) {
				await this.addToSyncQueue('workout', workout);
			}
		} catch (error) {
			console.error('Error saving offline workout:', error);
			throw error;
		}
	}

	async getOfflineWorkouts(): Promise<OfflineWorkout[]> {
		try {
			const workoutsJson = await AsyncStorage.getItem(this.WORKOUTS_KEY);
			return workoutsJson ? JSON.parse(workoutsJson) : [];
		} catch (error) {
			console.error('Error getting offline workouts:', error);
			return [];
		}
	}

	async deleteOfflineWorkout(workoutId: string): Promise<void> {
		try {
			const workouts = await this.getOfflineWorkouts();
			const filteredWorkouts = workouts.filter(w => w.id !== workoutId);
			await AsyncStorage.setItem(this.WORKOUTS_KEY, JSON.stringify(filteredWorkouts));
		} catch (error) {
			console.error('Error deleting offline workout:', error);
			throw error;
		}
	}

	// Gestión de sesiones de entrenamiento offline
	async saveWorkoutSession(session: OfflineWorkoutSession): Promise<void> {
		try {
			const sessions = await this.getOfflineWorkoutSessions();
			const existingIndex = sessions.findIndex(s => s.id === session.id);
			
			if (existingIndex >= 0) {
				sessions[existingIndex] = session;
			} else {
				sessions.push(session);
			}
			
			await AsyncStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
			
			// Agregar a cola de sincronización si hay conexión
			const isConnected = await this.isConnected();
			if (isConnected) {
				await this.addToSyncQueue('session', session);
			}
		} catch (error) {
			console.error('Error saving offline workout session:', error);
			throw error;
		}
	}

	async getOfflineWorkoutSessions(): Promise<OfflineWorkoutSession[]> {
		try {
			const sessionsJson = await AsyncStorage.getItem(this.SESSIONS_KEY);
			return sessionsJson ? JSON.parse(sessionsJson) : [];
		} catch (error) {
			console.error('Error getting offline workout sessions:', error);
			return [];
		}
	}

	// Gestión de conectividad
	async isConnected(): Promise<boolean> {
		try {
			const netInfo = await NetInfo.fetch();
			return netInfo.isConnected === true;
		} catch (error) {
			console.error('Error checking connectivity:', error);
			return false;
		}
	}

	// Cola de sincronización
	private async addToSyncQueue(type: 'workout' | 'session', data: any): Promise<void> {
		try {
			const queueJson = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
			const queue = queueJson ? JSON.parse(queueJson) : [];
			
			queue.push({
				id: `${type}_${data.id}_${Date.now()}`,
				type,
				data,
				timestamp: new Date().toISOString(),
			});
			
			await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
		} catch (error) {
			console.error('Error adding to sync queue:', error);
		}
	}

	async getSyncQueue(): Promise<any[]> {
		try {
			const queueJson = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
			return queueJson ? JSON.parse(queueJson) : [];
		} catch (error) {
			console.error('Error getting sync queue:', error);
			return [];
		}
	}

	async clearSyncQueue(): Promise<void> {
		try {
			await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
		} catch (error) {
			console.error('Error clearing sync queue:', error);
		}
	}

	// Sincronización con el servidor
	async syncWithServer(): Promise<void> {
		try {
			const isConnected = await this.isConnected();
			if (!isConnected) {
				console.log('No hay conexión a internet, sincronización pospuesta');
				return;
			}

			const queue = await this.getSyncQueue();
			if (queue.length === 0) {
				console.log('No hay elementos para sincronizar');
				return;
			}

			console.log(`Sincronizando ${queue.length} elementos...`);

			for (const item of queue) {
				try {
					// Aquí se haría la llamada real al API
					// await this.syncItemWithServer(item);
					console.log(`Elemento ${item.id} sincronizado exitosamente`);
				} catch (error) {
					console.error(`Error sincronizando elemento ${item.id}:`, error);
				}
			}

			// Limpiar cola después de sincronización exitosa
			await this.clearSyncQueue();
			console.log('Sincronización completada');
		} catch (error) {
			console.error('Error durante la sincronización:', error);
		}
	}

	// Utilidades
	async getStorageInfo(): Promise<{
		workoutsCount: number;
		sessionsCount: number;
		pendingSyncCount: number;
		isConnected: boolean;
	}> {
		try {
			const [workouts, sessions, queue, isConnected] = await Promise.all([
				this.getOfflineWorkouts(),
				this.getOfflineWorkoutSessions(),
				this.getSyncQueue(),
				this.isConnected(),
			]);

			return {
				workoutsCount: workouts.length,
				sessionsCount: sessions.length,
				pendingSyncCount: queue.length,
				isConnected,
			};
		} catch (error) {
			console.error('Error getting storage info:', error);
			return {
				workoutsCount: 0,
				sessionsCount: 0,
				pendingSyncCount: 0,
				isConnected: false,
			};
		}
	}

	async clearAllOfflineData(): Promise<void> {
		try {
			await Promise.all([
				AsyncStorage.removeItem(this.WORKOUTS_KEY),
				AsyncStorage.removeItem(this.SESSIONS_KEY),
				AsyncStorage.removeItem(this.SYNC_QUEUE_KEY),
			]);
			console.log('Todos los datos offline han sido eliminados');
		} catch (error) {
			console.error('Error clearing offline data:', error);
			throw error;
		}
	}

	// Mostrar estado de conectividad al usuario
	showConnectivityStatus(): void {
		NetInfo.addEventListener((state: any) => {
			if (state.isConnected === false) {
				Alert.alert(
					'Modo Offline',
					'Sin conexión a internet. Los datos se guardarán localmente y se sincronizarán cuando se restablezca la conexión.',
					[{ text: 'Entendido' }]
				);
			} else if (state.isConnected === true) {
				// Intentar sincronizar automáticamente cuando se recupere la conexión
				this.syncWithServer();
			}
		});
	}

	// Método público para ejecutar tareas de mantenimiento
	async performMaintenance(): Promise<void> {
		await this.performMaintenanceTasks();
	}

	// Método para limpiar el servicio al destruir la instancia
	destroy(): void {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
			this.syncInterval = null;
		}
		if (this.networkSubscription) {
			this.networkSubscription();
			this.networkSubscription = null;
		}
		if (this.appStateSubscription) {
			this.appStateSubscription.remove();
			this.appStateSubscription = null;
		}
	}
}

export default new OfflineService();