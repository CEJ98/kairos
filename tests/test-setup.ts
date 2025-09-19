/**
 * Enhanced Test Setup Configuration
 * Configures testing environment, mocks, and utilities
 */

import { vi, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    const Component = vi.fn()
    Component.mockImplementation((props: any) => {
      return `Dynamic Component: ${JSON.stringify(props)}`
    })
    return Component
  }
}))

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    STRIPE_SECRET_KEY: 'sk_test_123',
  }
}))

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      refreshSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
        unsubscribe: vi.fn(),
      })),
    },
  })),
}))

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'loading',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
    },
    paymentIntents: {
      create: vi.fn(),
      confirm: vi.fn(),
      retrieve: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  })),
}))

// Mock React Stripe Elements
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  useStripe: vi.fn(() => ({
    confirmPayment: vi.fn(),
    confirmSetup: vi.fn(),
    retrievePaymentIntent: vi.fn(),
  })),
  useElements: vi.fn(() => ({
    getElement: vi.fn(),
    create: vi.fn(),
  })),
  PaymentElement: vi.fn(() => 'PaymentElement'),
  CardElement: vi.fn(() => 'CardElement'),
}))

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: vi.fn(() => 'Toaster'),
}))

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => children),
    span: vi.fn(({ children, ...props }) => children),
    button: vi.fn(({ children, ...props }) => children),
    form: vi.fn(({ children, ...props }) => children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Zustand stores
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  })),
}))

vi.mock('@/stores/workout-store', () => ({
  useWorkoutStore: vi.fn(() => ({
    workouts: [],
    currentWorkout: null,
    isLoading: false,
    fetchWorkouts: vi.fn(),
    createWorkout: vi.fn(),
    updateWorkout: vi.fn(),
    deleteWorkout: vi.fn(),
  })),
}))

// Mock Web APIs that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
  writable: true,
})

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  onopen: vi.fn(),
  onclose: vi.fn(),
  onmessage: vi.fn(),
  onerror: vi.fn(),
  readyState: 1,
})) as any

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    measure: vi.fn(),
    mark: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
  writable: true,
})

// Setup and cleanup for each test
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Reset fetch mock
  mockFetch.mockResolvedValue({
    ok: true,
    json: vi.fn(() => Promise.resolve({})),
    text: vi.fn(() => Promise.resolve('')),
    status: 200,
  })
  
  // Reset localStorage - verificar que existe antes de usar vi.mocked
  if (window.localStorage) {
    vi.mocked(window.localStorage.getItem).mockReturnValue(null)
    vi.mocked(window.localStorage.setItem).mockImplementation(() => {})
    vi.mocked(window.localStorage.removeItem).mockImplementation(() => {})
    vi.mocked(window.localStorage.clear).mockImplementation(() => {})
  }
})

afterEach(() => {
  // Cleanup DOM after each test
  cleanup()
  
  // Clear any timers
  vi.clearAllTimers()
})

// Utility functions for tests
export const testUtils = {
  // Mock successful API response
  mockApiSuccess: (data: any) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn(() => Promise.resolve(data)),
      status: 200,
    })
  },
  
  // Mock API error
  mockApiError: (error: any, status = 500) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: vi.fn(() => Promise.resolve(error)),
      status,
    })
  },
  
  // Mock network error
  mockNetworkError: () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
  },
  
  // Wait for async operations
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Create mock user session
  createMockSession: (user: any = {}) => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        ...user,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated' as const,
  }),
  
  // Create mock Supabase response
  createMockSupabaseResponse: (data: any = null, error: any = null) => ({
    data,
    error,
  }),
}

// Export common test data
export const testData = {
  users: {
    validUser: {
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
    },
    trainer: {
      id: 'trainer-123',
      email: 'trainer@example.com',
      firstName: 'Jane',
      lastName: 'Trainer',
      role: 'trainer',
    },
  },
  workouts: {
    validWorkout: {
      id: 'workout-123',
      name: 'Test Workout',
      description: 'A test workout',
      exercises: [
        {
          id: 'exercise-1',
          name: 'Push-ups',
          sets: 3,
          reps: 10,
          weight: 0,
        },
      ],
      user_id: 'user-123',
    },
  },
  exercises: {
    pushUps: {
      id: 'exercise-1',
      name: 'Push-ups',
      category: 'chest',
      difficulty: 'beginner',
      instructions: 'Perform push-ups with proper form',
    },
  },
}