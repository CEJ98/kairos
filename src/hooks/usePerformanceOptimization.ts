/**
 * Performance Optimization Hooks for React Components
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { PerformanceMonitor } from '@/lib/performance'
import { WebVitalsMonitor } from '@/lib/performance-enhancements'

/**
 * Hook for optimized component rendering with performance tracking
 */
export function useOptimizedRender(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current++
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now

    // Track render performance
    PerformanceMonitor.recordMetric(`render.${componentName}`, timeSinceLastRender)

    // Warn about excessive re-renders
    if (renderCount.current > 10 && timeSinceLastRender < 100) {
      console.warn(`Component ${componentName} is re-rendering frequently (${renderCount.current} times)`)
    }
  })

  return {
    renderCount: renderCount.current,
    resetRenderCount: () => { renderCount.current = 0 }
  }
}

/**
 * Hook for debounced values to prevent excessive API calls
 */
export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for throttled callbacks to limit function execution frequency
 */
export function useThrottled<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback((...args: any[]) => {
    const now = Date.now()
    if (now - lastRun.current >= delay) {
      lastRun.current = now
      return callback(...args)
    }
  }, [callback, delay]) as T
}

/**
 * Hook for intersection observer with performance optimization
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const elementRef = useRef<Element | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setElement = useCallback((element: Element | null) => {
    elementRef.current = element
  }, [])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [options])

  return { isIntersecting, entry, setElement }
}

/**
 * Hook for virtual scrolling optimization
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, start + visibleCount + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  }
}

/**
 * Hook for optimized API requests with caching and deduplication
 */
export function useOptimizedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    retry?: number
  } = {}
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)

  const executeQuery = useCallback(async () => {
    if (!enabled) return

    // Check cache first
    const cached = cacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < staleTime) {
      setData(cached.data)
      return cached.data
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    const stopTimer = PerformanceMonitor.startTimer(`query.${key}`)

    try {
      let lastError: Error
      
      for (let attempt = 0; attempt <= retry; attempt++) {
        try {
          const result = await queryFn()
          
          // Cache the result
          cacheRef.current.set(key, {
            data: result,
            timestamp: Date.now()
          })
          
          setData(result)
          setIsLoading(false)
          stopTimer()
          
          return result
        } catch (err) {
          lastError = err as Error
          
          if (attempt < retry) {
            // Exponential backoff
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            )
          }
        }
      }
      
      throw lastError!
    } catch (err) {
      const error = err as Error
      setError(error)
      setIsLoading(false)
      stopTimer()
      throw error
    }
  }, [key, queryFn, enabled, staleTime, retry, abortControllerRef])

  useEffect(() => {
    executeQuery().catch(() => {}) // Error is handled in the function

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [executeQuery])

  // Cleanup cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      for (const [cacheKey, cached] of cacheRef.current.entries()) {
        if (now - cached.timestamp > cacheTime) {
          cacheRef.current.delete(cacheKey)
        }
      }
    }, cacheTime)

    return () => clearInterval(interval)
  }, [cacheTime])

  return {
    data,
    isLoading,
    error,
    refetch: executeQuery,
    invalidate: () => cacheRef.current.delete(key)
  }
}

/**
 * Hook for monitoring component performance metrics
 */
export function usePerformanceMetrics(componentName: string) {
  const mountTime = useRef(Date.now())
  const [metrics, setMetrics] = useState({
    mountDuration: 0,
    renderCount: 0,
    lastRenderDuration: 0
  })

  useEffect(() => {
		const mountDuration = Date.now() - mountTime.current
		PerformanceMonitor.recordMetric(`mount.${componentName}`, mountDuration)
		
		setMetrics(prev => ({
			...prev,
			mountDuration,
			renderCount: prev.renderCount + 1
		}))
	}, [componentName])

  useEffect(() => {
    const renderStart = Date.now()
    
    return () => {
      const renderDuration = Date.now() - renderStart
      PerformanceMonitor.recordMetric(`render.${componentName}`, renderDuration)
      
      setMetrics(prev => ({
        ...prev,
        lastRenderDuration: renderDuration,
        renderCount: prev.renderCount + 1
      }))
    }
  }, [componentName])

  return metrics
}

/**
 * Hook for Web Vitals monitoring in components
 */
export function useWebVitals() {
  const [vitals, setVitals] = useState({})

  useEffect(() => {
    const updateVitals = () => {
      setVitals(WebVitalsMonitor.getVitals())
    }

    // Update vitals periodically
    const interval = setInterval(updateVitals, 5000)
    updateVitals()

    return () => clearInterval(interval)
  }, [])

  return vitals
}

/**
 * Hook for memory usage monitoring
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return
    }

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory
      setMemoryInfo({
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
      })
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}