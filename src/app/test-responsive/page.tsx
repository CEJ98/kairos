import ResponsiveTest from '@/components/testing/responsive-test'

export default function ResponsiveTestPage() {
	return (
		<div className="container mx-auto">
			<ResponsiveTest showDeviceInfo={true} />
		</div>
	)
}

export const metadata = {
	title: 'Prueba de Responsividad - Kairos',
	description: 'Verificación de consistencia visual en diferentes dispositivos y tamaños de pantalla',
}