import { Platform } from 'react-native';

// Tipos de datos de salud
export interface HealthData {
	steps: number;
	calories: number;
	distance: number; // en metros
	heartRate?: number;
	weight?: number; // en kg
	height?: number; // en cm
	date: string;
}

export interface WorkoutData {
	id: string;
	type: 'strength' | 'cardio' | 'flexibility' | 'sports';
	name: string;
	startTime: string;
	endTime: string;
	duration: number; // en minutos
	caloriesBurned: number;
	exercises?: Array<{
		name: string;
		sets?: number;
		reps?: number;
		weight?: number;
		duration?: number;
	}>;
}

export interface HealthPermissions {
	read: string[];
	write: string[];
}

export interface HealthPreferences {
	autoSync: boolean;
	syncWorkouts: boolean;
	syncNutrition: boolean;
	backgroundSync: boolean;
	notifications: boolean;
}

class HealthService {
	private isInitialized = false;
	private hasPermissions = false;
	private preferences: HealthPreferences = {
		autoSync: true,
		syncWorkouts: true,
		syncNutrition: false,
		backgroundSync: true,
		notifications: true,
	};

	// Inicialización del servicio
	async initialize(): Promise<boolean> {
		try {
			console.log('Inicializando Health Service...');
			
			// Para desarrollo web, siempre retornamos true con datos mock
			if (Platform.OS === 'web') {
				console.log('Health Service inicializado en modo web (mock)');
				this.isInitialized = true;
				this.hasPermissions = true;
				return true;
			}
			
			// Para dispositivos móviles reales, aquí se inicializarían las librerías nativas
			console.log('Health Service inicializado en modo nativo (mock)');
			this.isInitialized = true;
			this.hasPermissions = true;
			return true;
		} catch (error) {
			console.error('Error initializing health service:', error);
			return false;
		}
	}

	isAvailable(): boolean {
		return this.isInitialized;
	}

	// Obtener datos de salud del día actual
	async getTodayHealthData(): Promise<HealthData | null> {
		if (!this.isInitialized) {
			return null;
		}

		const today = new Date().toISOString().split('T')[0];
		return this.getMockHealthData(today);
	}

	// Generar datos mock para desarrollo
	private getMockHealthData(date: string): HealthData {
		const baseSteps = 8000;
		const variation = Math.random() * 4000;
		const steps = Math.floor(baseSteps + variation);
		
		return {
			steps,
			calories: Math.floor(steps * 0.04), // ~0.04 calorías por paso
			distance: Math.floor(steps * 0.7), // ~0.7 metros por paso
			heartRate: Math.floor(70 + Math.random() * 30), // 70-100 bpm
			weight: 70 + Math.random() * 20, // 70-90 kg
			height: 170 + Math.random() * 20, // 170-190 cm
			date,
		};
	}

	// Obtener datos de salud en un rango de fechas
	async getHealthDataRange(startDate: string, endDate: string): Promise<HealthData[]> {
		if (!this.isInitialized) {
			return [];
		}

		const data: HealthData[] = [];
		const start = new Date(startDate);
		const end = new Date(endDate);
		
		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			const dateStr = d.toISOString().split('T')[0];
			data.push(this.getMockHealthData(dateStr));
		}
		
		return data;
	}

	// Guardar datos de entrenamiento
	async saveWorkout(workoutData: WorkoutData): Promise<boolean> {
		if (!this.isInitialized || !this.hasPermissions) {
			console.log('Health service not initialized or no permissions');
			return false;
		}

		try {
			console.log('Guardando entrenamiento:', workoutData.name);
			// En una implementación real, aquí se guardarían los datos en HealthKit/Google Fit
			return true;
		} catch (error) {
			console.error('Error saving workout:', error);
			return false;
		}
	}

	// Solicitar permisos
	async requestPermissions(permissions: HealthPermissions): Promise<boolean> {
		try {
			console.log('Solicitando permisos de salud...');
			// En desarrollo, siempre concedemos permisos
			this.hasPermissions = true;
			return true;
		} catch (error) {
			console.error('Error requesting permissions:', error);
			return false;
		}
	}

	// Información de la plataforma
	getPlatformInfo(): { platform: string; available: boolean; initialized: boolean } {
		return {
			platform: Platform.OS,
			available: true, // En mock siempre está disponible
			initialized: this.isInitialized,
		};
	}

	// Preferencias
	getPreferences(): HealthPreferences {
		return { ...this.preferences };
	}

	updatePreferences(newPreferences: Partial<HealthPreferences>): void {
		this.preferences = { ...this.preferences, ...newPreferences };
		console.log('Preferencias actualizadas:', this.preferences);
	}

	// Sincronización automática
	async performAutoSync(): Promise<boolean> {
		if (!this.preferences.autoSync || !this.isInitialized) {
			return false;
		}

		try {
			console.log('Realizando sincronización automática...');
			// Aquí se implementaría la lógica de sincronización real
			return true;
		} catch (error) {
			console.error('Error in auto sync:', error);
			return false;
		}
	}

	// Verificar permisos
	async checkPermissions(): Promise<{ read: boolean; write: boolean }> {
		return {
			read: this.hasPermissions,
			write: this.hasPermissions,
		};
	}

	// Desconectar servicio
	async disconnect(): Promise<boolean> {
		try {
			console.log('Desconectando Health Service...');
			this.isInitialized = false;
			this.hasPermissions = false;
			return true;
		} catch (error) {
			console.error('Error disconnecting health service:', error);
			return false;
		}
	}
}

export default new HealthService();