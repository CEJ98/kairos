"use client"

import { Card, CardContent } from '@/components/ui/card'

type Row = {
  id: string
  measuredAt: string
  weight?: number | null
  bodyFat?: number | null
  waist?: number | null
  notes?: string | null
}

export function MeasurementTable({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium text-right">Peso (kg)</th>
                <th className="px-4 py-3 font-medium text-right">% Grasa</th>
                <th className="px-4 py-3 font-medium text-right">Cintura (cm)</th>
                <th className="px-4 py-3 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{new Date(r.measuredAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">{r.weight ?? '-'}</td>
                  <td className="px-4 py-3 text-right">{r.bodyFat ?? '-'}</td>
                  <td className="px-4 py-3 text-right">{r.waist ?? '-'}</td>
                  <td className="px-4 py-3 truncate max-w-[240px]">{r.notes || ''}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                    Aún no hay mediciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

