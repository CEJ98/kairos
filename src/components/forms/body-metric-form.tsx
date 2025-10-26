'use client';

import { useTransition, useState } from 'react';
import { addBodyMetric } from '@/app/actions/body-metrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function BodyMetricForm({ onSaved }: { onSaved?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Métricas Corporales</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            setError(null);
            setSuccess(null);
            startTransition(async () => {
              try {
                await addBodyMetric(formData);
                setSuccess('Métricas registradas correctamente');
                onSaved?.();
              } catch (e: any) {
                setError(e.message || 'Error al guardar');
              }
            });
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="date" className="text-sm font-medium">Fecha</label>
              <input type="date" name="date" id="date" className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="weightKg" className="text-sm font-medium">Peso (kg)</label>
              <input type="number" step="0.1" name="weightKg" id="weightKg" placeholder="72.5" className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bodyFat" className="text-sm font-medium">Grasa (%)</label>
              <input type="number" step="0.1" name="bodyFat" id="bodyFat" placeholder="18.2" className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="neckCm" className="text-sm font-medium">Cuello (cm)</label>
              <input type="number" step="0.1" name="neckCm" id="neckCm" placeholder="38" className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="waistCm" className="text-sm font-medium">Cintura (cm)</label>
              <input type="number" step="0.1" name="waistCm" id="waistCm" placeholder="82" className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hipCm" className="text-sm font-medium">Cadera (cm)</label>
              <input type="number" step="0.1" name="hipCm" id="hipCm" placeholder="98" className="border rounded px-2 py-1" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar Métricas'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}