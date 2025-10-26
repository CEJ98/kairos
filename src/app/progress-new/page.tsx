import { Suspense } from 'react';
import { getProgressData } from '@/app/actions/progress-actions';
import { AppLayout } from '@/components/layout/app-layout';
import { BodyWeightChart } from '@/components/progress/body-weight-chart';
import { VolumeChart } from '@/components/progress/volume-chart';
import { AdherenceChart } from '@/components/progress/adherence-chart';
import { StrengthChart } from '@/components/progress/strength-chart';
import { StatsCards } from '@/components/progress/stats-cards';
import { PersonalRecordsCard } from '@/components/progress/personal-records-card';
import { Loader2 } from 'lucide-react';

export default async function ProgressDashboardPage() {
  return (
    <AppLayout
      title="Dashboard de Progreso"
      description="Visualiza tu evolución y alcanza tus objetivos"
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <ProgressDashboard />
      </Suspense>
    </AppLayout>
  );
}

async function ProgressDashboard() {
  const data = await getProgressData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="mb-4 text-muted-foreground">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-poppins mb-2">Sin Datos Disponibles</h2>
        <p className="text-muted-foreground mb-6">
          Por favor inicia sesión o completa algunos entrenamientos para ver tu progreso.
        </p>
        <a
          href="/auth"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Iniciar Sesión
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] opacity-20" />
        <div className="relative">
          <h1 className="text-4xl font-bold font-poppins text-gray-900 mb-2">
            Tu Progreso
          </h1>
          <p className="text-lg text-gray-600">
            Última actualización: {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards currentStats={data.currentStats} />

      {/* Personal Records */}
      <PersonalRecordsCard records={data.personalRecords} />

      {/* Gráficos principales - 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BodyWeightChart data={data.bodyWeight} />
        <StrengthChart data={data.strength} />
      </div>

      {/* Gráficos secundarios - 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <VolumeChart data={data.volume} />
        <AdherenceChart data={data.adherence} />
      </div>

      {/* CTA Footer */}
      <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold font-poppins mb-2">
              ¿Listo para tu próximo entrenamiento?
            </h3>
            <p className="text-blue-100">
              Mantén el ritmo y sigue progresando hacia tus objetivos.
            </p>
          </div>
          <a
            href="/workout"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Ir a Entrenar
          </a>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Skeleton */}
      <div className="h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-gray-200 animate-pulse" />
        ))}
      </div>

      {/* PRs Skeleton */}
      <div className="h-64 rounded-lg bg-gray-200 animate-pulse" />

      {/* Charts Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-96 rounded-lg bg-gray-200 animate-pulse" />
        ))}
      </div>

      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </div>
  );
}
