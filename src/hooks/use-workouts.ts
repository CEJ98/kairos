"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type WorkoutFilters = {
  category?: string
  search?: string
}

export function useWorkoutsList(filters: WorkoutFilters = {}) {
  const params = new URLSearchParams()
  if (filters.category && filters.category !== 'all') params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)

  return useQuery({
    queryKey: ['workouts', filters],
    queryFn: async () => {
      const res = await fetch(`/api/workouts?${params.toString()}`)
      if (!res.ok) throw new Error('Error cargando rutinas')
      return res.json() as Promise<{ workouts: any[] }>
    },
  })
}

export function useCreateWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error creando rutina')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}

export function useUpdateWorkout(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/workouts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error actualizando rutina')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}

