/**
 * useDashboardData Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { mockFetchResponse } from '../utils/test-utils'

// Mock fetch
global.fetch = jest.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={{ user: { id: '1' } } as any}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}

describe('useDashboardData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.stats).toBeDefined()
    expect(result.current.weeklyProgress).toEqual([])
    expect(result.current.recentRecords).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('fetches dashboard data successfully', async () => {
    const mockStats = {
      totalWorkouts: 15,
      weeklyWorkouts: 3,
      totalDuration: 450,
      averageDuration: 30
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockFetchResponse(mockStats))
      .mockResolvedValueOnce(mockFetchResponse([]))
      .mockResolvedValueOnce(mockFetchResponse([]))

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.error).toBe(null)
  })

  it('handles fetch errors correctly', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Error cargando datos del dashboard')
  })
})