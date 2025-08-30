/**
 * Mock handlers for workout endpoints
 */

import { http, HttpResponse } from 'msw'

const mockWorkouts = [
  {
    id: 'workout-1',
    name: 'Upper Body Strength',
    description: 'Focus on chest, shoulders, and arms',
    creatorId: 'test-user-id',
    isTemplate: false,
    category: 'STRENGTH',
    duration: 45,
    exercises: [
      {
        id: 'we-1',
        order: 1,
        sets: 3,
        reps: 10,
        exercise: {
          id: 'ex-1',
          name: 'Push-ups',
          category: 'STRENGTH',
        },
      },
    ],
  },
]

export const workoutHandlers = [
  // Get user workouts
  http.get('/api/workouts', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    return HttpResponse.json({
      workouts: mockWorkouts.filter(w => w.creatorId === userId),
    })
  }),

  // Create workout
  http.post('/api/workouts', async ({ request }) => {
    const body = await request.json() as any
    
    const newWorkout = {
      id: 'new-workout-id',
      ...body,
      createdAt: new Date().toISOString(),
    }
    
    return HttpResponse.json(newWorkout, { status: 201 })
  }),

  // Get single workout
  http.get('/api/workouts/:id', ({ params }) => {
    const workout = mockWorkouts.find(w => w.id === params.id)
    
    if (!workout) {
      return HttpResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json(workout)
  }),

  // Update workout
  http.put('/api/workouts/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const workout = mockWorkouts.find(w => w.id === params.id)
    
    if (!workout) {
      return HttpResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }
    
    const updatedWorkout = { ...workout, ...body }
    return HttpResponse.json(updatedWorkout)
  }),

  // Delete workout
  http.delete('/api/workouts/:id', ({ params }) => {
    const workoutIndex = mockWorkouts.findIndex(w => w.id === params.id)
    
    if (workoutIndex === -1) {
      return HttpResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({ message: 'Workout deleted successfully' })
  }),
]