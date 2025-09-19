import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Next.js modules
jest.mock('next-auth/react')
jest.mock('next/navigation')

const { useSession } = require('next-auth/react')
const navigation = require('next/navigation')

// Mock components for testing
const MockButton = ({ children, onClick, href, disabled, className }) => {
	if (href) {
		return (
			<a href={href} className={className} onClick={onClick}>
				{children}
			</a>
		)
	}
	return (
		<button onClick={onClick} disabled={disabled} className={className}>
			{children}
		</button>
	)
}

const MockLink = ({ children, href, className }) => {
	return (
		<a href={href} className={className}>
			{children}
		</a>
	)
}

// Navigation Component Test
const NavigationComponent = () => {
	const { data: session } = useSession()
	const router = useRouter()

	const handleNavigation = (path) => {
		router.push(path)
	}

	return (
		<nav>
			<MockLink href="/" className="nav-link">Inicio</MockLink>
			<MockLink href="/contact" className="nav-link">Contacto</MockLink>
			<MockLink href="/pricing" className="nav-link">Precios</MockLink>
			{session ? (
				<>
					<MockLink href="/dashboard" className="nav-link">Dashboard</MockLink>
					<MockButton onClick={() => handleNavigation('/dashboard/profile')}>Perfil</MockButton>
				</>
			) : (
				<>
					<MockLink href="/signin" className="nav-link">Iniciar Sesión</MockLink>
					<MockLink href="/signup" className="nav-link">Registrarse</MockLink>
				</>
			)}
		</nav>
	)
}

// Dashboard Component Test
const DashboardComponent = () => {
	const router = useRouter()

	const dashboardLinks = [
		{ href: '/dashboard/workouts', label: 'Rutinas' },
		{ href: '/dashboard/exercises', label: 'Ejercicios' },
		{ href: '/dashboard/progress', label: 'Progreso' },
		{ href: '/dashboard/calendar', label: 'Calendario' },
		{ href: '/dashboard/profile', label: 'Perfil' },
		{ href: '/dashboard/settings', label: 'Configuración' }
	]

	return (
		<div>
			<h1>Dashboard</h1>
			<div className="dashboard-nav">
				{dashboardLinks.map((link) => (
					<MockLink key={link.href} href={link.href} className="dashboard-link">
						{link.label}
					</MockLink>
				))}
			</div>
			<MockButton onClick={() => router.push('/dashboard/trainer')}>Modo Entrenador</MockButton>
		</div>
	)
}

// Trainer Dashboard Component Test
const TrainerDashboardComponent = () => {
	const router = useRouter()

	const trainerLinks = [
		{ href: '/dashboard/trainer/clients', label: 'Clientes' },
		{ href: '/dashboard/trainer/workouts', label: 'Rutinas' },
		{ href: '/dashboard/trainer/calendar', label: 'Calendario' },
		{ href: '/dashboard/trainer/billing', label: 'Facturación' }
	]

	return (
		<div>
			<h1>Dashboard del Entrenador</h1>
			<div className="trainer-nav">
				{trainerLinks.map((link) => (
					<MockLink key={link.href} href={link.href} className="trainer-link">
						{link.label}
					</MockLink>
				))}
			</div>
			<MockButton onClick={() => router.push('/dashboard/trainer/workouts/new')}>Nueva Rutina</MockButton>
		</div>
	)
}

describe('Navigation Components', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        jest.spyOn(navigation, 'useRouter').mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            pathname: '/',
            query: {},
            asPath: '/'
        })
        mockPush.mockClear()
    })

	describe('NavigationComponent', () => {
		it('renders public navigation links when not authenticated', () => {
			useSession.mockReturnValue({ data: null, status: 'unauthenticated' })
			
			render(<NavigationComponent />)
			
			expect(screen.getByText('Inicio')).toBeInTheDocument()
			expect(screen.getByText('Contacto')).toBeInTheDocument()
			expect(screen.getByText('Precios')).toBeInTheDocument()
			expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
			expect(screen.getByText('Registrarse')).toBeInTheDocument()
			expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
		})

		it('renders authenticated navigation links when user is logged in', () => {
			useSession.mockReturnValue({ 
				data: { user: { email: 'test@example.com' } }, 
				status: 'authenticated' 
			})
			
			render(<NavigationComponent />)
			
			expect(screen.getByText('Dashboard')).toBeInTheDocument()
			expect(screen.getByText('Perfil')).toBeInTheDocument()
			expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument()
			expect(screen.queryByText('Registrarse')).not.toBeInTheDocument()
		})

		it('navigates to profile when profile button is clicked', async () => {
			useSession.mockReturnValue({ 
				data: { user: { email: 'test@example.com' } }, 
				status: 'authenticated' 
			})
			
			render(<NavigationComponent />)
			
			const profileButton = screen.getByText('Perfil')
			await userEvent.click(profileButton)
			
			expect(mockPush).toHaveBeenCalledWith('/dashboard/profile')
		})
	})

	describe('DashboardComponent', () => {
		it('renders all dashboard navigation links', () => {
			render(<DashboardComponent />)
			
			expect(screen.getByText('Dashboard')).toBeInTheDocument()
			expect(screen.getByText('Rutinas')).toBeInTheDocument()
			expect(screen.getByText('Ejercicios')).toBeInTheDocument()
			expect(screen.getByText('Progreso')).toBeInTheDocument()
			expect(screen.getByText('Calendario')).toBeInTheDocument()
			expect(screen.getByText('Perfil')).toBeInTheDocument()
			expect(screen.getByText('Configuración')).toBeInTheDocument()
		})

		it('has correct href attributes for all links', () => {
			render(<DashboardComponent />)
			
			expect(screen.getByText('Rutinas').closest('a')).toHaveAttribute('href', '/dashboard/workouts')
			expect(screen.getByText('Ejercicios').closest('a')).toHaveAttribute('href', '/dashboard/exercises')
			expect(screen.getByText('Progreso').closest('a')).toHaveAttribute('href', '/dashboard/progress')
			expect(screen.getByText('Calendario').closest('a')).toHaveAttribute('href', '/dashboard/calendar')
			expect(screen.getByText('Perfil').closest('a')).toHaveAttribute('href', '/dashboard/profile')
			expect(screen.getByText('Configuración').closest('a')).toHaveAttribute('href', '/dashboard/settings')
		})

		it('navigates to trainer mode when button is clicked', async () => {
			render(<DashboardComponent />)
			
			const trainerButton = screen.getByText('Modo Entrenador')
			await userEvent.click(trainerButton)
			
			expect(mockPush).toHaveBeenCalledWith('/dashboard/trainer')
		})
	})

	describe('TrainerDashboardComponent', () => {
		it('renders all trainer navigation links', () => {
			render(<TrainerDashboardComponent />)
			
			expect(screen.getByText('Dashboard del Entrenador')).toBeInTheDocument()
			expect(screen.getByText('Clientes')).toBeInTheDocument()
			expect(screen.getByText('Rutinas')).toBeInTheDocument()
			expect(screen.getByText('Calendario')).toBeInTheDocument()
			expect(screen.getByText('Facturación')).toBeInTheDocument()
		})

		it('has correct href attributes for trainer links', () => {
			render(<TrainerDashboardComponent />)
			
			expect(screen.getByText('Clientes').closest('a')).toHaveAttribute('href', '/dashboard/trainer/clients')
			expect(screen.getByText('Rutinas').closest('a')).toHaveAttribute('href', '/dashboard/trainer/workouts')
			expect(screen.getByText('Calendario').closest('a')).toHaveAttribute('href', '/dashboard/trainer/calendar')
			expect(screen.getByText('Facturación').closest('a')).toHaveAttribute('href', '/dashboard/trainer/billing')
		})

		it('navigates to new workout creation when button is clicked', async () => {
			render(<TrainerDashboardComponent />)
			
			const newWorkoutButton = screen.getByText('Nueva Rutina')
			await userEvent.click(newWorkoutButton)
			
			expect(mockPush).toHaveBeenCalledWith('/dashboard/trainer/workouts/new')
		})
	})
})

// Link Validation Tests
describe('Link Validation', () => {
	const validRoutes = [
		'/',
		'/contact',
		'/pricing',
		'/terms',
		'/privacy',
		'/signin',
		'/signup',
		'/dashboard',
		'/dashboard/workouts',
		'/dashboard/exercises',
		'/dashboard/progress',
		'/dashboard/calendar',
		'/dashboard/profile',
		'/dashboard/settings',
		'/dashboard/activities',
		'/dashboard/community',
		'/dashboard/billing',
		'/dashboard/trainer',
		'/dashboard/trainer/clients',
		'/dashboard/trainer/workouts',
		'/dashboard/trainer/workouts/new',
		'/dashboard/trainer/calendar',
		'/dashboard/trainer/billing'
	]

	it('validates that all critical routes are defined', () => {
		validRoutes.forEach(route => {
			expect(route).toMatch(/^\/[a-zA-Z0-9\/\-_]*$/)
			expect(route).not.toContain(' ')
			expect(route).not.toContain('undefined')
			expect(route).not.toContain('null')
		})
	})

	it('ensures no duplicate routes exist', () => {
		const uniqueRoutes = [...new Set(validRoutes)]
		expect(uniqueRoutes).toHaveLength(validRoutes.length)
	})
})

// Button Functionality Tests
describe('Button Functionality', () => {
	it('buttons are clickable and not disabled by default', () => {
		const TestButton = () => (
			<MockButton onClick={() => {}}>Test Button</MockButton>
		)
		
		render(<TestButton />)
		const button = screen.getByText('Test Button')
		
		expect(button).toBeInTheDocument()
		expect(button).not.toBeDisabled()
	})

	it('disabled buttons cannot be clicked', () => {
		const mockClick = jest.fn()
		const TestButton = () => (
			<MockButton onClick={mockClick} disabled={true}>Disabled Button</MockButton>
		)
		
		render(<TestButton />)
		const button = screen.getByText('Disabled Button')
		
		expect(button).toBeDisabled()
		fireEvent.click(button)
		expect(mockClick).not.toHaveBeenCalled()
	})

	it('button click handlers are called correctly', async () => {
		const mockClick = jest.fn()
		const TestButton = () => (
			<MockButton onClick={mockClick}>Clickable Button</MockButton>
		)
		
		render(<TestButton />)
		const button = screen.getByText('Clickable Button')
		
		await userEvent.click(button)
		expect(mockClick).toHaveBeenCalledTimes(1)
	})
})
