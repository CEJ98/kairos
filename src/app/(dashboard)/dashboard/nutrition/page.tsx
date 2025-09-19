import { Metadata } from 'next'
import { NutritionPlans } from '@/components/nutrition/nutrition-plans'

export const metadata: Metadata = {
	title: 'Planes de Nutrición - Kairos',
	description: 'Gestiona tus planes de alimentación y objetivos nutricionales'
}

export default function NutritionPage() {
	return (
		<div className="container mx-auto py-6">
			<NutritionPlans />
		</div>
	)
}