/**
 * Test Utilities
 * Utilidades y wrappers para testing
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock de Session para NextAuth
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER'
  },
  expires: new Date(Date.now() + 86400000).toISOString() // 24 horas
}

// Provider wrapper para tests
interface AllTheProvidersProps {
  children: React.ReactNode
  session?: any
}

const AllTheProviders = ({ children, session = mockSession }: AllTheProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { 
    session?: any 
  }
) => {
  const { session, ...renderOptions } = options || {}
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders session={session}>{children}</AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock de useRouter
export const mockUseRouter = {
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  isReady: true
}

// Mock de fetch responses
export const mockFetchResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

// Helper para crear mock de ejercicios
export const createMockExercise = (overrides = {}) => ({
  id: 'test-exercise-1',
  name: 'Push Up',
  description: 'Basic push up exercise',
  category: 'CHEST',
  muscleGroups: ['CHEST', 'TRICEPS'],
  difficulty: 'BEGINNER',
  equipment: 'BODYWEIGHT',
  instructions: ['Start in plank position', 'Lower body down', 'Push back up'],
  imageUrl: '/images/exercises/pushup.jpg',
  videoUrl: '/videos/exercises/pushup.mp4',
  gifUrl: '/gifs/exercises/pushup.gif',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// Helper para crear mock de rutinas
export const createMockWorkout = (overrides = {}) => ({
  id: 'test-workout-1',
  name: 'Upper Body Strength',
  description: 'Focus on chest, shoulders, and arms',
  category: 'STRENGTH',
  difficulty: 'INTERMEDIATE',
  duration: 45,
  exercises: [createMockExercise()],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// Helper para crear mock de usuario
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  subscription: 'FREE',
  profile: {
    age: 25,
    weight: 70,
    height: 175,
    fitnessLevel: 'INTERMEDIATE',
    goals: ['LOSE_WEIGHT', 'BUILD_MUSCLE']
  },
  ...overrides
})

// Helper para crear mock de progreso
export const createMockProgress = (overrides = {}) => ({
  id: 'test-progress-1',
  userId: 'test-user-1',
  date: new Date(),
  weight: 70,
  bodyFat: 15,
  muscleMass: 55,
  workoutsCompleted: 3,
  totalDuration: 135,
  calories: 450,
  ...overrides
})

// Re-exportar todo de testing-library
export * from '@testing-library/react'
export { customRender as render }