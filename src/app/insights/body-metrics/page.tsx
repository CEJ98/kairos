import { AppLayout } from '@/components/layout/app-layout';
import { BodyWeightChart } from '@/components/progress/body-weight-chart';
import { MeasurementsRadar } from '@/components/progress/measurements-radar';
import { PhotoComparator } from '@/components/progress/photo-comparator';
import { BodyMetricForm } from '@/components/forms/body-metric-form';
import { ProgressPhotosForm } from '@/components/forms/progress-photos-form';
import { getBodyMetrics } from '@/app/actions/progress-actions';
import { listBodyMetrics, listProgressPhotos } from '@/app/actions/body-metrics';

export default async function BodyMetricsPage() {
  const [chartData, rawMetrics, photos] = await Promise.all([
    getBodyMetrics(12),
    listBodyMetrics(12),
    listProgressPhotos(6)
  ]);

  const latest = rawMetrics.at(-1);
  const radarData = latest
    ? [
        { metric: 'Cuello', value: latest.neckCm ?? 0 },
        { metric: 'Cintura', value: latest.waistCm ?? 0 },
        { metric: 'Cadera', value: latest.hipCm ?? 0 }
      ]
    : [];

  const beforeUrl = photos[1]?.frontUrl || photos[1]?.sideUrl || photos[1]?.backUrl;
  const afterUrl = photos[0]?.frontUrl || photos[0]?.sideUrl || photos[0]?.backUrl;

  return (
    <AppLayout
      title="Métricas Corporales"
      description="Registra peso y medidas, y compara fotos de progreso"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Gráfico de Peso */}
          <BodyWeightChart data={chartData} />

          {/* Radar de Medidas */}
          {radarData.length ? (
            <MeasurementsRadar data={radarData} />
          ) : null}
        </div>

        <div className="space-y-6">
          {/* Form Métricas */}
          <BodyMetricForm onSaved={undefined} />

          {/* Form Fotos */}
          <ProgressPhotosForm onSaved={undefined} />
        </div>
      </div>

      {/* Comparador de Fotos */}
      {beforeUrl && afterUrl ? (
        <div className="mt-8">
          <PhotoComparator beforeUrl={beforeUrl!} afterUrl={afterUrl!} />
        </div>
      ) : null}
    </AppLayout>
  );
}