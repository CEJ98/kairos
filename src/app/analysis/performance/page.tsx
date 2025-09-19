import PerformanceAnalysisReport from '@/components/analysis/performance-analysis-report'

export const metadata = {
	title: 'Análisis de Rendimiento - Kairos Fitness',
	description: 'Reporte completo de análisis de rendimiento de la aplicación Kairos Fitness'
}

export default function PerformanceAnalysisPage() {
	return (
		<div className="container mx-auto">
			<PerformanceAnalysisReport />
		</div>
	)
}