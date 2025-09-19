import { Metadata } from 'next'
import UIUXEvaluationReport from '@/components/analysis/ui-ux-evaluation-report'

export const metadata: Metadata = {
	title: 'Evaluación UI/UX - Kairos',
	description: 'Análisis completo de diseño, usabilidad y accesibilidad de la aplicación Kairos'
}

export default function UIUXEvaluationPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<UIUXEvaluationReport />
		</div>
	)
}