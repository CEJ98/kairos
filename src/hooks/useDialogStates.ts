import { useState, useCallback } from 'react'

interface DialogState {
	isOpen: boolean
	data?: any
}

interface DialogStates {
	[key: string]: DialogState
}

/**
 * Hook personalizado para manejar múltiples estados de diálogos/modales
 * Reduce la duplicación de código en componentes con múltiples modales
 */
export function useDialogStates<T extends Record<string, DialogState>>(initialStates: T) {
	const [dialogStates, setDialogStates] = useState<T>(initialStates)

	const openDialog = useCallback((key: keyof T, data?: any) => {
		setDialogStates(prev => ({
			...prev,
			[key]: {
				isOpen: true,
				data
			}
		}))
	}, [])

	const closeDialog = useCallback((key: keyof T) => {
		setDialogStates(prev => ({
			...prev,
			[key]: {
				isOpen: false,
				data: undefined
			}
		}))
	}, [])

	const closeAllDialogs = useCallback(() => {
		setDialogStates(prev => {
			const newStates = { ...prev }
			Object.keys(newStates).forEach(key => {
				newStates[key as keyof T] = {
					...newStates[key as keyof T],
					isOpen: false,
					data: undefined
				}
			})
			return newStates
		})
	}, [])

	const toggleDialog = useCallback((key: keyof T, data?: any) => {
		setDialogStates(prev => ({
			...prev,
			[key]: {
				isOpen: !prev[key].isOpen,
				data: !prev[key].isOpen ? data : undefined
			}
		}))
	}, [])

	const isAnyDialogOpen = Object.values(dialogStates).some(state => state.isOpen)

	return {
		dialogStates,
		openDialog,
		closeDialog,
		closeAllDialogs,
		toggleDialog,
		isAnyDialogOpen
	}
}

/**
 * Hook simplificado para un solo diálogo
 */
export function useDialog(initialOpen = false) {
	const [isOpen, setIsOpen] = useState(initialOpen)
	const [data, setData] = useState<any>()

	const open = useCallback((dialogData?: any) => {
		setIsOpen(true)
		setData(dialogData)
	}, [])

	const close = useCallback(() => {
		setIsOpen(false)
		setData(undefined)
	}, [])

	const toggle = useCallback((dialogData?: any) => {
		setIsOpen(prev => {
			if (!prev && dialogData) {
				setData(dialogData)
			} else if (prev) {
				setData(undefined)
			}
			return !prev
		})
	}, [])

	return {
		isOpen,
		data,
		open,
		close,
		toggle,
		setData
	}
}

/**
 * Hook específico para diálogos de CRUD comunes
 */
export function useCRUDDialogs() {
	return useDialogStates({
		create: { isOpen: false },
		edit: { isOpen: false },
		view: { isOpen: false },
		delete: { isOpen: false }
	})
}

/**
 * Hook específico para diálogos de ejercicios
 */
export function useExerciseDialogs() {
	return useDialogStates({
		create: { isOpen: false },
		edit: { isOpen: false },
		view: { isOpen: false },
		exerciseSelector: { isOpen: false }
	})
}

/**
 * Hook específico para diálogos de entrenamiento
 */
export function useWorkoutDialogs() {
	return useDialogStates({
		builder: { isOpen: false },
		executor: { isOpen: false },
		complete: { isOpen: false },
		exit: { isOpen: false }
	})
}