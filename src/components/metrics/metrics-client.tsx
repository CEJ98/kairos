'use client';
import { clientLogger } from '@/lib/logging/client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Activity, Plus, TrendingUp, TrendingDown, Scale, Ruler, Camera } from 'lucide-react';
import { PhotoComparison } from '@/components/metrics/photo-comparison';
import { MetricsForms } from '@/components/metrics/metrics-forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type {
  BodyWeightData,
  BodyMeasurementsData,
  ProgressPhotoData,
  MetricsSummary,
  BodyWeightInput,
  BodyMeasurementsInput,
} from '@/types/metrics';
// Nota: evitamos importar acciones de servidor directamente en componentes cliente

const WeightChart = dynamic(
  () => import('@/components/metrics/weight-chart').then((mod) => mod.WeightChart),
  {
    ssr: false,
    loading: () => <p>Cargando gráfico de peso...</p>,
  }
);

const MeasurementsRadar = dynamic(
  () => import('@/components/metrics/measurements-radar').then((mod) => mod.MeasurementsRadar),
  {
    ssr: false,
    loading: () => <p>Cargando radar de medidas...</p>,
  }
);

interface MetricsClientProps {
  initialWeightHistory: BodyWeightData[];
  initialMeasurements: BodyMeasurementsData | null;
  initialPhotos: ProgressPhotoData[];
  initialSummary: MetricsSummary | null;
  deleteProgressPhotoAction: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveBodyWeightAction: (data: BodyWeightInput) => Promise<{ success: boolean; error?: string }>;
  saveBodyMeasurementsAction: (
    data: BodyMeasurementsInput
  ) => Promise<{ success: boolean; error?: string }>;
  saveProgressPhotoAction: (dataUrl: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
}

export function MetricsClient({
  initialWeightHistory,
  initialMeasurements,
  initialPhotos,
  initialSummary,
  deleteProgressPhotoAction,
  saveBodyWeightAction,
  saveBodyMeasurementsAction,
  saveProgressPhotoAction,
}: MetricsClientProps) {
  const router = useRouter();
  const [isFormsOpen, setIsFormsOpen] = useState(false);
  const [formsTab, setFormsTab] = useState<'weight' | 'measurements' | 'photo'>('weight');

  // Data states initialized from server props
  // Normalize dates coming from server (serialized as strings) to Date objects
  const [weightHistory, setWeightHistory] = useState<BodyWeightData[]>(
    initialWeightHistory.map((entry) => ({
      ...entry,
      // Ensure date is a Date instance on the client
      date: entry.date instanceof Date ? entry.date : new Date(entry.date as unknown as string),
    }))
  );
  const [latestMeasurements, setLatestMeasurements] = useState<BodyMeasurementsData | null>(
    initialMeasurements
      ? {
          ...initialMeasurements,
          date:
            initialMeasurements.date instanceof Date
              ? initialMeasurements.date
              : new Date(initialMeasurements.date as unknown as string),
        }
      : null
  );
  const [photos, setPhotos] = useState<ProgressPhotoData[]>(
    initialPhotos.map((p) => ({
      ...p,
      createdAt: p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt as unknown as string),
    }))
  );
  const [summary, setSummary] = useState<MetricsSummary | null>(initialSummary);

  const reloadData = async () => {
    try {
      router.refresh();
    } catch (error) {
      clientLogger.error('Error reloading metrics data:', error);
    }
  };

  const openForms = (tab: 'weight' | 'measurements' | 'photo') => {
    setFormsTab(tab);
    setIsFormsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8"
      >
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] opacity-20" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <h1 className="text-4xl font-bold font-poppins text-gray-900">
                Métricas Corporales
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Registra tu peso, medidas y fotos de progreso para visualizar tu transformación.
            </p>
          </div>
          <Button
            onClick={() => openForms('weight')}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Registrar
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Scale className="h-6 w-6" />
                {summary.weightChange !== null && (
                  <>
                    {summary.weightChange < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-200" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-orange-200" />
                    )}
                  </>
                )}
              </div>
              <p className="text-sm font-medium opacity-90">Peso Actual</p>
              <p className="text-3xl font-bold mt-1">
                {summary.currentWeight ? `${summary.currentWeight} kg` : '--'}
              </p>
              {summary.weightChange !== null && (
                <p className="text-xs mt-1 opacity-80">
                  {summary.weightChange > 0 ? '+' : ''}
                  {summary.weightChange} kg este mes
                </p>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-6 w-6" />
                {summary.bodyFatChange !== null && (
                  <>
                    {summary.bodyFatChange < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-200" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-orange-200" />
                    )}
                  </>
                )}
              </div>
              <p className="text-sm font-medium opacity-90">Grasa Corporal</p>
              <p className="text-3xl font-bold mt-1">
                {summary.currentBodyFat ? `${summary.currentBodyFat}%` : '--'}
              </p>
              {summary.bodyFatChange !== null && (
                <p className="text-xs mt-1 opacity-80">
                  {summary.bodyFatChange > 0 ? '+' : ''}
                  {summary.bodyFatChange}% este mes
                </p>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Ruler className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium opacity-90">Mediciones</p>
              <p className="text-3xl font-bold mt-1">{summary.totalMeasurements}</p>
              <p className="text-xs mt-1 opacity-80">Registros guardados</p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium opacity-90">Fotos</p>
              <p className="text-3xl font-bold mt-1">{summary.totalPhotos}</p>
              <p className="text-xs mt-1 opacity-80">Fotos de progreso</p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-3"
      >
        <Button onClick={() => openForms('weight')} variant="outline" size="sm">
          <Scale className="h-4 w-4 mr-2" />
          Registrar Peso
        </Button>
        <Button onClick={() => openForms('measurements')} variant="outline" size="sm">
          <Ruler className="h-4 w-4 mr-2" />
          Registrar Medidas
        </Button>
        <Button onClick={() => openForms('photo')} variant="outline" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Subir Foto
        </Button>
      </motion.div>

      {/* Weight Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <WeightChart data={weightHistory} />
      </motion.div>

      {/* Measurements and Photos Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <MeasurementsRadar data={latestMeasurements} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <PhotoComparison
            photos={photos}
            onUploadClick={() => openForms('photo')}
            onDeletePhoto={deleteProgressPhotoAction}
          />
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white"
      >
        <div className="flex items-start gap-4">
          <Activity className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold font-poppins mb-2">Consejos para Mediciones</h3>
            <ul className="space-y-1 text-sm text-purple-50">
              <li>• Pésate siempre a la misma hora, preferiblemente en ayunas</li>
              <li>• Toma medidas con cinta métrica flexible y sin apretar</li>
              <li>• Mantén la misma postura y punto de referencia en cada medición</li>
              <li>• Toma fotos en el mismo lugar con buena iluminación natural</li>
              <li>• Registra tus métricas semanalmente para seguimiento consistente</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Forms Modal */}
      <MetricsForms
        isOpen={isFormsOpen}
        onClose={() => {
          setIsFormsOpen(false);
          void reloadData();
        }}
        initialTab={formsTab}
        saveBodyWeightAction={saveBodyWeightAction}
        saveBodyMeasurementsAction={saveBodyMeasurementsAction}
        saveProgressPhotoAction={saveProgressPhotoAction}
      />
    </div>
  );
}