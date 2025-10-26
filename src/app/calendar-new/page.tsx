'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Info, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { WeeklyCalendarGrid } from '@/components/calendar/weekly-calendar-grid';
import { getWeekCalendarData, WeekCalendarData } from '@/app/actions/calendar-actions';
import { Toaster } from 'sonner';

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarData, setCalendarData] = useState<WeekCalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCalendarData = async (offset: number) => {
    setIsLoading(true);
    try {
      const data = await getWeekCalendarData(offset);
      setCalendarData(data);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData(weekOffset);
  }, [weekOffset]);

  const handleWeekChange = (newOffset: number) => {
    setWeekOffset(newOffset);
  };

  if (isLoading) {
    return (
      <AppLayout
        title="Calendario Semanal"
        description="Organiza y visualiza tus entrenamientos"
      >
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  if (!calendarData) {
    return (
      <AppLayout
        title="Calendario Semanal"
        description="Organiza y visualiza tus entrenamientos"
      >
        <EmptyState />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Calendario Semanal"
      description="Organiza y visualiza tus entrenamientos"
    >
      <Toaster position="top-right" richColors />

      <div className="space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8"
        >
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] opacity-20" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold font-poppins text-gray-900">
                  Calendario Semanal
                </h1>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl">
                Organiza tus entrenamientos arrastrando las tarjetas entre días. Los cambios se
                guardan automáticamente.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <InfoCard
            icon={<div className="h-3 w-3 rounded-full bg-green-500" />}
            label="Completado"
            description="Entrenamiento finalizado"
          />
          <InfoCard
            icon={<div className="h-3 w-3 rounded-full bg-cyan-500" />}
            label="Hoy"
            description="Programado para hoy"
          />
          <InfoCard
            icon={<div className="h-3 w-3 rounded-full bg-gray-400" />}
            label="Pendiente"
            description="Próximos entrenamientos"
          />
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <WeeklyCalendarGrid
            days={calendarData.days}
            weekStart={calendarData.weekStart}
            weekEnd={calendarData.weekEnd}
            onWeekChange={handleWeekChange}
            currentWeekOffset={weekOffset}
          />
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white"
        >
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold font-poppins mb-2">Consejos de Uso</h3>
              <ul className="space-y-1 text-sm text-blue-50">
                <li>• Arrastra las tarjetas para reprogramar entrenamientos a otro día</li>
                <li>• Los entrenamientos completados (verde) no se pueden mover</li>
                <li>• Haz clic en "Completar" para marcar un entrenamiento como realizado</li>
                <li>• Usa las flechas para navegar entre semanas</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

function InfoCard({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <div className="h-40 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />

      {/* Info Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-200 animate-pulse" />
        ))}
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-64 rounded-xl bg-gray-200 animate-pulse" />
        ))}
      </div>

      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="mb-4 text-muted-foreground">
        <Calendar className="mx-auto h-16 w-16" />
      </div>
      <h2 className="text-2xl font-bold font-poppins mb-2">No hay plan activo</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Necesitas tener un plan de entrenamiento activo para ver el calendario. Crea un plan o
        inicia sesión para continuar.
      </p>
      <a
        href="/plan"
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-medium text-white hover:from-blue-600 hover:to-indigo-700 transition-colors"
      >
        Crear Plan
      </a>
    </div>
  );
}
