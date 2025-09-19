import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import React from 'react'
import { vi } from 'vitest'

// Mock components que simulan las páginas del dashboard
const MockDashboardPage = () => {
	const { data: session } = useSession()
	const router = useRouter()

	// Simular redirección si no hay sesión
	if (!session) {
		router.push('/signin')
		return null
	}

	return (
		<div data-testid="dashboard-page">
			<h1>Dashboard Principal</h1>
			<p>Bienvenido, {session.user?.name}</p>
			<nav data-testid="dashboard-navigation">
				<a href="/dashboard/workouts" data-testid="workouts-link">Rutinas</a>
				<a href="/dashboard/progress" data-testid="progress-link">Progreso</a>
				<a href="/dashboard/profile" data-testid="profile-link">Perfil</a>
				<a href="/dashboard/session" data-testid="session-link">Sesión</a>
			</nav>
		</div>
	)
}

const MockWorkoutsPage = () => {
	const { data: session } = useSession()
	const router = useRouter()

	if (!session) {
		router.push('/signin')
		return null
	}

	return (
		<div data-testid="workouts-page">
			<h1>Rutinas de Entrenamiento</h1>
			<button 
				data-testid="new-workout-btn"
				onClick={() => router.push('/dashboard/workouts/new')}
			>
				Nueva Rutina
			</button>
			<a href="/dashboard" data-testid="back-to-dashboard">Volver al Dashboard</a>
		</div>
	)
}

const MockProgressPage = () => {
	const { data: session } = useSession()
	const router = useRouter()

	if (!session) {
		router.push('/signin')
		return null
	}

	return (
		<div data-testid="progress-page">
			<h1>Progreso del Usuario</h1>
			<div data-testid="progress-stats">
				<p>Entrenamientos completados: 15</p>
				<p>Calorías quemadas: 2,450</p>
			</div>
			<button 
				data-testid="view-details-btn"
				onClick={() => router.push('/dashboard/progress/details')}
			>
				Ver Detalles
			</button>
		</div>
	)
}

const MockSessionPage = () => {
	const { data: session } = useSession()
	const router = useRouter()

	if (!session) {
		router.push('/signin')
		return null
	}

	return (
		<div data-testid="session-page">
			<h1>Información de Sesión</h1>
			<div data-testid="session-info">
				<p>Usuario: {session.user?.name}</p>
				<p>Email: {session.user?.email}</p>
				<p>Rol: {session.user?.role || 'Usuario'}</p>
			</div>
			<button 
				data-testid="logout-btn"
				onClick={() => router.push('/api/auth/signout')}
			>
				Cerrar Sesión
			</button>
		</div>
	)
}

describe('Dashboard Routes Tests', () => {
	const mockPush = vi.fn()
	const mockReplace = vi.fn()
	const mockBack = vi.fn()

	beforeEach(() => {
		// Mock del router de Next.js
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
			replace: mockReplace,
			back: mockBack,
			forward: vi.fn(),
			refresh: vi.fn(),
			prefetch: vi.fn()
		})

		// Mock del pathname
		vi.mocked(usePathname).mockReturnValue('/dashboard')

		// Limpiar mocks
		mockPush.mockClear()
		mockReplace.mockClear()
		mockBack.mockClear()
	})

	describe('1. Renderizado correcto de rutas del dashboard', () => {
		it('debe renderizar correctamente la página principal del dashboard con sesión activa', () => {
			// Arrange: Mock de sesión activa
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: '1',
						name: 'Juan Pérez',
						email: 'juan@example.com',
						role: 'user'
					}
				},
				status: 'authenticated'
			})

			// Act: Renderizar componente
			render(<MockDashboardPage />)

			// Assert: Verificar elementos del dashboard
			expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
			expect(screen.getByText('Dashboard Principal')).toBeInTheDocument()
			expect(screen.getByText('Bienvenido, Juan Pérez')).toBeInTheDocument()
			expect(screen.getByTestId('dashboard-navigation')).toBeInTheDocument()
		})

		it('debe renderizar correctamente la subruta /dashboard/workouts', () => {
			// Arrange: Mock de sesión activa
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: '1',
						name: 'María García',
						email: 'maria@example.com'
					}
				},
				status: 'authenticated'
			})

			// Act: Renderizar página de rutinas
			render(<MockWorkoutsPage />)

			// Assert: Verificar contenido específico de rutinas
			expect(screen.getByTestId('workouts-page')).toBeInTheDocument()
			expect(screen.getByText('Rutinas de Entrenamiento')).toBeInTheDocument()
			expect(screen.getByTestId('new-workout-btn')).toBeInTheDocument()
			expect(screen.getByTestId('back-to-dashboard')).toBeInTheDocument()
		})

		it('debe renderizar correctamente la subruta /dashboard/progress', () => {
			// Arrange: Mock de sesión activa
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: '2',
						name: 'Carlos López',
						email: 'carlos@example.com'
					}
				},
				status: 'authenticated'
			})

			// Act: Renderizar página de progreso
			render(<MockProgressPage />)

			// Assert: Verificar contenido de progreso
			expect(screen.getByTestId('progress-page')).toBeInTheDocument()
			expect(screen.getByText('Progreso del Usuario')).toBeInTheDocument()
			expect(screen.getByTestId('progress-stats')).toBeInTheDocument()
			expect(screen.getByText('Entrenamientos completados: 15')).toBeInTheDocument()
			expect(screen.getByText('Calorías quemadas: 2,450')).toBeInTheDocument()
		})

		it('debe renderizar correctamente la subruta /dashboard/session', () => {
			// Arrange: Mock de sesión con datos completos
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: '3',
						name: 'Ana Rodríguez',
						email: 'ana@example.com',
						role: 'trainer'
					}
				},
				status: 'authenticated'
			})

			// Act: Renderizar página de sesión
			render(<MockSessionPage />)

			// Assert: Verificar información de sesión
			expect(screen.getByTestId('session-page')).toBeInTheDocument()
			expect(screen.getByText('Información de Sesión')).toBeInTheDocument()
			expect(screen.getByTestId('session-info')).toBeInTheDocument()
			expect(screen.getByText('Usuario: Ana Rodríguez')).toBeInTheDocument()
			expect(screen.getByText('Email: ana@example.com')).toBeInTheDocument()
			expect(screen.getByText('Rol: trainer')).toBeInTheDocument()
		})
	})

	describe('2. Funcionamiento de navegación entre enlaces', () => {
		beforeEach(() => {
			// Mock de sesión activa para todos los tests de navegación
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: '1',
						name: 'Usuario Test',
						email: 'test@example.com'
					}
				},
				status: 'authenticated'
			})
		})

		it('debe navegar correctamente desde el dashboard principal a las subrutas', async () => {
			// Act: Renderizar dashboard principal
			render(<MockDashboardPage />)

			// Assert: Verificar que los enlaces de navegación existen
			const workoutsLink = screen.getByTestId('workouts-link')
			const progressLink = screen.getByTestId('progress-link')
			const profileLink = screen.getByTestId('profile-link')
			const sessionLink = screen.getByTestId('session-link')

			expect(workoutsLink).toBeInTheDocument()
			expect(workoutsLink).toHaveAttribute('href', '/dashboard/workouts')
			expect(progressLink).toBeInTheDocument()
			expect(progressLink).toHaveAttribute('href', '/dashboard/progress')
			expect(profileLink).toBeInTheDocument()
			expect(profileLink).toHaveAttribute('href', '/dashboard/profile')
			expect(sessionLink).toBeInTheDocument()
			expect(sessionLink).toHaveAttribute('href', '/dashboard/session')
		})

		it('debe manejar correctamente la navegación programática con botones', async () => {
			// Act: Renderizar página de rutinas
			render(<MockWorkoutsPage />)

			// Act: Hacer clic en el botón de nueva rutina
			const newWorkoutBtn = screen.getByTestId('new-workout-btn')
			fireEvent.click(newWorkoutBtn)

			// Assert: Verificar que se llamó router.push con la ruta correcta
			expect(mockPush).toHaveBeenCalledWith('/dashboard/workouts/new')
			expect(mockPush).toHaveBeenCalledTimes(1)
		})

		it('debe permitir navegación de regreso al dashboard desde subrutas', () => {
			// Act: Renderizar página de rutinas
			render(<MockWorkoutsPage />)

			// Assert: Verificar enlace de regreso
			const backLink = screen.getByTestId('back-to-dashboard')
			expect(backLink).toBeInTheDocument()
			expect(backLink).toHaveAttribute('href', '/dashboard')
		})
	})

	describe('3. Redirección automática sin sesión activa', () => {
		it('debe redirigir a /signin cuando no hay sesión en dashboard principal', () => {
			// Arrange: Mock de sesión no autenticada
			vi.mocked(useSession).mockReturnValue({
				data: null,
				status: 'unauthenticated'
			})

			// Act: Renderizar dashboard sin sesión
			render(<MockDashboardPage />)

			// Assert: Verificar redirección a signin
			expect(mockPush).toHaveBeenCalledWith('/signin')
			expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
		})

		it('debe redirigir a /signin cuando no hay sesión en subruta workouts', () => {
			// Arrange: Mock de sesión no autenticada
			vi.mocked(useSession).mockReturnValue({
				data: null,
				status: 'unauthenticated'
			})

			// Act: Renderizar página de rutinas sin sesión
			render(<MockWorkoutsPage />)

			// Assert: Verificar redirección a signin
			expect(mockPush).toHaveBeenCalledWith('/signin')
			expect(screen.queryByTestId('workouts-page')).not.toBeInTheDocument()
		})

		it('debe redirigir a /signin cuando no hay sesión en subruta progress', () => {
			// Arrange: Mock de sesión no autenticada
			vi.mocked(useSession).mockReturnValue({
				data: null,
				status: 'unauthenticated'
			})

			// Act: Renderizar página de progreso sin sesión
			render(<MockProgressPage />)

			// Assert: Verificar redirección a signin
			expect(mockPush).toHaveBeenCalledWith('/signin')
			expect(screen.queryByTestId('progress-page')).not.toBeInTheDocument()
		})

		it('debe redirigir a /signin cuando no hay sesión en subruta session', () => {
			// Arrange: Mock de sesión no autenticada
			vi.mocked(useSession).mockReturnValue({
				data: null,
				status: 'unauthenticated'
			})

			// Act: Renderizar página de sesión sin sesión
			render(<MockSessionPage />)

			// Assert: Verificar redirección a signin
			expect(mockPush).toHaveBeenCalledWith('/signin')
			expect(screen.queryByTestId('session-page')).not.toBeInTheDocument()
		})

		it('debe manejar correctamente el estado de carga de sesión', () => {
			// Arrange: Mock de sesión en estado de carga
			vi.mocked(useSession).mockReturnValue({
				data: null,
				status: 'loading'
			})

			// Act: Renderizar dashboard en estado de carga
			render(<MockDashboardPage />)

			// Assert: Durante la carga con data null, se redirige a signin
			expect(mockPush).toHaveBeenCalledWith('/signin')
			expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
		})
	})

	describe('4. Casos adicionales de navegación avanzada', () => {
		beforeEach(() => {
			// Mock de sesión activa
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: '1',
						name: 'Usuario Avanzado',
						email: 'avanzado@example.com',
						role: 'trainer'
					}
				},
				status: 'authenticated'
			})
		})

		it('debe manejar navegación a rutas anidadas desde progress', async () => {
			// Act: Renderizar página de progreso
			render(<MockProgressPage />)

			// Act: Hacer clic en ver detalles
			const viewDetailsBtn = screen.getByTestId('view-details-btn')
			fireEvent.click(viewDetailsBtn)

			// Assert: Verificar navegación a ruta anidada
			expect(mockPush).toHaveBeenCalledWith('/dashboard/progress/details')
		})

		it('debe manejar correctamente el logout desde la página de sesión', async () => {
			// Act: Renderizar página de sesión
			render(<MockSessionPage />)

			// Act: Hacer clic en logout
			const logoutBtn = screen.getByTestId('logout-btn')
			fireEvent.click(logoutBtn)

			// Assert: Verificar navegación a logout
			expect(mockPush).toHaveBeenCalledWith('/api/auth/signout')
		})
	})
})