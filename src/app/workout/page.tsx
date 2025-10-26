import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dumbbell, Play, Calendar, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { WorkoutEditor } from '@/components/workout/workout-editor';

export default function WorkoutPage() {
	return (
		<AppShell>
			<div className="space-y-6">
				<div>
					<h1 className="font-display text-3xl font-bold text-foreground">Entrenamientos</h1>
					<p className="text-neutral-600 mt-2">
						Gestiona tus sesiones de entrenamiento y sigue tu progreso
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Card className="hover:shadow-lg transition-shadow">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-primary/10 rounded-lg">
								<Play className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">Próxima Sesión</h3>
								<p className="text-sm text-neutral-600">Continúa con tu entrenamiento</p>
							</div>
						</div>
						<p className="text-sm text-neutral-600 mb-4">
							Inicia tu próxima sesión programada de entrenamiento
						</p>
						<Button asChild className="w-full">
							<Link href="/workout/next">
								<Play className="h-4 w-4 mr-2" />
								Comenzar Entrenamiento
							</Link>
						</Button>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-blue-500/10 rounded-lg">
								<Calendar className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">Historial</h3>
								<p className="text-sm text-neutral-600">Revisa entrenamientos pasados</p>
							</div>
						</div>
						<p className="text-sm text-neutral-600 mb-4">
							Consulta tu historial de entrenamientos completados
						</p>
						<Button variant="outline" asChild className="w-full">
							<Link href="/calendar">
								<Calendar className="h-4 w-4 mr-2" />
								Ver Calendario
							</Link>
						</Button>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-green-500/10 rounded-lg">
								<BarChart3 className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">Progreso</h3>
								<p className="text-sm text-neutral-600">Analiza tu evolución</p>
							</div>
						</div>
						<p className="text-sm text-neutral-600 mb-4">
							Revisa tus métricas y progreso en el tiempo
						</p>
						<Button variant="outline" asChild className="w-full">
							<Link href="/progress">
								<BarChart3 className="h-4 w-4 mr-2" />
								Ver Progreso
							</Link>
						</Button>
					</Card>
				</div>

				<Card>
					<div className="flex items-center gap-2 mb-4">
						<Dumbbell className="h-5 w-5" />
						<h3 className="text-lg font-semibold">Acceso Rápido</h3>
					</div>
					<p className="text-sm text-neutral-600 mb-4">
						Herramientas y recursos para optimizar tu entrenamiento
					</p>
					<div className="grid gap-3 sm:grid-cols-2">
						<Button variant="outline" asChild>
							<Link href="/exercises">
								Biblioteca de Ejercicios
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/insights">
								Insights y Análisis
							</Link>
						</Button>
					</div>
				</Card>
			</div>

			{/* Editor de entrenamiento (dummy) */}
			<WorkoutEditor />
		</AppShell>
	);
}