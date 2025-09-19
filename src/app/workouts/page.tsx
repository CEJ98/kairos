import { Metadata } from 'next'
import { WorkoutDashboard } from '@/components/workouts/workout-dashboard'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
	title: 'Rutinas de Ejercicios | Kairos',
	description: 'Crea, gestiona y ejecuta tus rutinas de ejercicios personalizadas',
}

export default async function WorkoutsPage() {
	const session = await getServerSession(authOptions)

	if (!session?.user) {
		redirect('/auth/signin')
	}

	// Obtener el perfil del usuario para determinar su rol
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		include: {
			clientProfiles: true,
			trainerProfile: true
		}
	})

	if (!user) {
		redirect('/auth/signin')
	}

	// Determinar el rol del usuario
	let userRole: 'CLIENT' | 'TRAINER' | 'ADMIN' = 'CLIENT'
	if (user.role === 'ADMIN') {
		userRole = 'ADMIN'
	} else if (user.trainerProfile) {
		userRole = 'TRAINER'
	} else if (user.clientProfiles && user.clientProfiles.length > 0) {
		userRole = 'CLIENT'
	}

	return (
		<div className="min-h-screen bg-background">
			<WorkoutDashboard userRole={userRole} />
		</div>
	)
}