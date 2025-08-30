'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
	Mail, 
	Phone, 
	MapPin, 
	Clock,
	Send,
	Loader2,
	CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export default function ContactPage() {
	const [isLoading, setIsLoading] = useState(false)
	const [isSubmitted, setIsSubmitted] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		company: '',
		phone: '',
		subject: '',
		message: '',
		planInterest: 'ENTERPRISE'
	})

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			// Simular envío de formulario
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			// En una implementación real, aquí enviarías los datos a tu API
			logger.debug('Form data:', formData)
			
			setIsSubmitted(true)
			toast.success('Mensaje enviado correctamente. Te contactaremos pronto.')
		} catch (error) {
			toast.error('Error al enviar el mensaje. Inténtalo de nuevo.')
		} finally {
			setIsLoading(false)
		}
	}

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
							<CardDescription className="text-base sm:text-lg text-balance">
								Gracias por contactarnos. Nuestro equipo de ventas se pondrá en contacto contigo dentro de las próximas 24 horas.
							</CardDescription>
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
						<Card>
							<CardHeader>
								<CardTitle>Envíanos un mensaje</CardTitle>
								<CardDescription>
									Completa el formulario y nos pondremos en contacto contigo lo antes posible.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="name">Nombre completo *</Label>
											<Input
												id="name"
												name="name"
												value={formData.name}
												onChange={handleInputChange}
												required
												placeholder="Tu nombre completo"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">Email *</Label>
											<Input
												id="email"
												name="email"
												type="email"
												value={formData.email}
												onChange={handleInputChange}
												required
												placeholder="tu@email.com"
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="company">Empresa</Label>
											<Input
												id="company"
												name="company"
												value={formData.company}
												onChange={handleInputChange}
												placeholder="Nombre de tu empresa"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="phone">Teléfono</Label>
											<Input
												id="phone"
												name="phone"
												type="tel"
												value={formData.phone}
												onChange={handleInputChange}
												placeholder="+1 (555) 123-4567"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="planInterest">Plan de interés</Label>
										<select
											id="planInterest"
											name="planInterest"
											value={formData.planInterest}
											onChange={handleInputChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="BASIC">Basic - $9/mes</option>
											<option value="PRO">Pro - $19/mes</option>
											<option value="TRAINER">Trainer - $39/mes</option>
											<option value="ENTERPRISE">Enterprise - Personalizado</option>
										</select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="subject">Asunto *</Label>
										<Input
											id="subject"
											name="subject"
											value={formData.subject}
											onChange={handleInputChange}
											required
											placeholder="¿En qué podemos ayudarte?"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="message">Mensaje *</Label>
										<Textarea
											id="message"
											name="message"
											value={formData.message}
											onChange={handleInputChange}
											required
											rows={5}
											placeholder="Cuéntanos más sobre tus necesidades, número de usuarios, funcionalidades específicas que requieres, etc."
										/>
									</div>

									<Button 
										type="submit" 
										disabled={isLoading}
										size="lg"
										className="w-full"
									>
										{isLoading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Enviando...
											</>
										) : (
											<>
												Enviar Mensaje
												<Send className="h-4 w-4 ml-2" />
											</>
										)}
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}