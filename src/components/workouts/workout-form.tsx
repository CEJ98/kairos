"use client"

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { workoutCreateSchema } from '@/lib/validations/api-schemas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type FormSchema = z.infer<typeof workoutCreateSchema>

export type WorkoutFormProps = {
  initialData?: Partial<FormSchema>
  onSubmit: (data: FormSchema) => Promise<void> | void
  submitting?: boolean
}

export function WorkoutForm({ initialData, onSubmit, submitting }: WorkoutFormProps) {
  const schema = useMemo(() => workoutCreateSchema.pick({ name: true, category: true, description: true }), [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      description: initialData?.description || '',
    } as any,
  })

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <form onSubmit={handleSubmit((data) => onSubmit(data))}>
          <div className="space-y-2">
            <Label htmlFor="name">Título</Label>
            <Input id="name" placeholder="Nombre de la rutina" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message as any}</p>}
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="category">Categoría</Label>
            <Input id="category" placeholder="Ej: STRENGTH, CARDIO" {...register('category')} />
            {errors.category && <p className="text-sm text-red-600">{errors.category.message as any}</p>}
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" placeholder="Opcional" {...register('description')} />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message as any}</p>}
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={!!submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

