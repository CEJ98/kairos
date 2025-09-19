import { useState, useEffect, useCallback } from 'react';
import HealthService, { HealthData, WorkoutData, HealthPreferences } from '../services/HealthService';

export interface HealthState {
	isInitialized: boolean;
	isAvailable: boolean;
	todayData: HealthData | null;
	weekData: HealthData[];
	platformInfo: {
		platform: string;
		available: boolean;
		initialized: boolean;
	};
	preferences: HealthPreferences;
	permissions: {
		read: boolean;
		write: boolean;
	};
	isLoading: boolean;
	error: string | null;
}

export const useHealth = () => {
	const [state, setState] = useState<HealthState>({
		isInitialized: false,
		isAvailable: false,
		todayData: null,
		weekData: [],
		platformInfo: {
			platform: '',
			available: false,
			initialized: false,
		},
		preferences: {
			autoSync: true,
			syncWorkouts: true,
			syncNutrition: false,
			backgroundSync: true,
			notifications: true,
		},
		permissions: {
			read: false,
			write: false,
		},
		isLoading: false,
		error: null,
	});

	// Inicializar el servicio de salud
	const initializeHealth = useCallback(async () => {
		setState(prev => ({ ...prev, isLoading: true, error: null }));
		
		try {
			const initialized = await HealthService.initialize();
			const available = HealthService.isAvailable();
			const platformInfo = HealthService.getPlatformInfo();
			const preferences = HealthService.getPreferences();
			const permissions = await HealthService.checkPermissions();

			setState(prev => ({
				...prev,
				isInitialized: initialized,
				isAvailable: available,
				platformInfo,
				preferences,
				permissions,
				isLoading: false,
			}));

			return initialized;
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Error inicializando servicio de salud',
			}));
			return false;
		}
	}, []);

	// Obtener datos de salud del día actual
	const getTodayData = useCallback(async () => {
		if (!state.isAvailable) {
			console.warn('Health service not available');
			return null;
		}

		setState(prev => ({ ...prev, isLoading: true, error: null }));

		try {
			const todayData = await HealthService.getTodayHealthData();
			setState(prev => ({
				...prev,
				todayData,
				isLoading: false,
			}));
			return todayData;
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Error obteniendo datos de hoy',
			}));
			return null;
		}
	}, [state.isAvailable]);

	// Obtener datos de la semana
	const getWeekData = useCallback(async () => {
		if (!state.isAvailable) {
			console.warn('Health service not available');
			return [];
		}

		setState(prev => ({ ...prev, isLoading: true, error: null }));

		try {
			const today = new Date();
			const weekAgo = new Date(today);
			weekAgo.setDate(today.getDate() - 7);

			const startDate = weekAgo.toISOString().split('T')[0];
			const endDate = today.toISOString().split('T')[0];

			const weekData = await HealthService.getHealthDataRange(startDate, endDate);
			setState(prev => ({
				...prev,
				weekData,
				isLoading: false,
			}));
			return weekData;
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Error obteniendo datos de la semana',
			}));
			return [];
		}
	}, [state.isAvailable]);

	// Guardar workout en la app de salud
	const saveWorkout = useCallback(async (workoutData: WorkoutData): Promise<boolean> => {
		if (!state.isAvailable) {
			console.warn('Health service not available');
			return false;
		}

		setState(prev => ({ ...prev, isLoading: true, error: null }));

		try {
			const success = await HealthService.saveWorkout(workoutData);
			setState(prev => ({
				...prev,
				isLoading: false,
				error: success ? null : 'Error guardando workout',
			}));
			return success;
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Error guardando workout',
			}));
			return false;
		}
	}, [state.isAvailable]);

	// Refrescar todos los datos
	const refreshData = useCallback(async () => {
		if (!state.isAvailable) {
			return;
		}

		setState(prev => ({ ...prev, isLoading: true, error: null }));

		try {
			const [todayData, weekData] = await Promise.all([
				HealthService.getTodayHealthData(),
				(async () => {
					const today = new Date();
					const weekAgo = new Date(today);
					weekAgo.setDate(today.getDate() - 7);
					const startDate = weekAgo.toISOString().split('T')[0];
					const endDate = today.toISOString().split('T')[0];
					return HealthService.getHealthDataRange(startDate, endDate);
				})()
			]);

			setState(prev => ({
				...prev,
				todayData,
				weekData,
				isLoading: false,
			}));
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Error refrescando datos',
			}));
		}
	}, [state.isAvailable]);

	// Limpiar error
	const clearError = useCallback(() => {
		setState(prev => ({ ...prev, error: null }));
	}, []);

	// Actualizar preferencias
	const updatePreferences = useCallback(async (newPreferences: Partial<HealthPreferences>) => {
		try {
			const updatedPreferences = await HealthService.updatePreferences(newPreferences);
			setState(prev => ({
				...prev,
				preferences: updatedPreferences,
			}));
			return updatedPreferences;
		} catch (error) {
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Error actualizando preferencias',
			}));
			return null;
		}
	}, []);

	// Realizar auto-sync
	const performAutoSync = useCallback(async () => {
		if (!state.isAvailable || !state.preferences.autoSync) {
			return false;
		}

		try {
			const success = await HealthService.performAutoSync();
			if (success) {
				await refreshData();
			}
			return success;
		} catch (error) {
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Error en auto-sync',
			}));
			return false;
		}
	}, [state.isAvailable, state.preferences.autoSync, refreshData]);

	// Desconectar del servicio de salud
	const disconnect = useCallback(async () => {
		try {
			await HealthService.disconnect();
			setState(prev => ({
				...prev,
				isInitialized: false,
				isAvailable: false,
				todayData: null,
				weekData: [],
				permissions: { read: false, write: false },
			}));
			return true;
		} catch (error) {
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Error desconectando',
			}));
			return false;
		}
	}, []);

	// Inicializar automáticamente al montar el hook
	useEffect(() => {
		initializeHealth();
	}, [initializeHealth]);

	// Obtener datos iniciales después de la inicialización
	useEffect(() => {
		if (state.isInitialized && state.isAvailable) {
			refreshData();
		}
	}, [state.isInitialized, state.isAvailable, refreshData]);

	// Auto-sync periódico si está habilitado
	useEffect(() => {
		if (state.preferences.autoSync && state.preferences.backgroundSync) {
			const interval = setInterval(() => {
				performAutoSync();
			}, 5 * 60 * 1000); // Cada 5 minutos

			return () => clearInterval(interval);
		}
	}, [state.preferences.autoSync, state.preferences.backgroundSync, performAutoSync]);

	return {
		...state,
		initializeHealth,
		getTodayData,
		getWeekData,
		saveWorkout,
		refreshData,
		clearError,
		updatePreferences,
		performAutoSync,
		disconnect,
	};
};

export default useHealth;