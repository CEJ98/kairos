"use client"

import { useQuery } from '@tanstack/react-query'

export type Measurement = {
  id: string
  measuredAt: string
  weight?: number | null
  bodyFat?: number | null
  muscle?: number | null
  chest?: number | null
  waist?: number | null
  hips?: number | null
  arms?: number | null
  thighs?: number | null
  notes?: string | null
}

export function useMeasurements(params?: { startDate?: string; endDate?: string; limit?: number }) {
  const qs = new URLSearchParams()
  if (params?.startDate) qs.set('startDate', params.startDate)
  if (params?.endDate) qs.set('endDate', params.endDate)
  if (params?.limit) qs.set('limit', String(params.limit))

  return useQuery({
    queryKey: ['measurements', params],
    queryFn: async () => {
      const res = await fetch(`/api/measurements?${qs.toString()}`)
      if (!res.ok) throw new Error('Error cargando mediciones')
      const json = await res.json()
      // API actual devuelve { measurements, stats }
      return json as { measurements: Measurement[]; stats: any }
    },
  })
}

export function useMetricSeries(metric: 'weight' | 'bodyFat', params?: { startDate?: string; endDate?: string; limit?: number }) {
  const qs = new URLSearchParams()
  if (params?.startDate) qs.set('startDate', params.startDate)
  if (params?.endDate) qs.set('endDate', params.endDate)
  if (params?.limit) qs.set('limit', String(params.limit))
  qs.set('metric', metric)

  return useQuery({
    queryKey: ['measurements-series', metric, params],
    queryFn: async () => {
      const res = await fetch(`/api/measurements?${qs.toString()}`)
      if (!res.ok) throw new Error('Error cargando serie')
      // Cuando se pasa metric, la API devuelve array de { measuredAt, value }
      const json = await res.json()
      return json as { measurements: { measuredAt: string; value: number; id: string; notes?: string }[]; stats: any }
    },
  })
}

