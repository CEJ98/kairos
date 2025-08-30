'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Shield, Users, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<Link href="/" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4">
						<ArrowLeft className="h-4 w-4" />
						Volver al inicio
					</Link>
					<h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
					<p className="text-gray-600 mt-2">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
				</div>

				{/* Content */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								1. Aceptación de los Términos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">
								Al acceder y utilizar Kairos Fitness, usted acepta estar sujeto a estos términos y condiciones de uso. 
								Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								2. Uso del Servicio
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-semibold mb-2">2.1 Elegibilidad</h4>
								<p className="text-gray-700">
									Debe tener al menos 18 años para utilizar este servicio. Al registrarse, declara que toda la información proporcionada es veraz y precisa.
								</p>
							</div>
							<div>
								<h4 className="font-semibold mb-2">2.2 Cuenta de Usuario</h4>
								<p className="text-gray-700">
									Es responsable de mantener la confidencialidad de su cuenta y contraseña. Usted es responsable de todas las actividades que ocurran bajo su cuenta.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								3. Privacidad y Datos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">
								Nos comprometemos a proteger su privacidad. El uso de sus datos personales se rige por nuestra 
								<Link href="/privacy" className="text-green-600 hover:underline">Política de Privacidad</Link>, 
								que forma parte integral de estos términos.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertCircle className="h-5 w-5" />
								4. Limitación de Responsabilidad
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-semibold mb-2">4.1 Asesoramiento Médico</h4>
								<p className="text-gray-700">
									Kairos Fitness no proporciona asesoramiento médico. Consulte con un profesional de la salud antes de comenzar cualquier programa de ejercicios.
								</p>
							</div>
							<div>
								<h4 className="font-semibold mb-2">4.2 Uso bajo su Propio Riesgo</h4>
								<p className="text-gray-700">
									El uso de nuestros servicios es bajo su propio riesgo. No nos hacemos responsables de lesiones o daños que puedan resultar del uso de la plataforma.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								5. Suscripciones y Pagos
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-semibold mb-2">5.1 Planes de Suscripción</h4>
								<p className="text-gray-700">
									Ofrecemos diferentes planes de suscripción con funcionalidades específicas. Los precios y características están disponibles en nuestra página de precios.
								</p>
							</div>
							<div>
								<h4 className="font-semibold mb-2">5.2 Facturación y Renovación</h4>
								<p className="text-gray-700">
									Las suscripciones se renuevan automáticamente. Puede cancelar en cualquier momento desde su panel de configuración.
								</p>
							</div>
							<div>
								<h4 className="font-semibold mb-2">5.3 Política de Reembolsos</h4>
								<p className="text-gray-700">
									Ofrecemos reembolsos completos dentro de los primeros 30 días. Los reembolsos se procesan en 5-10 días hábiles.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>6. Propiedad Intelectual</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 mb-4">
								Todos los contenidos, marcas registradas, logos y propiedad intelectual relacionada con Kairos Fitness son propiedad de la empresa o sus licenciantes.
							</p>
							<p className="text-gray-700">
								No tiene derecho a usar, copiar, modificar o distribuir nuestro contenido sin autorización expresa por escrito.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>7. Terminación del Servicio</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-gray-700">
								Nos reservamos el derecho de terminar o suspender su cuenta si:
							</p>
							<ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
								<li>Viola estos términos de servicio</li>
								<li>Usa el servicio para actividades ilegales</li>
								<li>Compromete la seguridad de otros usuarios</li>
								<li>No paga las tarifas correspondientes</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>8. Modificaciones</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">
								Nos reservamos el derecho de modificar estos términos en cualquier momento. 
								Las modificaciones importantes se notificarán por email con 30 días de anticipación.
								El uso continuado del servicio después de las modificaciones constituye aceptación de los nuevos términos.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>9. Ley Aplicable y Jurisdicción</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">
								Estos términos se rigen por las leyes del estado de California, Estados Unidos. 
								Cualquier disputa se resolverá en los tribunales de San Francisco, California.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>10. Contacto</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">
								Si tiene preguntas sobre estos términos, puede contactarnos a través de nuestra 
								<Link href="/contact" className="text-green-600 hover:underline">página de contacto</Link>
								o enviando un correo a legal@kairosfit.com.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Footer Actions */}
				<div className="mt-8 flex justify-center">
					<Link href="/">
						<Button>
							Volver al Inicio
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}