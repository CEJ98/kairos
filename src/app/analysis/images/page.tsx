import { Metadata } from 'next';
import ImageOptimizationReport from '@/components/analysis/image-optimization-report';

export const metadata: Metadata = {
	title: 'Optimización de Imágenes - Análisis Kairos',
	description: 'Reporte completo de optimización y rendimiento de imágenes en la aplicación Kairos'
};

export default function ImageOptimizationPage() {
	return (
		<div className="container mx-auto py-6">
			<ImageOptimizationReport />
		</div>
	);
}