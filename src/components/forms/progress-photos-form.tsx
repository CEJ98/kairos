'use client';

import { useTransition, useState } from 'react';
import { uploadProgressPhotos } from '@/app/actions/body-metrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProgressPhotosForm({ onSaved }: { onSaved?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Fotos de Progreso</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            setError(null);
            setSuccess(null);
            startTransition(async () => {
              try {
                await uploadProgressPhotos(formData);
                setSuccess('Fotos subidas correctamente');
                onSaved?.();
              } catch (e: any) {
                setError(e.message || 'Error al subir');
              }
            });
          }}
          className="space-y-3"
          encType="multipart/form-data"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="date" className="text-sm font-medium">Fecha</label>
              <input type="date" name="date" id="date" className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="note" className="text-sm font-medium">Nota</label>
              <input type="text" name="note" id="note" placeholder="Semana 8 - mini-cut" className="border rounded px-2 py-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="front" className="text-sm font-medium">Frente</label>
              <input type="file" name="front" id="front" accept="image/*" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="side" className="text-sm font-medium">Perfil</label>
              <input type="file" name="side" id="side" accept="image/*" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="back" className="text-sm font-medium">Espalda</label>
              <input type="file" name="back" id="back" accept="image/*" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Subiendo...' : 'Subir Fotos'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}