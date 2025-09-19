import { useState, useEffect, useCallback } from 'react';
import OfflineService, { OfflineWorkout, OfflineWorkoutSession } from '../services/OfflineService';
import NetInfo from '@react-native-community/netinfo';

interface OfflinePreferences {
	autoSync: boolean;
	syncOnWiFiOnly: boolean;
	keepDataDays: number;
	notifyWhenOffline: boolean;
	maxOfflineWorkouts: number;
}

export interface OfflineState {
	isConnected: boolean;
	workoutsCount: number;
	sessionsCount: number;
	pendingSyncCount: number;
}

export const useOffline = () => {
	const [offlineState, setOfflineState] = useState<OfflineState>({
		isConnected: true,
		workoutsCount: 0,
		sessionsCount: 0,
		pendingSyncCount: 0,
	});
	const [isLoading, setIsLoading] = useState(false);

	// Actualizar estado offline
	const updateOfflineState = useCallback(async () => {
		try {
			const info = await OfflineService.getStorageInfo();
			setOfflineState(info);
		} catch (error) {
			console.error('Error updating offline state:', error);
		}
	}, []);

	// Escuchar cambios de conectividad
	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state: any) => {
			setOfflineState(prev => ({
				...prev,
				isConnected: state.isConnected === true,
			}));

			// Auto-sincronizar cuando se recupere la conexión
			if (state.isConnected === true) {
				OfflineService.syncWithServer();
			}
		});

		// Cargar estado inicial
		updateOfflineState();

		return () => {
			unsubscribe();
		};
	}, [updateOfflineState]);

	// Guardar workout offline
	const saveWorkoutOffline = useCallback(async (workout: OfflineWorkout) => {
		setIsLoading(true);
		try {
			await OfflineService.saveWorkout(workout);
			await updateOfflineState();
		} catch (error) {
			console.error('Error saving workout offline:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [updateOfflineState]);

	// Obtener workouts offline
	const getOfflineWorkouts = useCallback(async (): Promise<OfflineWorkout[]> => {
		setIsLoading(true);
		try {
			return await OfflineService.getOfflineWorkouts();
		} catch (error) {
			console.error('Error getting offline workouts:', error);
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Eliminar workout offline
	const deleteWorkoutOffline = useCallback(async (workoutId: string) => {
		setIsLoading(true);
		try {
			await OfflineService.deleteOfflineWorkout(workoutId);
			await updateOfflineState();
		} catch (error) {
			console.error('Error deleting workout offline:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [updateOfflineState]);

	// Guardar sesión de entrenamiento offline
	const saveWorkoutSessionOffline = useCallback(async (session: OfflineWorkoutSession) => {
		setIsLoading(true);
		try {
			await OfflineService.saveWorkoutSession(session);
			await updateOfflineState();
		} catch (error) {
			console.error('Error saving workout session offline:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [updateOfflineState]);

	// Obtener sesiones offline
	const getOfflineWorkoutSessions = useCallback(async (): Promise<OfflineWorkoutSession[]> => {
		setIsLoading(true);
		try {
			return await OfflineService.getOfflineWorkoutSessions();
		} catch (error) {
			console.error('Error getting offline workout sessions:', error);
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Sincronizar manualmente
	const syncManually = useCallback(async () => {
		setIsLoading(true);
		try {
			await OfflineService.syncWithServer();
			await updateOfflineState();
		} catch (error) {
			console.error('Error syncing manually:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [updateOfflineState]);

	// Limpiar todos los datos offline
	const clearAllOfflineData = useCallback(async () => {
		setIsLoading(true);
		try {
			await OfflineService.clearAllOfflineData();
			await updateOfflineState();
		} catch (error) {
			console.error('Error clearing offline data:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [updateOfflineState]);

	// Gestión de preferencias
	const getOfflinePreferences = useCallback(async (): Promise<OfflinePreferences> => {
		try {
			return await OfflineService.getPreferences();
		} catch (error) {
			console.error('Error getting offline preferences:', error);
			throw error;
		}
	}, []);

	const updateOfflinePreferences = useCallback(async (preferences: Partial<OfflinePreferences>) => {
		setIsLoading(true);
		try {
			await OfflineService.updatePreferences(preferences);
		} catch (error) {
			console.error('Error updating offline preferences:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Verificar si se debe mostrar advertencia de almacenamiento
	const checkStorageWarning = useCallback(async (): Promise<boolean> => {
		try {
			const preferences = await OfflineService.getPreferences();
			const workouts = await OfflineService.getOfflineWorkouts();
			return workouts.length >= preferences.maxOfflineWorkouts * 0.8; // 80% del límite
		} catch (error) {
			console.error('Error checking storage warning:', error);
			return false;
		}
	}, []);

	// Obtener estadísticas detalladas
	const getDetailedStats = useCallback(async () => {
		try {
			const [workouts, sessions, preferences] = await Promise.all([
				OfflineService.getOfflineWorkouts(),
				OfflineService.getOfflineWorkoutSessions(),
				OfflineService.getPreferences(),
			]);

			const syncedWorkouts = workouts.filter(w => w.synced).length;
			const unsyncedWorkouts = workouts.filter(w => !w.synced).length;
			const syncedSessions = sessions.filter(s => s.synced).length;
			const unsyncedSessions = sessions.filter(s => !s.synced).length;

			return {
				totalWorkouts: workouts.length,
				syncedWorkouts,
				unsyncedWorkouts,
				totalSessions: sessions.length,
				syncedSessions,
				unsyncedSessions,
				storageUsagePercent: Math.round((workouts.length / preferences.maxOfflineWorkouts) * 100),
			};
		} catch (error) {
			console.error('Error getting detailed stats:', error);
			return null;
		}
	}, []);

	// Forzar limpieza de datos antiguos
	const forceCleanup = useCallback(async () => {
		setIsLoading(true);
		try {
			// Limpiar datos manualmente
			await OfflineService.clearAllOfflineData();
			await updateOfflineState();
		} catch (error) {
			console.error('Error during forced cleanup:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [updateOfflineState]);

	return {
		offlineState,
		isLoading,
		saveWorkoutOffline,
		getOfflineWorkouts,
		deleteWorkoutOffline,
		saveWorkoutSessionOffline,
		getOfflineWorkoutSessions,
		syncManually,
		clearAllOfflineData,
		getOfflinePreferences,
		updateOfflinePreferences,
		checkStorageWarning,
		getDetailedStats,
		forceCleanup,
		updateOfflineState,
	};
};

export default useOffline;