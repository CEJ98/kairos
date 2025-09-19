import { prisma } from '@/lib/db'

export type RecordType = 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_DURATION' | 'MAX_VOLUME'

export interface PersonalRecord {
	id: string
	userId: string
	exerciseId: string
	recordType: RecordType
	value: number
	reps?: number
	weight?: number
	duration?: number
	achievedAt: Date
	exercise?: {
		id: string
		name: string
		category: string
	}
}

export interface SetPerformance {
	reps?: number
	weight?: number
	duration?: number
	volume?: number // reps * weight
}

export class PersonalRecordsService {
	/**
	 * Evalúa si un set representa un nuevo record personal
	 */
	static async evaluateSetForRecords(
		userId: string,
		exerciseId: string,
		setData: SetPerformance
	): Promise<PersonalRecord[]> {
		const newRecords: PersonalRecord[] = []

		try {
			// Obtener records actuales para este ejercicio
			const currentRecords = await prisma.personalRecord.findMany({
				where: {
					userId,
					exerciseId
				},
				include: {
					exercise: {
						select: {
							id: true,
							name: true,
							category: true
						}
					}
				}
			})

			// Evaluar record de peso máximo
			if (setData.weight && setData.weight > 0) {
				const currentMaxWeight = currentRecords.find(r => r.recordType === 'MAX_WEIGHT')
				if (!currentMaxWeight || setData.weight > currentMaxWeight.value) {
					const record = await this.createOrUpdateRecord(
						userId,
						exerciseId,
						'MAX_WEIGHT',
						setData.weight,
						{ reps: setData.reps, weight: setData.weight }
					)
					if (record) newRecords.push(record)
				}
			}

			// Evaluar record de repeticiones máximas
			if (setData.reps && setData.reps > 0) {
				const currentMaxReps = currentRecords.find(r => r.recordType === 'MAX_REPS')
				if (!currentMaxReps || setData.reps > currentMaxReps.value) {
					const record = await this.createOrUpdateRecord(
						userId,
						exerciseId,
						'MAX_REPS',
						setData.reps,
						{ reps: setData.reps, weight: setData.weight }
					)
					if (record) newRecords.push(record)
				}
			}

			// Evaluar record de duración máxima
			if (setData.duration && setData.duration > 0) {
				const currentMaxDuration = currentRecords.find(r => r.recordType === 'MAX_DURATION')
				if (!currentMaxDuration || setData.duration > currentMaxDuration.value) {
					const record = await this.createOrUpdateRecord(
						userId,
						exerciseId,
						'MAX_DURATION',
						setData.duration,
						{ duration: setData.duration }
					)
					if (record) newRecords.push(record)
				}
			}

			// Evaluar record de volumen máximo (reps * peso)
			if (setData.volume && setData.volume > 0) {
				const currentMaxVolume = currentRecords.find(r => r.recordType === 'MAX_VOLUME')
				if (!currentMaxVolume || setData.volume > currentMaxVolume.value) {
					const record = await this.createOrUpdateRecord(
						userId,
						exerciseId,
						'MAX_VOLUME',
						setData.volume,
						{ reps: setData.reps, weight: setData.weight }
					)
					if (record) newRecords.push(record)
				}
			}

			return newRecords
		} catch (error) {
			console.error('Error evaluating personal records:', error)
			return []
		}
	}

	/**
	 * Crea o actualiza un record personal
	 */
	private static async createOrUpdateRecord(
		userId: string,
		exerciseId: string,
		recordType: RecordType,
		value: number,
		additionalData: Partial<{ reps: number; weight: number; duration: number }>
	): Promise<PersonalRecord | null> {
		try {
			const record = await prisma.personalRecord.upsert({
				where: {
					userId_exerciseId_recordType: {
						userId,
						exerciseId,
						recordType
					}
				},
				update: {
					value,
					reps: additionalData.reps || null,
					achievedAt: new Date()
				},
				create: {
					userId,
					exerciseId,
					recordType,
					value,
					reps: additionalData.reps || null,
					achievedAt: new Date()
				},
				include: {
					exercise: {
						select: {
							id: true,
							name: true,
							category: true
						}
					}
				}
			})

			return record as PersonalRecord
		} catch (error) {
			console.error('Error creating/updating personal record:', error)
			return null
		}
	}

	/**
	 * Obtiene todos los records personales de un usuario
	 */
	static async getUserRecords(userId: string): Promise<PersonalRecord[]> {
		try {
			const records = await prisma.personalRecord.findMany({
				where: { userId },
				include: {
					exercise: {
						select: {
							id: true,
							name: true,
							category: true
						}
					}
				},
				orderBy: {
					achievedAt: 'desc'
				}
			})

			return records as PersonalRecord[]
		} catch (error) {
			console.error('Error fetching user records:', error)
			return []
		}
	}

	/**
	 * Obtiene los records de un ejercicio específico
	 */
	static async getExerciseRecords(
		userId: string,
		exerciseId: string
	): Promise<PersonalRecord[]> {
		try {
			const records = await prisma.personalRecord.findMany({
				where: {
					userId,
					exerciseId
				},
				include: {
					exercise: {
						select: {
							id: true,
							name: true,
							category: true
						}
					}
				},
				orderBy: {
					recordType: 'asc'
				}
			})

			return records as PersonalRecord[]
		} catch (error) {
			console.error('Error fetching exercise records:', error)
			return []
		}
	}

	/**
	 * Obtiene los records más recientes de un usuario
	 */
	static async getRecentRecords(
		userId: string,
		limit: number = 5
	): Promise<PersonalRecord[]> {
		try {
			const records = await prisma.personalRecord.findMany({
				where: { userId },
				include: {
					exercise: {
						select: {
							id: true,
							name: true,
							category: true
						}
					}
				},
				orderBy: {
					achievedAt: 'desc'
				},
				take: limit
			})

			return records as PersonalRecord[]
		} catch (error) {
			console.error('Error fetching recent records:', error)
			return []
		}
	}

	/**
	 * Formatea un record para mostrar
	 */
	static formatRecord(record: PersonalRecord): string {
		switch (record.recordType) {
			case 'MAX_WEIGHT':
				return `${record.value}kg${record.reps ? ` x ${record.reps}` : ''}`
			case 'MAX_REPS':
				return `${record.value} reps${record.weight ? ` @ ${record.weight}kg` : ''}`
			case 'MAX_DURATION':
				return `${Math.floor(record.value / 60)}:${(record.value % 60).toString().padStart(2, '0')}`
			case 'MAX_VOLUME':
				return `${record.value}kg total`
			default:
				return record.value.toString()
		}
	}

	/**
	 * Obtiene el tipo de record en español
	 */
	static getRecordTypeLabel(recordType: RecordType): string {
		switch (recordType) {
			case 'MAX_WEIGHT':
				return 'Peso Máximo'
			case 'MAX_REPS':
				return 'Repeticiones Máximas'
			case 'MAX_DURATION':
				return 'Duración Máxima'
			case 'MAX_VOLUME':
				return 'Volumen Máximo'
			default:
				return 'Record'
		}
	}
}