import { AppLayout } from '@/components/layout/app-layout';
import { MetricsClient } from '@/components/metrics/metrics-client';
import {
  getBodyWeightHistory,
  getLatestMeasurements,
  getProgressPhotos,
  getMetricsSummary,
  deleteProgressPhoto,
  saveBodyWeight,
  saveBodyMeasurements,
  saveProgressPhoto,
} from '@/app/actions/metrics-actions';
import type {
  BodyWeightData,
  BodyMeasurementsData,
  ProgressPhotoData,
  MetricsSummary,
} from '@/types/metrics';
export default async function MetricsPage() {
  const [weightHistory, latestMeasurements, photos, summary]: [
    BodyWeightData[],
    BodyMeasurementsData | null,
    ProgressPhotoData[],
    MetricsSummary | null,
  ] = await Promise.all([
    getBodyWeightHistory(6),
    getLatestMeasurements(),
    getProgressPhotos(),
    getMetricsSummary(),
  ]);

  return (
    <AppLayout title="Métricas Corporales" description="Registra y visualiza tu progreso">
      <MetricsClient
        initialWeightHistory={weightHistory}
        initialMeasurements={latestMeasurements}
        initialPhotos={photos}
        initialSummary={summary}
        deleteProgressPhotoAction={deleteProgressPhoto}
        saveBodyWeightAction={saveBodyWeight}
        saveBodyMeasurementsAction={saveBodyMeasurements}
        saveProgressPhotoAction={saveProgressPhoto}
      />
    </AppLayout>
  );
}
