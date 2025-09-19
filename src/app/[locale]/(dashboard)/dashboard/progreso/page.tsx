'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProgressDashboard from '@/components/progress/progress-dashboard'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProgresoPage({ params }: any) {
	const { data: session, status } = useSession()
	const router = useRouter()

	// Verificar autenticação e role
	useEffect(() => {
		if (status === 'loading') return

		if (!session) {
			router.push(`/${params.locale}/auth/signin`)
			return
		}

		// Verificar se é cliente (aluno)
		if (session.user.role !== 'CLIENT') {
			router.push(`/${params.locale}/dashboard`)
			return
		}
	}, [session, status, router, params.locale])

	const handleClose = () => {
		router.push(`/${params.locale}/dashboard`)
	}

	// Loading state
	if (status === 'loading') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		)
	}

	// Não autorizado
	if (!session || session.user.role !== 'CLIENT') {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center gap-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleClose}
								className="flex items-center gap-2"
							>
								<ArrowLeft className="h-4 w-4" />
								Voltar
							</Button>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">Progresso</h1>
								<p className="text-sm text-gray-600">Acompanhe sua evolução</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600">Olá, {session.user.name}</span>
							<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
								<span className="text-white text-sm font-medium">
									{session.user.name?.charAt(0).toUpperCase()}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<ProgressDashboard />
			</div>
		</div>
	)
}
