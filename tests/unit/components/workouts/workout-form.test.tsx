import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils'
import { WorkoutForm } from '@/components/workouts/workout-form'

describe('WorkoutForm', () => {
  const onSubmit = vi.fn()

  beforeEach(() => {
    onSubmit.mockReset()
  })

  it('shows validation errors for empty fields', async () => {
    render(<WorkoutForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // Should render zod error messages
    const errs = await screen.findAllByText(/at least/i)
    expect(errs.length).toBeGreaterThan(0)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid data', async () => {
    render(<WorkoutForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Leg Day' } })
    fireEvent.change(screen.getByLabelText(/categoría/i), { target: { value: 'STRENGTH' } })
    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'Piernas' } })

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
  })
})
