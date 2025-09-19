'use client'

import { PlayerRutina } from '@/components/workouts/player-rutina'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function PlayerRutinaPage() {
	const router = useRouter()
	const { data: session, status } = useSession()
	
	useEffect(() => {
		if (status === 'loading') return
		
		if (!session) {
			router.push('/auth/signin')
			return
		}
		
		// Solo permitir acceso a clientes
		if (session.user.role !== 'CLIENT') {
			router.push('/dashboard')
			return
		}
	}, [session, status, router])
	
	const handleClose = () => {
		router.push('/dashboard')
	}
	
	if (status === 'loading') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		)
	}
	
	if (!session || session.user.role !== 'CLIENT') {
		return null
	}
	
	return (
		<div className="min-h-screen bg-gray-50 py-4">
			<PlayerRutina onClose={handleClose} />
		</div>
	)
}