import { Metadata } from 'next';
import ComprehensiveImprovementReport from '@/components/analysis/comprehensive-improvement-report';

export const metadata: Metadata = {
	title: 'Reporte Integral de Mejoras | Kairos',
	description: 'Análisis completo de optimizaciones implementadas y recomendaciones futuras para la aplicación Kairos'
};

export default function ComprehensiveAnalysisPage() {
	return (
		<div className="container mx-auto py-6">
			<ComprehensiveImprovementReport />
		</div>
	);
}