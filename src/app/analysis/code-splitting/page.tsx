import { Metadata } from 'next';
import CodeSplittingReport from '@/components/analysis/code-splitting-report';

export const metadata: Metadata = {
	title: 'División de Código - Análisis Kairos',
	description: 'Reporte completo de optimización de bundle y lazy loading en la aplicación Kairos'
};

export default function CodeSplittingPage() {
	return (
		<div className="container mx-auto py-6">
			<CodeSplittingReport />
		</div>
	);
}