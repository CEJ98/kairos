'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SecureContactForm } from '@/components/forms/SecureContactForm'
import { 
	Mail, 
	Phone, 
	MapPin, 
	Clock,
	CheckCircle
} from 'lucide-react'

export default function ContactPage() {
	const [isSubmitted, setIsSubmitted] = useState(false)

	if (isSubmitted) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 sm:py-12">
				<div className="max-w-2xl mx-auto mobile-padding">
					<Card className="text-center">
						<CardHeader className="p-6 sm:p-8">
							<div className="flex justify-center mb-4">
								<CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" aria-hidden="true" />
							</div>
							<CardTitle className="text-xl sm:text-2xl text-gray-900 text-balance">
								¡Mensaje Enviado!
							</CardTitle>
							<p className="text-base sm:text-lg text-gray-600 text-balance mt-2">
								Gracias por contactarnos. Nuestro equipo de ventas se pondrá en contacto contigo dentro de las próximas 24 horas.
							</p>
						</CardHeader>
						<CardContent className="p-6 sm:p-8">
							<div className="space-y-4">
								<p className="text-gray-600 mobile-text">
									Mientras tanto, puedes:
								</p>
								<div className="flex flex-col sm:flex-row gap-4 justify-center">
									<Button 
										onClick={() => window.location.href = '/pricing'}
										variant="outline"
										className="w-full sm:w-auto focus-visible touch-target"
									>
										Ver Planes
									</Button>
									<Button 
										onClick={() => window.location.href = '/dashboard'}
										className="w-full sm:w-auto focus-visible touch-target"
									>
										Ir al Dashboard
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 sm:py-12">
			<div className="max-w-7xl mx-auto mobile-padding">
				{/* Header */}
				<div className="text-center mb-8 sm:mb-12">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-balance">
						Contáctanos
					</h1>
					<p className="text-lg sm:text-xl text-gray-600 text-balance">
						¿Tienes preguntas sobre nuestros planes Enterprise? Estamos aquí para ayudarte.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Contact Info */}
					<div className="lg:col-span-1">
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Mail className="h-5 w-5 text-blue-600" />
										Email
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-600">sales@kairosfit.com</p>
									<p className="text-gray-600">support@kairosfit.com</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Phone className="h-5 w-5 text-blue-600" />
										Teléfono
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-600">+1 (555) 123-4567</p>
									<p className="text-sm text-gray-500">Lun - Vie, 9:00 AM - 6:00 PM EST</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<MapPin className="h-5 w-5 text-blue-600" />
										Oficina
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-600">
										123 Fitness Street<br />
										San Francisco, CA 94105<br />
										Estados Unidos
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Clock className="h-5 w-5 text-blue-600" />
										Horarios
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-1 text-sm text-gray-600">
										<p><strong>Lunes - Viernes:</strong> 9:00 AM - 6:00 PM</p>
										<p><strong>Sábado:</strong> 10:00 AM - 4:00 PM</p>
										<p><strong>Domingo:</strong> Cerrado</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Contact Form */}
					<div className="lg:col-span-2">
						<SecureContactForm 
							onSuccess={() => setIsSubmitted(true)}
							defaultValues={{
								type: 'business'
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}