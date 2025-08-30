'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Eye, Database, Lock, Users, Mail } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<Link href="/" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4">
						<ArrowLeft className="h-4 w-4" />
						Volver al inicio
					</Link>
					<h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
					<p className="text-gray-600 mt-2">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
				</div>

				{/* Content */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Introducción
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">
								En Kairos Fitness, nos comprometemos a proteger su privacidad y manejar sus datos personales de manera responsable. 
								Esta política explica cómo recopilamos, utilizamos y protegemos su información.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								Información que Recopilamos
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-semibold mb-2">Información Personal</h4>
								<ul className="list-disc list-inside text-gray-700 space-y-1">
									<li>Nombre completo y información de contacto</li>
									<li>Dirección de correo electrónico</li>
									<li>Información de perfil de fitness</li>
									<li>Datos de progreso y métricas de entrenamiento</li>
								</ul>
							</div>
							<div>
								<h4 className="font-semibold mb-2">Información Técnica</h4>
								<ul className="list-disc list-inside text-gray-700 space-y-1">
									<li>Dirección IP y datos de ubicación</li>
									<li>Información del dispositivo y navegador</li>
									<li>Cookies y tecnologías similares</li>
									<li>Datos de uso de la aplicación</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="h-5 w-5" />
								Cómo Utilizamos su Información
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="list-disc list-inside text-gray-700 space-y-2">
								<li>Proporcionar y mejorar nuestros servicios de fitness</li>
								<li>Personalizar su experiencia de entrenamiento</li>
								<li>Comunicarnos con usted sobre su cuenta y servicios</li>
								<li>Procesar pagos y transacciones</li>
								<li>Analizar el uso de la plataforma para mejoras</li>
								<li>Cumplir con obligaciones legales</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Compartir Información
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-gray-700">
								No vendemos, alquilamos ni compartimos su información personal con terceros, excepto en las siguientes circunstancias:
							</p>
							<ul className="list-disc list-inside text-gray-700 space-y-1">
								<li>Con su consentimiento explícito</li>
								<li>Con proveedores de servicios que nos ayudan a operar la plataforma</li>
								<li>Cuando sea requerido por ley</li>
								<li>Para proteger nuestros derechos o seguridad</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Lock className="h-5 w-5" />
								Seguridad de Datos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 mb-4">
								Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
							</p>
							<ul className="list-disc list-inside text-gray-700 space-y-1">
								<li>Cifrado de datos en tránsito y en reposo</li>
								<li>Acceso restringido a información personal</li>
								<li>Monitoreo regular de seguridad</li>
								<li>Copias de seguridad regulares</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Sus Derechos (GDPR)
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-gray-700 mb-4">Bajo el Reglamento General de Protección de Datos (GDPR), usted tiene los siguientes derechos:</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<h4 className="font-semibold mb-2">Derechos de Acceso</h4>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• Acceder a su información personal</li>
										<li>• Conocer cómo procesamos sus datos</li>
										<li>• Obtener una copia de sus datos</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold mb-2">Derechos de Control</h4>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• Corregir datos inexactos</li>
										<li>• Solicitar la eliminación de sus datos</li>
										<li>• Limitar el procesamiento</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold mb-2">Derechos de Transferencia</h4>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• Portabilidad de datos</li>
										<li>• Transferir datos a otro proveedor</li>
										<li>• Exportar sus datos personales</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold mb-2">Derechos de Consentimiento</h4>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• Retirar el consentimiento</li>
										<li>• Objetar al procesamiento</li>
										<li>• Darse de baja del marketing</li>
									</ul>
								</div>
							</div>
							<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
								<h4 className="font-semibold text-blue-900 mb-2">Cómo Ejercer sus Derechos</h4>
								<p className="text-sm text-blue-800">
									Para ejercer cualquiera de estos derechos, contáctenos en privacy@kairosfit.com. 
									Responderemos a su solicitud dentro de 30 días calendarios.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								Retención de Datos
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-gray-700">Conservamos sus datos personales solo durante el tiempo necesario para los fines descritos en esta política:</p>
							<div className="space-y-3">
								<div className="flex justify-between items-center py-2 border-b border-gray-100">
									<span className="text-sm font-medium">Datos de cuenta activa</span>
									<span className="text-sm text-gray-600">Durante la vida de la cuenta</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-gray-100">
									<span className="text-sm font-medium">Datos de entrenamiento</span>
									<span className="text-sm text-gray-600">3 años después del cierre</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-gray-100">
									<span className="text-sm font-medium">Datos de facturación</span>
									<span className="text-sm text-gray-600">7 años (requisitos fiscales)</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-gray-100">
									<span className="text-sm font-medium">Datos de marketing</span>
									<span className="text-sm text-gray-600">Hasta que se dé de baja</span>
								</div>
								<div className="flex justify-between items-center py-2">
									<span className="text-sm font-medium">Logs del sistema</span>
									<span className="text-sm text-gray-600">90 días</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="h-5 w-5" />
								Transferencias Internacionales
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 mb-4">
								Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio Económico Europeo (EEE). 
								Cuando transferimos datos fuera del EEE, implementamos las siguientes salvaguardas:
							</p>
							<ul className="list-disc list-inside text-gray-700 space-y-2">
								<li>Cláusulas contractuales estándar aprobadas por la Comisión Europea</li>
								<li>Certificaciones de adecuación para países con protecciones equivalentes</li>
								<li>Medidas técnicas adicionales para proteger los datos en tránsito</li>
								<li>Auditorías regulares de seguridad de proveedores</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Menores de Edad
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 mb-4">
								Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos 
								intencionalmente información personal de menores de 18 años.
							</p>
							<p className="text-gray-700">
								Si nos enteramos de que hemos recopilado información personal de un menor sin el consentimiento 
								parental verificable, eliminaremos esa información de nuestros servidores inmediatamente.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Mail className="h-5 w-5" />
								Contacto
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">
								Si tiene preguntas sobre esta política de privacidad o desea ejercer sus derechos, 
								puede contactarnos a través de nuestra 
								<Link href="/contact" className="text-green-600 hover:underline">página de contacto</Link> 
								o enviando un correo a privacy@kairosfit.com.
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